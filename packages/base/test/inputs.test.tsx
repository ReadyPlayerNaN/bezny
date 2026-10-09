// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CheckboxInput,
  FieldFeedback,
  FieldLabel,
  RadioGroupInput,
  RadioInput,
  TextareaInput,
  TextInput,
} from "../src/index.js";

describe("RHF-unbound inputs and field presentation", () => {
  afterEach(cleanup);

  it("uses TextInput without form context and forwards input props/ref", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn<() => void>();
    render(
      <TextInput
        ref={ref}
        aria-label="Name"
        defaultValue="Ada"
        onChange={onChange}
        prefix="$"
        minValue={1}
        maxValue={9}
      />
    );
    const input = screen.getByRole("textbox", { name: "Name" });
    fireEvent.change(input, { target: { value: "Grace" } });
    expect(ref.current).toBe(input);
    expect(ref.current?.value).toBe("Grace");
    expect(onChange).toHaveBeenCalledOnce();
    expect({
      max: input.getAttribute("max"),
      min: input.getAttribute("min"),
    }).toStrictEqual({ max: "9", min: "1" });
    expect(screen.getByText("$").getAttribute("aria-hidden")).toBe("true");
  });

  it("preserves textarea rows, values, and refs without RHF", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<TextareaInput ref={ref} aria-label="Notes" defaultValue="Hello" />);
    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Notes" }));
    expect(ref.current?.rows).toBe(3);
    expect(ref.current?.value).toBe("Hello");
  });

  it("supports native labels and decorative required markers", () => {
    render(
      <>
        <FieldLabel htmlFor="name" required>
          Name
        </FieldLabel>
        <TextInput id="name" />
      </>
    );
    expect(screen.getByRole("textbox", { name: "Name" }).id).toBe("name");
    expect(screen.getByText("*").getAttribute("aria-hidden")).toBe("true");
  });

  it("renders separate identified feedback and accessible error announcements", () => {
    render(
      <FieldFeedback
        error="Invalid name"
        errorId="name-error"
        help="Use your full name"
        helpId="name-help"
      />
    );
    expect(screen.getByRole("alert").id).toBe("name-error");
    expect(screen.getByText("Use your full name").id).toBe("name-help");
  });

  it("omits empty feedback", () => {
    const { container } = render(<FieldFeedback />);
    expect(container.childElementCount).toBe(0);
  });

  it("uses Radix checkbox state, refs, and keyboard activation without RHF", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    const onCheckedChange =
      vi.fn<(checked: boolean | "indeterminate") => void>();
    render(
      <CheckboxInput
        ref={ref}
        aria-label="Accept"
        onCheckedChange={onCheckedChange}
      />
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept" });
    checkbox.focus();
    await user.keyboard(" ");
    expect(ref.current).toBe(checkbox);
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("preserves indeterminate checkbox semantics", () => {
    render(<CheckboxInput aria-label="Mixed" checked="indeterminate" />);
    expect(
      screen
        .getByRole("checkbox", { name: "Mixed" })
        .getAttribute("aria-checked")
    ).toBe("mixed");
  });

  it("keeps disabled checkboxes inert", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn<() => void>();
    render(
      <CheckboxInput
        aria-label="Accept"
        disabled
        onCheckedChange={onCheckedChange}
      />
    );
    await user.click(screen.getByRole("checkbox", { name: "Accept" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("uses Radix radio-group keyboard navigation and native form values", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <form aria-label="Plan form">
        <RadioGroupInput
          name="plan"
          aria-label="Plan"
          defaultValue="basic"
          onValueChange={onValueChange}
        >
          <RadioInput value="basic" aria-label="Basic" />
          <RadioInput value="pro" aria-label="Pro" />
        </RadioGroupInput>
      </form>
    );
    screen.getByRole("radio", { name: "Basic" }).focus();
    await user.keyboard("{ArrowDown>}");
    await waitFor(() => {
      expect(
        screen.getByRole("radio", { name: "Pro" }).getAttribute("aria-checked")
      ).toBe("true");
    });
    await user.keyboard("{/ArrowDown}");
    expect(onValueChange).toHaveBeenCalledWith("pro");
    expect(
      new FormData(
        screen.getByRole("form", { name: "Plan form" }) as HTMLFormElement
      ).get("plan")
    ).toBe("pro");
  });
});
