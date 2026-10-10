import type { FieldValues, UseControllerProps } from "react-hook-form";

import { TextInput } from "../inputs/text-input.js";
import type { TextInputProps } from "../inputs/text-input.js";
import { FieldFeedback } from "./field-feedback.js";
import { FieldLabel } from "./field-label.js";
import { useFieldBinding } from "./use-field-binding.js";
import type { FieldBindingProps } from "./use-field-binding.js";

import styles from "./field.module.scss";

export type TextFieldControlProps = Omit<
  TextInputProps,
  | keyof UseControllerProps<FieldValues>
  | "value"
  | "onChange"
  | "onBlur"
  | "ref"
  | "id"
>;
export type TextFieldProps<T extends FieldValues = FieldValues> =
  FieldBindingProps<T> & TextFieldControlProps;

export const TextField = <T extends FieldValues = FieldValues>(
  props: TextFieldProps<T>
) => {
  const {
    field,
    fieldState,
    fieldId,
    inputProps,
    label,
    help,
    error,
    helpId,
    errorId,
    describedBy,
    requiredByRules,
  } = useFieldBinding<T, TextFieldControlProps>(props);
  const required = inputProps.required ?? requiredByRules;
  return (
    <div className={styles.field}>
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      <TextInput
        {...inputProps}
        {...field}
        value={String(field.value ?? "")}
        id={fieldId}
        required={required}
        aria-invalid={fieldState.invalid || inputProps["aria-invalid"]}
        aria-describedby={describedBy}
      />
      <FieldFeedback
        error={error}
        help={help}
        errorId={errorId}
        helpId={helpId}
      />
    </div>
  );
};

export type EmailFieldProps<T extends FieldValues = FieldValues> = Omit<
  TextFieldProps<T>,
  "type"
>;
export const EmailField = <T extends FieldValues = FieldValues>(
  props: EmailFieldProps<T>
) => <TextField<T> {...props} type="email" />;
