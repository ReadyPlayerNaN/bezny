// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CronField, CronInput } from "../src/index.js";

const Controlled = ({
  initialValue = "0 0 * * *",
}: {
  initialValue?: string;
}) => {
  const [value, setValue] = useState(initialValue);
  return (
    <CronInput aria-label="Schedule" value={value} onValueChange={setValue} />
  );
};
const Form = ({
  provider,
  save,
}: {
  provider: boolean;
  save: (values: { schedule: string }) => void;
}) => {
  const form = useForm({ defaultValues: { schedule: "" } });
  const content = (
    <form noValidate onSubmit={form.handleSubmit(save)}>
      <CronField
        label="Schedule"
        help="Five fields"
        name="schedule"
        {...(provider ? {} : { control: form.control })}
        rules={{ required: "Schedule required" }}
      />
      <button type="submit">Save</button>
      <button type="button" onClick={() => form.reset()}>
        Reset
      </button>
    </form>
  );
  return provider ? <FormProvider {...form}>{content}</FormProvider> : content;
};

describe(CronInput, () => {
  afterEach(cleanup);

  it("offers hourly, daily, weekly and monthly modes without a second value owner", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Cron builder" }));
    await user.click(screen.getByRole("radio", { name: "Hourly" }));
    expect(
      (screen.getByRole("textbox", { name: "Schedule" }) as HTMLInputElement)
        .value
    ).toBe("0 * * * *");
    await user.click(screen.getByRole("combobox", { name: "Every N hours" }));
    await user.click(screen.getByRole("option", { name: "02" }));
    expect(
      (screen.getByRole("textbox", { name: "Schedule" }) as HTMLInputElement)
        .value
    ).toBe("0 */2 * * *");
    await user.click(screen.getByRole("radio", { name: "Weekly" }));
    await user.click(screen.getByRole("button", { name: "Tuesday" }));
    expect(
      (screen.getByRole("textbox", { name: "Schedule" }) as HTMLInputElement)
        .value
    ).toBe("0 0 * * 1,2");
    await user.click(screen.getByRole("radio", { name: "Monthly" }));
    await user.click(screen.getByRole("button", { name: "31" }));
    expect(
      (screen.getByRole("textbox", { name: "Schedule" }) as HTMLInputElement)
        .value
    ).toBe("0 0 1,31 * *");
    await user.click(screen.getByRole("radio", { name: "Daily" }));
    expect(
      (screen.getByRole("textbox", { name: "Schedule" }) as HTMLInputElement)
        .value
    ).toBe("0 0 * * *");
  });

  it("keeps custom raw drafts and explicit Custom choice without silently rewriting", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Cron builder" }));
    await user.click(screen.getByRole("radio", { name: "Custom" }));
    const raw = screen.getByRole("textbox", { name: "Raw expression" });
    await user.clear(raw);
    await user.type(raw, "0 12 * * MON-FRI");
    expect(
      (screen.getByRole("textbox", { name: "Schedule" }) as HTMLInputElement)
        .value
    ).toBe("0 12 * * MON-FRI");
    expect(
      screen.getByRole("radio", { name: "Custom" }).getAttribute("aria-checked")
    ).toBe("true");
    await user.clear(raw);
    await user.type(raw, "invalid");
    expect(screen.getAllByText("Invalid cron expression")).toHaveLength(2);
  });

  it("keeps an initially custom editor mounted when a draft becomes representable", async () => {
    const user = userEvent.setup();
    render(<Controlled initialValue="* * * * *" />);
    await user.click(screen.getByRole("button", { name: "Cron builder" }));
    const raw = screen.getByRole("textbox", { name: "Raw expression" });
    await user.clear(raw);
    await user.type(raw, "15 9 * * *");
    expect(screen.getByRole("textbox", { name: "Raw expression" })).toBe(raw);
    expect((raw as HTMLInputElement).value).toBe("15 9 * * *");
    expect(document.activeElement).toBe(raw);
  });

  it("updates open builders from external controlled values and never emits on mode inspection", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string) => void>();
    const { rerender } = render(
      <CronInput
        value="0 0 * * *"
        onValueChange={change}
        aria-label="Schedule"
      />
    );
    await user.click(screen.getByRole("button", { name: "Cron builder" }));
    await user.click(screen.getByRole("radio", { name: "Custom" }));
    expect(change).not.toHaveBeenCalled();
    rerender(
      <CronInput
        value="15 6 * * 1,3"
        onValueChange={change}
        aria-label="Schedule"
      />
    );
    expect(
      screen.getByRole("radio", { name: "Weekly" }).getAttribute("aria-checked")
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Wednesday" })
        .getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("forwards input refs/native props, localizes labels/description and restores focus on Escape", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    const blur = vi.fn<() => void>();
    render(
      <CronInput
        ref={ref}
        name="schedule"
        value="0 0 * * *"
        onValueChange={() => {}}
        onBlur={blur}
        aria-label="Schedule"
        aria-describedby="outside"
        labels={{ builder: "Edit schedule", daily: "Every day" }}
        describeExpression={() => "Localized preview"}
      />
    );
    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Schedule" }));
    expect(ref.current?.getAttribute("aria-describedby")?.split(" ")).toContain(
      "outside"
    );
    await user.click(screen.getByRole("button", { name: "Edit schedule" }));
    expect(screen.getByRole("radio", { name: "Every day" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Edit schedule" })
      )
    );
    expect(blur).toHaveBeenCalledWith();
  });

  it("blocks disabled/read-only inputs and an already-open disabled builder", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(value: string) => void>();
    const { rerender } = render(
      <CronInput
        value="0 0 * * *"
        onValueChange={change}
        aria-label="Schedule"
      />
    );
    await user.click(screen.getByRole("button", { name: "Cron builder" }));
    rerender(
      <CronInput
        value="0 0 * * *"
        onValueChange={change}
        disabled
        aria-label="Schedule"
      />
    );
    await user.click(screen.getByRole("radio", { name: "Weekly" }));
    expect(change).not.toHaveBeenCalled();
    expect(
      screen.getByRole("combobox", { name: "Hour" }).hasAttribute("disabled")
    ).toBeTruthy();
    await user.keyboard("{Escape}");
    rerender(
      <CronInput
        value="0 0 * * *"
        onValueChange={change}
        readOnly
        aria-label="Schedule"
      />
    );
    expect(
      screen
        .getByRole("button", { name: "Cron builder" })
        .hasAttribute("disabled")
    ).toBeTruthy();
    expect(
      (screen.getByRole("textbox", { name: "Schedule" }) as HTMLInputElement)
        .readOnly
    ).toBeTruthy();
  });

  it.each([false, true])(
    "binds RHF required/error focus/submit/reset with provider=%s",
    async (provider) => {
      const user = userEvent.setup();
      const save = vi.fn<(values: { schedule: string }) => void>();
      render(<Form provider={provider} save={save} />);
      await user.click(screen.getByRole("button", { name: "Save" }));
      const input = screen.getByRole("textbox", { name: "Schedule" });
      await waitFor(() => expect(document.activeElement).toBe(input));
      expect(screen.getByRole("alert").textContent).toBe("Schedule required");
      await user.type(input, "0 0 * * *");
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(save.mock.calls[0]?.[0]).toStrictEqual({ schedule: "0 0 * * *" });
      await user.click(screen.getByRole("button", { name: "Reset" }));
      expect((input as HTMLInputElement).value).toBe("");
      expect(screen.queryByRole("alert")).toBeNull();
    }
  );
});
