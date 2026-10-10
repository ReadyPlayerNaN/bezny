import type { FieldValues, UseControllerProps } from "react-hook-form";

import { ToggleInput } from "../inputs/toggle-input.js";
import type { ToggleInputProps } from "../inputs/toggle-input.js";
import { FieldFeedback } from "./field-feedback.js";
import { FieldLabel } from "./field-label.js";
import { useFieldBinding } from "./use-field-binding.js";
import type { FieldBindingProps } from "./use-field-binding.js";

import styles from "./field.module.scss";

export type ToggleFieldControlProps = Omit<
  ToggleInputProps,
  | keyof UseControllerProps<FieldValues>
  | "checked"
  | "defaultChecked"
  | "onCheckedChange"
  | "onBlur"
  | "ref"
  | "id"
>;
export type ToggleFieldProps<TFieldValues extends FieldValues = FieldValues> =
  FieldBindingProps<TFieldValues> & ToggleFieldControlProps;

export const ToggleField = <TFieldValues extends FieldValues = FieldValues>(
  props: ToggleFieldProps<TFieldValues>
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
  } = useFieldBinding<TFieldValues, ToggleFieldControlProps>(props);
  const required = inputProps.required ?? requiredByRules;
  const handleBlur = field.onBlur;
  const handleCheckedChange = field.onChange;
  return (
    <div className={styles.field}>
      <div className={styles.option}>
        <ToggleInput
          {...inputProps}
          name={field.name}
          ref={(element) => field.ref(element)}
          disabled={field.disabled}
          checked={field.value === true}
          onCheckedChange={handleCheckedChange}
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
