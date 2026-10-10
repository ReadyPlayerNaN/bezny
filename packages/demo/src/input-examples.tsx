import {
  CheckboxInput,
  FieldFeedback,
  FieldLabel,
  Heading,
  RadioGroupInput,
  RadioInput,
  Section,
  TextareaInput,
  TextInput,
  ToggleInput,
} from "@bezny/base";
import { useState } from "react";

export const InputExamples = () => {
  const [notifications, setNotifications] = useState(false);

  return (
    <Section>
      <Heading>Inputs and field presentation</Heading>
      <div>These controls work without React Hook Form.</div>
      <div>
        <FieldLabel htmlFor="example-text" required>
          TextInput
        </FieldLabel>
        <TextInput
          id="example-text"
          placeholder="Enter a project name"
          aria-describedby="example-text-help"
        />
        <FieldFeedback
          help="A standalone label, input, and help message."
          helpId="example-text-help"
        />
      </div>
      <div>
        <FieldLabel htmlFor="example-prefix">TextInput with prefix</FieldLabel>
        <TextInput
          id="example-prefix"
          prefix="https://"
          defaultValue="example.com"
        />
      </div>
      <div>
        <FieldLabel htmlFor="example-invalid">Invalid TextInput</FieldLabel>
        <TextInput
          id="example-invalid"
          defaultValue="Unavailable name"
          aria-invalid="true"
          aria-describedby="example-invalid-error"
        />
        <FieldFeedback
          error="This example name is already taken."
          errorId="example-invalid-error"
        />
      </div>
      <div>
        <FieldLabel htmlFor="example-disabled">Disabled TextInput</FieldLabel>
        <TextInput
          id="example-disabled"
          defaultValue="Read-only example"
          disabled
        />
      </div>
      <div>
        <FieldLabel htmlFor="example-textarea">TextareaInput</FieldLabel>
        <TextareaInput id="example-textarea" placeholder="Add a description" />
      </div>
      <div>
        <CheckboxInput id="example-checkbox" defaultChecked />{" "}
        <FieldLabel htmlFor="example-checkbox">CheckboxInput</FieldLabel>
      </div>
      <div>
        <CheckboxInput id="example-indeterminate" checked="indeterminate" />{" "}
        <FieldLabel htmlFor="example-indeterminate">
          Indeterminate CheckboxInput
        </FieldLabel>
      </div>
      <div>
        <CheckboxInput id="example-checkbox-disabled" disabled />{" "}
        <FieldLabel htmlFor="example-checkbox-disabled">
          Disabled CheckboxInput
        </FieldLabel>
      </div>
      <FieldLabel asComponent="span" id="example-radio-label">
        RadioGroupInput and RadioInput
      </FieldLabel>
      <RadioGroupInput
        defaultValue="standard"
        aria-labelledby="example-radio-label"
      >
        <div>
          <RadioInput id="example-standard" value="standard" />{" "}
          <FieldLabel htmlFor="example-standard">Standard delivery</FieldLabel>
        </div>
        <div>
          <RadioInput id="example-express" value="express" />{" "}
          <FieldLabel htmlFor="example-express">Express delivery</FieldLabel>
        </div>
        <div>
          <RadioInput id="example-unavailable" value="unavailable" disabled />{" "}
          <FieldLabel htmlFor="example-unavailable">
            Unavailable delivery
          </FieldLabel>
        </div>
      </RadioGroupInput>
      <div>
        <ToggleInput
          id="example-toggle"
          checked={notifications}
          onCheckedChange={setNotifications}
        />{" "}
        <FieldLabel htmlFor="example-toggle">ToggleInput</FieldLabel>
      </div>
      <div>
        <output aria-label="Standalone toggle state">
          Notifications {notifications ? "on" : "off"}
        </output>
      </div>
      <div>
        <ToggleInput id="example-toggle-disabled" defaultChecked disabled />{" "}
        <FieldLabel htmlFor="example-toggle-disabled">
          Disabled ToggleInput
        </FieldLabel>
      </div>
    </Section>
  );
};
