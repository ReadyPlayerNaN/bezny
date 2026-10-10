// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { FormProvider, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FieldLabel, Submit, ToggleField, ToggleInput } from "../src/index.js";

interface SettingsValues {
  notifications: boolean;
}
interface SettingsFormProps {
  disabled?: boolean;
  explicitControl?: boolean;
  onSubmit: SubmitHandler<SettingsValues>;
  validate?: boolean;
}
const SettingsForm = ({
  disabled = false,
  explicitControl = false,
  onSubmit,
  validate = false,
}: SettingsFormProps) => {
  const form = useForm<SettingsValues>({
    defaultValues: { notifications: false },
    mode: "onBlur",
  });
  const content = (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <span id="notice-description">Notification settings</span>
      <ToggleField<SettingsValues>
        {...(explicitControl ? { control: form.control } : {})}
        name="notifications"
        id="notifications"
        label="Notifications"
        help="Receive updates"
        aria-describedby="notice-description"
        disabled={disabled}
        rules={validate ? { required: "Enable notifications" } : {}}
      />
      <output aria-label="Touched">
        {String(form.formState.touchedFields.notifications === true)}
      </output>
      <Submit>Save</Submit>
      <button type="button" onClick={() => form.reset()}>
        Reset
      </button>
      <button type="button" onClick={() => form.setFocus("notifications")}>
        Focus
      </button>
    </form>
  );
  return explicitControl ? (
    content
  ) : (
    <FormProvider {...form}>{content}</FormProvider>
  );
};

describe(ToggleInput, () => {
  afterEach(cleanup);

  it("works without RHF and forwards labels, refs, and Space/Enter activation", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    const handleCheckedChange = vi.fn<(checked: boolean) => void>();
    render(
      <>
        <FieldLabel htmlFor="standalone-toggle">Notifications</FieldLabel>
        <ToggleInput
          id="standalone-toggle"
          ref={ref}
          defaultChecked
          onCheckedChange={handleCheckedChange}
        />
      </>
    );
    const toggle = screen.getByRole("switch", { name: "Notifications" });
    await user.tab();
    expect({ focus: document.activeElement, ref: ref.current }).toStrictEqual({
      focus: toggle,
      ref: toggle,
    });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    await user.keyboard(" ");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    await user.keyboard("{Enter}");
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(handleCheckedChange.mock.calls).toStrictEqual([[false], [true]]);
  });

  it("preserves controlled state and caller presentation props", async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn<(checked: boolean) => void>();
    const { rerender } = render(
      <ToggleInput
        aria-label="Notifications"
        className="custom-toggle"
        checked={false}
        onCheckedChange={handleCheckedChange}
        dir="rtl"
        aria-invalid="true"
      />
    );
    const toggle = screen.getByRole("switch", { name: "Notifications" });
    await user.click(toggle);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(toggle.classList.contains("custom-toggle")).toBeTruthy();
    expect({
      direction: toggle.getAttribute("dir"),
      invalid: toggle.getAttribute("aria-invalid"),
    }).toStrictEqual({ direction: "rtl", invalid: "true" });
    rerender(
      <ToggleInput
        aria-label="Notifications"
        checked
        onCheckedChange={handleCheckedChange}
      />
    );
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("preserves native form values and never submits when activated", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn<() => void>();
    render(
      <form
        aria-label="Settings"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <ToggleInput
          name="notifications"
          value="enabled"
          aria-label="Notifications"
          defaultChecked
        />
      </form>
    );
    const form = screen.getByRole("form", {
      name: "Settings",
    }) as HTMLFormElement;
    const toggle = screen.getByRole("switch", { name: "Notifications" });
    expect(new FormData(form).get("notifications")).toBe("enabled");
    await user.click(toggle);
    expect(new FormData(form).get("notifications")).toBeNull();
    await user.keyboard("{Enter}");
    expect(new FormData(form).get("notifications")).toBe("enabled");
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("keeps disabled switches inert and out of tab order", async () => {
    const user = userEvent.setup();
    const handleCheckedChange = vi.fn<(checked: boolean) => void>();
    render(
      <>
        <ToggleInput
          aria-label="Notifications"
          disabled
          onCheckedChange={handleCheckedChange}
        />
        <button type="button">Continue</button>
      </>
    );
    const toggle = screen.getByRole("switch", { name: "Notifications" });
    await user.click(toggle);
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Continue" })
    );
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(handleCheckedChange).not.toHaveBeenCalled();
  });
});

describe(ToggleField, () => {
  afterEach(cleanup);

  it("binds boolean values through FormProvider, label activation, and reset", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<SubmitHandler<SettingsValues>>();
    render(<SettingsForm onSubmit={onSubmit} />);
    const toggle = screen.getByRole("switch", { name: "Notifications" });
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0]).toStrictEqual({ notifications: false });
    await user.click(screen.getByText("Notifications"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1]?.[0]).toStrictEqual({ notifications: true });
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("supports explicit control and RHF setFocus without a provider", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<SubmitHandler<SettingsValues>>();
    render(<SettingsForm onSubmit={onSubmit} explicitControl />);
    const toggle = screen.getByRole("switch", { name: "Notifications" });
    await user.click(screen.getByRole("button", { name: "Focus" }));
    expect(document.activeElement).toBe(toggle);
    await user.keyboard(" ");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0]).toStrictEqual({ notifications: true });
  });

  it("announces errors, preserves descriptions, and focuses the invalid switch", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<SubmitHandler<SettingsValues>>();
    render(<SettingsForm onSubmit={onSubmit} validate />);
    const toggle = screen.getByRole("switch", { name: "Notifications" });
    await user.click(screen.getByRole("button", { name: "Save" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Enable notifications");
    expect(toggle.getAttribute("aria-invalid")).toBe("true");
    expect(toggle.getAttribute("aria-required")).toBe("true");
    expect(toggle.getAttribute("aria-describedby")?.split(" ")).toStrictEqual([
      "notice-description",
      alert.id,
      screen.getByText("Receive updates").id,
    ]);
    await waitFor(() => expect(document.activeElement).toBe(toggle));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("forwards blur to touched state and clears validation feedback after enabling", async () => {
    const user = userEvent.setup();
    render(<SettingsForm onSubmit={() => {}} validate />);
    await user.tab();
    await user.tab();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Enable notifications");
    expect(screen.getByRole("status", { name: "Touched" }).textContent).toBe(
      "true"
    );
    await user.click(screen.getByRole("switch", { name: "Notifications" }));
    await user.tab();
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  it("disables the bound switch and omits its submitted value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<SubmitHandler<SettingsValues>>();
    render(<SettingsForm onSubmit={onSubmit} disabled validate />);
    const toggle = screen.getByRole("switch", {
      name: "Notifications",
    }) as HTMLButtonElement;
    expect(toggle.disabled).toBeTruthy();
    await user.click(toggle);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0].notifications).toBeUndefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
