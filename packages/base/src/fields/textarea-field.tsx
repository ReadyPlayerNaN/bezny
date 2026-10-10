import type { FieldValues, UseControllerProps } from "react-hook-form";

import { TextareaInput } from "../inputs/textarea-input.js";
import type { TextareaInputProps } from "../inputs/textarea-input.js";
import { FieldFeedback } from "./field-feedback.js";
import { FieldLabel } from "./field-label.js";
import { useFieldBinding } from "./use-field-binding.js";
import type { FieldBindingProps } from "./use-field-binding.js";

import styles from "./field.module.scss";

export type TextareaFieldControlProps = Omit<
  TextareaInputProps,
  | keyof UseControllerProps<FieldValues>
  | "value"
  | "onChange"
  | "onBlur"
  | "ref"
  | "id"
>;
export type TextareaFieldProps<T extends FieldValues = FieldValues> =
  FieldBindingProps<T> & TextareaFieldControlProps;

export const TextareaField = <T extends FieldValues = FieldValues>(
  props: TextareaFieldProps<T>
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
  } = useFieldBinding<T, TextareaFieldControlProps>(props);
  const required = inputProps.required ?? requiredByRules;
  return (
    <div className={styles.field}>
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      <TextareaInput
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
