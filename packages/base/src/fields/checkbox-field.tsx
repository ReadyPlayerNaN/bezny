import type { FieldValues, UseControllerProps } from "react-hook-form";

import { CheckboxInput } from "../inputs/checkbox-input.js";
import type { CheckboxInputProps } from "../inputs/checkbox-input.js";
import { FieldFeedback } from "./field-feedback.js";
import { FieldLabel } from "./field-label.js";
import { useFieldBinding } from "./use-field-binding.js";
import type { FieldBindingProps } from "./use-field-binding.js";

import styles from "./field.module.scss";

export type CheckboxFieldControlProps = Omit<
  CheckboxInputProps,
  | keyof UseControllerProps<FieldValues>
  | "checked"
  | "defaultChecked"
  | "onCheckedChange"
  | "onBlur"
  | "ref"
  | "id"
>;
export type CheckboxFieldProps<T extends FieldValues = FieldValues> =
  FieldBindingProps<T> & CheckboxFieldControlProps;

export const CheckboxField = <T extends FieldValues = FieldValues>(
  props: CheckboxFieldProps<T>
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
  } = useFieldBinding<T, CheckboxFieldControlProps>(props);
  const required = inputProps.required ?? requiredByRules;
  const handleBlur = field.onBlur;
  return (
    <div className={styles.field}>
      <div className={styles.option}>
        <CheckboxInput
          {...inputProps}
          name={field.name}
          ref={(element) => field.ref(element)}
          disabled={field.disabled}
          checked={field.value === true}
          onCheckedChange={(checked) => field.onChange(checked === true)}
          onBlur={handleBlur}
          id={fieldId}
          required={required}
          aria-invalid={fieldState.invalid || inputProps["aria-invalid"]}
          aria-describedby={describedBy}
        />
        <FieldLabel htmlFor={fieldId} required={required}>
          {label}
        </FieldLabel>
      </div>
      <FieldFeedback
        error={error}
        help={help}
        errorId={errorId}
        helpId={helpId}
      />
    </div>
  );
};
