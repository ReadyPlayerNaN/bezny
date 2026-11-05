// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DateField, DateInput, MonthField, MonthInput } from "../src/index.js";
import { parseCalendarValue } from "../src/inputs/calendar-value.js";
import type { CalendarKind } from "../src/inputs/calendar-value.js";

const Controlled = ({ kind = "date" }: { kind?: CalendarKind }) => {
  const [value, setValue] = useState(
    kind === "date" ? "2024-02-29" : "2024-02"
  );
  const Input = kind === "date" ? DateInput : MonthInput;
  return (
    <>
      <Input
        aria-label="Value"
        value={value}
        onValueChange={setValue}
        today={kind === "date" ? "2024-03-02" : "2024-03"}
      />
      <output aria-label="ISO value">{value}</output>
    </>
  );
};
interface Values {
  value: string;
}
interface FormProps {
  kind: CalendarKind;
  provider?: boolean;
  initialValue?: string;
  save: (value: Values) => void;
  resolver?: Resolver<Values>;
  reject?: boolean;
}
const Form = ({
  kind,
  provider = false,
  initialValue = "",
  save,
  resolver,
  reject = false,
}: FormProps) => {
  const form = useForm<Values>({
    defaultValues: { value: initialValue },
    ...(resolver ? { resolver } : {}),
  });
  const Field = kind === "date" ? DateField : MonthField;
  const rules = reject
    ? { validate: { calendar: () => "Domain rejection" } }
    : { required: "Required" };
  const content = (
    <form noValidate onSubmit={form.handleSubmit(save)}>
      <Field
        name="value"
        label="Value"
        help="Calendar value"
        {...(provider ? {} : { control: form.control })}
        rules={rules}
        today={kind === "date" ? "2024-03-02" : "2024-03"}
      />
      <button type="submit">Save</button>
      <button type="button" onClick={() => form.reset()}>
        Reset
      </button>
    </form>
  );
  return provider ? <FormProvider {...form}>{content}</FormProvider> : content;
};
const isoResolver: Resolver<Values> = (values) => {
  if (parseCalendarValue(values.value, "date")) {
    return { errors: {}, values };
  }
  return {
    errors: { value: { message: "Schema requires ISO date", type: "schema" } },
    values: {},
  };
};

describe("Date and month inputs", () => {
  afterEach(cleanup);

  it("retains invalid typed drafts without emitting rolled-over dates", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string) => void>();
    render(
      <DateInput
        aria-label="Date"
        value="2024-02-29"
        onValueChange={change}
        today="2024-03-02"
      />
    );
    const input = screen.getByRole("textbox", { name: "Date" });
    await user.clear(input);
    await user.type(input, "02/31/2024");
    await user.tab();
    expect((input as HTMLInputElement).value).toBe("02/31/2024");
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Enter a valid date");
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByRole("alert").id
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("commits localized and compact text on Enter/blur, then clears explicitly", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole("textbox", { name: "Value" });
    await user.clear(input);
    await user.type(input, "02282024");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("ISO value").textContent).toBe("2024-02-28");
    expect((input as HTMLInputElement).value).toBe("02/28/2024");
    await user.clear(input);
    await user.tab();
    expect(screen.getByLabelText("ISO value").textContent).toBe("");
  });

  it("uses the controlled value and locale after external updates, not an old invalid draft", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string) => void>();
    const { rerender } = render(
      <DateInput aria-label="Date" value="2024-02-29" onValueChange={change} />
    );
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "invalid");
    await user.tab();
    rerender(
      <DateInput
        aria-label="Date"
        value="2025-06-15"
        locale="cs"
        onValueChange={change}
      />
    );
    expect((input as HTMLInputElement).value).toBe("15. 06. 2025");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(change).not.toHaveBeenCalled();
  });

  it("supports keyboard day navigation across months and restores trigger focus after selection", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const trigger = screen.getByRole("button", { name: "Open calendar" });
    await user.click(trigger);
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "February 29, 2024" })
      )
    );
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "March 7, 2024" })
    );
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("ISO value").textContent).toBe("2024-03-07");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("changes year pages without committing and retains correct leap-year geometry", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.click(
      screen.getByRole("button", { name: "Choose year: February 2024" })
    );
    await user.click(screen.getByRole("button", { name: "2025" }));
    expect(screen.getByLabelText("ISO value").textContent).toBe("2024-02-29");
    expect(
      screen.queryByRole("button", { name: "February 29, 2025" })
    ).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "February 28, 2025" })
    );
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("ISO value").textContent).toBe("2025-02-28");
  });

  it("refreshes an open calendar from external values without emitting a selection", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string) => void>();
    const { rerender } = render(
      <DateInput aria-label="Date" value="2024-02-29" onValueChange={change} />
    );
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    rerender(
      <DateInput aria-label="Date" value="2025-06-15" onValueChange={change} />
    );
    expect(screen.getByRole("grid", { name: "June 2025" })).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "June 15, 2025" })
      )
    );
    expect(change).not.toHaveBeenCalled();
  });

  it("moves focus into the grid when year-page navigation reaches a disabled boundary", async () => {
    const user = userEvent.setup();
    render(
      <DateInput
        aria-label="Date"
        value="2024-02-29"
        min="2020-01-01"
        max="2030-12-31"
        onValueChange={() => {}}
      />
    );
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.click(
      screen.getByRole("button", { name: "Choose year: February 2024" })
    );
    const next = screen.getByRole("button", { name: "Next years" });
    await user.click(next);
    expect(screen.getByRole("grid", { name: "2028–2039" })).toBeTruthy();
    expect(next.hasAttribute("disabled")).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "2028" })
    );
    expect(
      screen.getByRole("button", { name: "2031" }).hasAttribute("disabled")
    ).toBeTruthy();
    const previous = screen.getByRole("button", { name: "Previous years" });
    await user.click(previous);
    expect(screen.getByRole("grid", { name: "2016–2027" })).toBeTruthy();
  });

  it("bounds calendar days, page buttons and Today without allowing disabled activation", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string) => void>();
    render(
      <DateInput
        aria-label="Date"
        value="2024-02-29"
        min="2024-02-25"
        max="2024-03-02"
        today="2024-03-03"
        onValueChange={change}
      />
    );
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    expect(
      screen
        .getByRole("button", { name: "Previous month" })
        .hasAttribute("disabled")
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "February 24, 2024" })
        .hasAttribute("disabled")
    ).toBeTruthy();
    const today = screen.getByRole("button", { name: "Today" });
    expect(today.hasAttribute("disabled")).toBeTruthy();
    await user.click(today);
    expect(change).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(
      screen
        .getByRole("button", { name: "Next month" })
        .hasAttribute("disabled")
    ).toBeTruthy();
  });

  it("rejects typed bounds and caller minimum-year violations while retaining the draft", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string) => void>();
    render(
      <DateInput
        aria-label="Date"
        value=""
        minYear={1900}
        max="2024-12-31"
        onValueChange={change}
      />
    );
    const input = screen.getByRole("textbox");
    await user.type(input, "01/01/1800");
    await user.keyboard("{Enter}");
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe(
      "Choose a value within the allowed range"
    );
    await user.clear(input);
    await user.type(input, "01/01/2025");
    await user.tab();
    expect(change).not.toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe("01/01/2025");
  });

  it("chooses Today and Clear through the same controlled value callback", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getByLabelText("ISO value").textContent).toBe("2024-03-02");
    await user.click(screen.getByRole("button", { name: "Open calendar" }));
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByLabelText("ISO value").textContent).toBe("");
  });

  it("supports month text, year navigation, month selection and current month", async () => {
    const user = userEvent.setup();
    render(<Controlled kind="month" />);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "082024");
    await user.tab();
    expect(screen.getByLabelText("ISO value").textContent).toBe("2024-08");
    await user.click(screen.getByRole("button", { name: "Choose month" }));
    await user.click(screen.getByRole("button", { name: "Next year" }));
    await user.click(screen.getByRole("button", { name: "June 2025" }));
    expect(screen.getByLabelText("ISO value").textContent).toBe("2025-06");
    await user.click(screen.getByRole("button", { name: "Choose month" }));
    await user.click(screen.getByRole("button", { name: "Current month" }));
    expect(screen.getByLabelText("ISO value").textContent).toBe("2024-03");
  });

  it("bounds month choices and year pages", async () => {
    const user = userEvent.setup();
    render(
      <MonthInput
        aria-label="Month"
        value="2024-06"
        min="2024-03"
        max="2024-08"
        today="2024-09"
        onValueChange={() => {}}
      />
    );
    await user.click(screen.getByRole("button", { name: "Choose month" }));
    expect(
      screen
        .getByRole("button", { name: "February 2024" })
        .hasAttribute("disabled")
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Next year" }).hasAttribute("disabled")
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Choose year: 2024" }));
    expect(
      screen.getByRole("button", { name: "2023" }).hasAttribute("disabled")
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Next years" })
        .hasAttribute("disabled")
    ).toBeTruthy();
  });

  it("does not commit IME Enter, including the post-composition 229 event", () => {
    const change = vi.fn<(value: string) => void>();
    render(<DateInput aria-label="Date" value="" onValueChange={change} />);
    const input = screen.getByRole("textbox");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "02/29/2024" } });
    fireEvent.keyDown(input, { isComposing: true, key: "Enter" });
    expect(change).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(change).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(change).toHaveBeenCalledWith("2024-02-29");
  });

  it.each(["disabled", "readOnly"] as const)(
    "closes and blocks an already-open %s control without reopening on re-enable",
    async (mode) => {
      const user = userEvent.setup();
      const change = vi.fn<(value: string) => void>();
      const ref = createRef<HTMLInputElement>();
      const props = {
        "aria-label": "Date",
        onValueChange: change,
        ref,
        value: "2024-02-29",
      };
      const { rerender } = render(<DateInput {...props} />);
      await user.click(screen.getByRole("button", { name: "Open calendar" }));
      expect(ref.current).toBe(screen.getByRole("textbox"));
      rerender(<DateInput {...props} {...{ [mode]: true }} />);
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(
        screen
          .getByRole("button", { name: "Open calendar" })
          .hasAttribute("disabled")
      ).toBeTruthy();
      rerender(<DateInput {...props} />);
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(change).not.toHaveBeenCalled();
    }
  );

  it.each([false, true])(
    "binds RHF required/focus, canonical submission and reset with provider=%s",
    async (provider) => {
      const user = userEvent.setup();
      const save = vi.fn<(value: Values) => void>();
      render(<Form kind="date" provider={provider} save={save} />);
      await user.click(screen.getByRole("button", { name: "Save" }));
      const input = screen.getByRole("textbox", { name: "Value" });
      await waitFor(() => expect(document.activeElement).toBe(input));
      expect(screen.getByRole("alert").textContent).toBe("Required");
      await user.type(input, "02/29/2024");
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(save.mock.calls[0]?.[0]).toStrictEqual({ value: "2024-02-29" });
      await user.click(screen.getByRole("button", { name: "Reset" }));
      expect((input as HTMLInputElement).value).toBe("");
      expect(screen.queryByRole("alert")).toBeNull();
    }
  );

  it.each(["date", "month"] as const)(
    "does not submit a stale valid %s when the user has an invalid draft",
    async (kind) => {
      const user = userEvent.setup();
      const save = vi.fn<(value: Values) => void>();
      const initialValue = kind === "date" ? "2024-02-29" : "2024-02";
      render(<Form kind={kind} initialValue={initialValue} save={save} />);
      const input = screen.getByRole("textbox");
      await user.clear(input);
      await user.type(input, "invalid");
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(save).not.toHaveBeenCalled();
      expect((input as HTMLInputElement).value).toBe("invalid");
      expect(screen.getAllByRole("alert")).toHaveLength(1);
      await user.click(screen.getByRole("button", { name: "Reset" }));
      expect((input as HTMLInputElement).value).toBe(
        kind === "date" ? "02/29/2024" : "02/2024"
      );
      expect(screen.queryByRole("alert")).toBeNull();
    }
  );

  it("passes current raw drafts to an application resolver rather than hiding them behind a previous ISO value", async () => {
    const user = userEvent.setup();
    const save = vi.fn<(value: Values) => void>();
    render(
      <Form
        kind="date"
        initialValue="2024-02-29"
        resolver={isoResolver}
        save={save}
      />
    );
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "not a date");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe(
      "Schema requires ISO date"
    );
  });

  it("preserves caller validation even when its name collides with the built-in calendar rule", async () => {
    const user = userEvent.setup();
    const save = vi.fn<(value: Values) => void>();
    render(<Form kind="date" initialValue="2024-02-29" reject save={save} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Domain rejection");
  });
});
