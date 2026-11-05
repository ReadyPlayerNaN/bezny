import type { FieldValues, UseControllerProps } from "react-hook-form";

import { CronInput } from "../inputs/cron-input.js";
import type { CronInputProps } from "../inputs/cron-input.js";
import { FieldFeedback } from "./field-feedback.js";
import { FieldLabel } from "./field-label.js";
import { useFieldBinding } from "./use-field-binding.js";
import type { FieldBindingProps } from "./use-field-binding.js";

import styles from "./field.module.scss";

type CronFieldControlProps = Omit<
  CronInputProps,
  | keyof UseControllerProps<FieldValues>
  | "value"
  | "onValueChange"
  | "onBlur"
  | "ref"
  | "id"
>;
export type CronFieldProps<T extends FieldValues = FieldValues> =
  FieldBindingProps<T> & CronFieldControlProps;
export const CronField = <T extends FieldValues = FieldValues>(
  props: CronFieldProps<T>
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
  } = useFieldBinding<T, CronFieldControlProps>(props);
  const required = inputProps.required ?? requiredByRules;
  const { onChange: handleValueChange, ...fieldProps } = field;
  return (
    <div className={styles.field}>
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      <CronInput
        {...inputProps}
        {...fieldProps}
        value={String(field.value ?? "")}
        onValueChange={handleValueChange}
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
