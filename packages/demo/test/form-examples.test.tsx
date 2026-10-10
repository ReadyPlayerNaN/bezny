import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { FieldExamples } from "../src/field-examples.js";
import { InputExamples } from "../src/input-examples.js";

describe("input examples", () => {
  afterEach(cleanup);

  it("supports text entry, checkbox changes, and keyboard toggle activation", async () => {
    const user = userEvent.setup();
    render(<InputExamples />);

    await user.type(
      screen.getByRole("textbox", { name: "TextInput" }),
      "Project"
    );
    expect(
      screen
        .getByRole("textbox", { name: "TextInput" })
        .getAttribute("aria-describedby")
    ).toBe("example-text-help");
    await user.click(screen.getByRole("checkbox", { name: "CheckboxInput" }));
    expect(
      screen
        .getByRole("checkbox", { name: "CheckboxInput" })
        .getAttribute("aria-checked")
    ).toBe("false");
    screen.getByRole("switch", { name: "ToggleInput" }).focus();
    await user.keyboard(" ");
    expect(
      screen.getByRole("status", { name: "Standalone toggle state" })
        .textContent
    ).toBe("Notifications on");
  });

  it("supports radio keyboard navigation and exposes indeterminate and disabled states", async () => {
    const user = userEvent.setup();
    render(<InputExamples />);

    screen.getByRole("radio", { name: "Standard delivery" }).focus();
    await user.keyboard("{ArrowDown>}");
    await waitFor(() =>
      expect(
        screen
          .getByRole("radio", { name: "Express delivery" })
          .getAttribute("aria-checked")
      ).toBe("true")
    );
    await user.keyboard("{/ArrowDown}");
    expect(
      screen
        .getByRole("checkbox", { name: "Indeterminate CheckboxInput" })
        .getAttribute("aria-checked")
    ).toBe("mixed");
    expect(
      screen
        .getByRole("switch", { name: "Disabled ToggleInput" })
        .hasAttribute("disabled")
    ).toBeTruthy();
  });
});

describe("field examples", () => {
  afterEach(cleanup);

  it("announces validation errors and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    render(<FieldExamples />);

    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(3));
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "TextField: Name" })
    );
    expect(
      screen
        .getByRole("textbox", { name: "TextField: Name" })
        .getAttribute("aria-invalid")
    ).toBe("true");
    expect(
      screen.getByRole("status", { name: "Form submission" }).textContent
    ).toBe("No profile submitted yet.");
  });

  it("submits all field values and resets the form", async () => {
    const user = userEvent.setup();
    render(<FieldExamples />);
    const form = within(screen.getByRole("form", { name: "Profile example" }));

    await user.type(
      form.getByRole("textbox", { name: "TextField: Name" }),
      "Ada"
    );
    await user.type(
      form.getByRole("textbox", { name: "EmailField: Email" }),
      "ada@example.com"
    );
    await user.type(
      form.getByRole("textbox", { name: "TextareaField: Notes" }),
      "Hello"
    );
    await user.click(
      form.getByRole("checkbox", { name: "CheckboxField: Accept terms" })
    );
    await user.click(form.getByRole("radio", { name: "Pro plan" }));
    await user.click(
      form.getByRole("switch", { name: "ToggleField: Notifications" })
    );
    await user.click(form.getByRole("button", { name: "Save profile" }));
    await waitFor(() =>
      expect(
        screen.getByLabelText("Submitted profile values").textContent
      ).toBe(
        JSON.stringify(
          {
            accepted: true,
            email: "ada@example.com",
            name: "Ada",
            notes: "Hello",
            notifications: true,
            plan: "pro",
          },
          null,
          2
        )
      )
    );

    await user.click(form.getByRole("button", { name: "Reset profile" }));
    expect(screen.queryByLabelText("Submitted profile values")).toBeNull();
    expect(
      form
        .getByRole("radio", { name: "Basic plan" })
        .getAttribute("aria-checked")
    ).toBe("true");
    expect(
      form
        .getByRole("switch", { name: "ToggleField: Notifications" })
        .getAttribute("aria-checked")
    ).toBe("false");
  });
});
