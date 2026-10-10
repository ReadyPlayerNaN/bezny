import {
  Button,
  CheckboxField,
  EmailField,
  Heading,
  RadioField,
  Section,
  Submit,
  TextareaField,
  TextField,
  ToggleField,
} from "@bezny/base";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

interface ProfileValues {
  name: string;
  email: string;
  notes: string;
  accepted: boolean;
  plan: string;
  notifications: boolean;
}

const defaultValues: ProfileValues = {
  accepted: false,
  email: "",
  name: "",
  notes: "",
  notifications: false,
  plan: "basic",
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const planOptions = [
  { label: "Basic plan", value: "basic" },
  { label: "Pro plan", value: "pro" },
  { disabled: true, label: "Unavailable plan", value: "unavailable" },
];

export const FieldExamples = () => {
  const form = useForm<ProfileValues>({ defaultValues });
  const [submitted, setSubmitted] = useState<ProfileValues | null>(null);

  return (
    <Section>
      <Heading>React Hook Form fields</Heading>
      <p>
        Submit an empty form to see validation and error focus. Fill it in to
        inspect the submitted values.
      </p>
      <FormProvider {...form}>
        <form
          aria-label="Profile example"
          noValidate
          onSubmit={form.handleSubmit((values) => setSubmitted(values))}
        >
          <TextField<ProfileValues>
            name="name"
            label="TextField: Name"
            help="Enter your full name."
            rules={{ required: "Name is required" }}
          />
          <EmailField<ProfileValues>
            name="email"
            label="EmailField: Email"
            rules={{
              pattern: {
                message: "Enter a valid email address",
                value: emailPattern,
              },
              required: "Email is required",
            }}
          />
          <TextareaField<ProfileValues>
            name="notes"
            label="TextareaField: Notes"
            help="Optional notes for your profile."
          />
          <CheckboxField<ProfileValues>
            name="accepted"
            label="CheckboxField: Accept terms"
            rules={{ required: "Accept the terms to continue" }}
          />
          <RadioField<ProfileValues>
            name="plan"
            label="RadioField: Plan"
            options={planOptions}
          />
          <ToggleField<ProfileValues>
            name="notifications"
            label="ToggleField: Notifications"
            help="Receive project updates."
          />
          <Submit>Save profile</Submit>{" "}
          <Button
            variant="secondary"
            onClick={() => {
              form.reset();
              setSubmitted(null);
            }}
          >
            Reset profile
          </Button>
        </form>
      </FormProvider>
      <p>
        <output aria-label="Form submission">
          {submitted
            ? "Profile submitted successfully."
            : "No profile submitted yet."}
        </output>
      </p>
      {submitted ? (
        <pre aria-label="Submitted profile values">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      ) : null}
    </Section>
  );
};
