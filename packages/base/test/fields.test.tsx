// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CheckboxField,
  EmailField,
  RadioField,
  Submit,
  TextareaField,
  TextField,
} from "../src/index.js";

interface ProfileValues {
  accepted: boolean;
  email: string;
  name: string;
  notes: string;
  plan: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const planOptions = [
  { label: "Basic", value: "basic" },
  { label: "Pro", value: "pro" },
];

const ProfileForm = ({
  onSubmit,
  disabled = false,
}: {
  onSubmit: SubmitHandler<ProfileValues>;
  disabled?: boolean;
}) => {
  const form = useForm<ProfileValues>({
    defaultValues: {
      accepted: true,
      email: "ada@example.com",
      name: "Ada",
      notes: "Hello",
      plan: "basic",
    },
    mode: "onBlur",
  });
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <span id="external-description">External description</span>
        <TextField<ProfileValues>
          name="name"
          label="Name"
          help="Use your full name"
          aria-describedby="external-description"
          rules={{ required: "Name is required" }}
          disabled={disabled}
        />
        <EmailField<ProfileValues>
          name="email"
          id="profile-email"
          label="Email"
          rules={{
            pattern: { message: "Invalid email", value: emailPattern },
            required: "Email is required",
          }}
        />
        <CheckboxField<ProfileValues> name="accepted" label="Accept terms" />
        <RadioField<ProfileValues>
          name="plan"
          label="Plan"
          options={planOptions}
        />
        <TextareaField<ProfileValues> name="notes" label="Notes" />
        <Submit>Save</Submit>
        <button type="button" onClick={() => form.reset()}>
          Reset
        </button>
      </form>
    </FormProvider>
  );
};

interface NestedValues {
  person: { name: string };
}
const ExplicitControlForm = ({
  onSubmit,
}: {
  onSubmit: SubmitHandler<NestedValues>;
}) => {
  const form = useForm<NestedValues>({
    defaultValues: { person: { name: "Ada" } },
  });
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <TextField<NestedValues>
        control={form.control}
        name="person.name"
        label="Nested name"
      />
      <button type="button" onClick={() => form.setFocus("person.name")}>
        Focus
      </button>
      <Submit>Save nested</Submit>
    </form>
  );
};

const RadioValidationForm = () => {
  const form = useForm<{ plan: string }>({ defaultValues: { plan: "" } });
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(() => {})}>
        <RadioField
          name="plan"
          label="Plan"
          options={[
            { disabled: true, label: "Unavailable", value: "unavailable" },
            ...planOptions,
          ]}
          rules={{ required: "Choose a plan" }}
        />
        <Submit>Save</Submit>
      </form>
    </FormProvider>
  );
};

const CheckboxValidationForm = () => {
  const form = useForm<{ accepted: boolean }>({
    defaultValues: { accepted: false },
  });
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(() => {})}>
        <CheckboxField
          name="accepted"
          label="Accept terms"
          rules={{
            validate: (accepted) => accepted === true || "Please accept",
          }}
        />
        <Submit>Save</Submit>
      </form>
    </FormProvider>
  );
};

describe("RHF-ready fields", () => {
  afterEach(cleanup);

  it("binds every field and submits text, email, boolean, radio, and textarea values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<SubmitHandler<ProfileValues>>();
    render(<ProfileForm onSubmit={onSubmit} />);
    await user.clear(screen.getByRole("textbox", { name: "Name" }));
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Grace");
    await user.clear(screen.getByRole("textbox", { name: "Email" }));
    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "grace@example.com"
    );
    await user.click(screen.getByRole("checkbox", { name: "Accept terms" }));
    await user.click(screen.getByRole("radio", { name: "Pro" }));
    await user.clear(screen.getByRole("textbox", { name: "Notes" }));
    await user.type(screen.getByRole("textbox", { name: "Notes" }), "Updated");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0]).toStrictEqual({
      accepted: false,
      email: "grace@example.com",
      name: "Grace",
      notes: "Updated",
      plan: "pro",
    });
  });

  it("combines external descriptions, help, and validation feedback and clears errors on blur", async () => {
    const user = userEvent.setup();
    render(<ProfileForm onSubmit={() => {}} />);
    const input = screen.getByRole("textbox", { name: "Name" });
    await user.clear(input);
    await user.tab();
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Name is required");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toStrictEqual([
      "external-description",
      alert.id,
      screen.getByText("Use your full name").id,
    ]);
    await user.type(input, "Grace");
    await user.tab();
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  it("renders EmailField as email and focuses its invalid control on submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<SubmitHandler<ProfileValues>>();
    render(<ProfileForm onSubmit={onSubmit} />);
    const email = screen.getByRole("textbox", { name: "Email" });
    expect(email.getAttribute("type")).toBe("email");
    await user.clear(email);
    await user.type(email, "invalid");
    await user.click(screen.getByRole("button", { name: "Save" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Invalid email");
    await waitFor(() => expect(document.activeElement).toBe(email));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("resets controlled text, checkbox, radio, and textarea values", async () => {
    const user = userEvent.setup();
    render(<ProfileForm onSubmit={() => {}} />);
    await user.clear(screen.getByRole("textbox", { name: "Name" }));
    await user.click(screen.getByRole("checkbox", { name: "Accept terms" }));
    await user.click(screen.getByRole("radio", { name: "Pro" }));
    await user.clear(screen.getByRole("textbox", { name: "Notes" }));
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(
      (screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement).value
    ).toBe("Ada");
    expect(
      screen
        .getByRole("checkbox", { name: "Accept terms" })
        .getAttribute("aria-checked")
    ).toBe("true");
    expect(
      screen.getByRole("radio", { name: "Basic" }).getAttribute("aria-checked")
    ).toBe("true");
    expect(
      (screen.getByRole("textbox", { name: "Notes" }) as HTMLTextAreaElement)
        .value
    ).toBe("Hello");
  });

  it("supports explicit control, nested names, and RHF setFocus without a provider", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<SubmitHandler<NestedValues>>();
    render(<ExplicitControlForm onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "Nested name" });
    await user.clear(input);
    await user.type(input, "Grace");
    await user.click(screen.getByRole("button", { name: "Focus" }));
    expect(document.activeElement).toBe(input);
    await user.click(screen.getByRole("button", { name: "Save nested" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0]).toStrictEqual({
      person: { name: "Grace" },
    });
  });

  it("disables registered fields and omits their values on submission", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<SubmitHandler<ProfileValues>>();
    render(<ProfileForm onSubmit={onSubmit} disabled />);
    expect(
      (screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement)
        .disabled
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0].name).toBeUndefined();
  });

  it("connects checkbox errors and focuses the Radix checkbox", async () => {
    const user = userEvent.setup();
    render(<CheckboxValidationForm />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    const alert = await screen.findByRole("alert");
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(alert.textContent).toBe("Please accept");
    expect(checkbox.getAttribute("aria-describedby")).toBe(alert.id);
    await waitFor(() => expect(document.activeElement).toBe(checkbox));
  });

  it("labels radio groups and focuses the first enabled item on validation errors", async () => {
    const user = userEvent.setup();
    render(<RadioValidationForm />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    const alert = await screen.findByRole("alert");
    const group = screen.getByRole("radiogroup", { name: "Plan" });
    expect(alert.textContent).toBe("Choose a plan");
    expect(group.getAttribute("aria-describedby")).toBe(alert.id);
    expect(group.getAttribute("aria-invalid")).toBe("true");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("radio", { name: "Basic" })
      )
    );
  });
});
