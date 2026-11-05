import type { FieldValues, UseControllerProps } from "react-hook-form";

import type { DateInputProps } from "../inputs/calendar-input-props.js";
import { CalendarInput } from "../inputs/calendar-input.js";
import type { CalendarKind } from "../inputs/calendar-value.js";
import { calendarFieldRules } from "./calendar-field-validation.js";
import { FieldFeedback } from "./field-feedback.js";
import { FieldLabel } from "./field-label.js";
import { useFieldBinding } from "./use-field-binding.js";
import type { FieldBindingProps } from "./use-field-binding.js";

import styles from "./field.module.scss";

type CalendarFieldControlProps = Omit<
  DateInputProps,
  | keyof UseControllerProps<FieldValues>
  | "value"
  | "onValueChange"
  | "onBlur"
  | "ref"
  | "id"
>;
export type DateFieldProps<T extends FieldValues = FieldValues> =
  FieldBindingProps<T> & CalendarFieldControlProps;
export type MonthFieldProps<T extends FieldValues = FieldValues> = Omit<
  DateFieldProps<T>,
  "weekStartsOn"
>;
const CalendarField = <T extends FieldValues>({
  kind,
  ...props
}: DateFieldProps<T> & { kind: CalendarKind }) => {
  const bindingProps = {
    ...props,
    rules: calendarFieldRules<T>(props.rules, kind, props),
  };
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
  } = useFieldBinding<T, CalendarFieldControlProps>(bindingProps);
  const required = inputProps.required ?? requiredByRules;
  const { onChange: handleValueChange, ...fieldProps } = field;
  return (
    <div className={styles.field}>
      <FieldLabel htmlFor={fieldId} required={required}>
        {label}
      </FieldLabel>
      <CalendarInput
        {...inputProps}
        {...fieldProps}
        kind={kind}
        value={String(field.value ?? "")}
        onValueChange={handleValueChange}
        onDraftChange={(raw) => {
          handleValueChange(raw);
          inputProps.onDraftChange?.(raw);
        }}
        id={fieldId}
        required={required}
        aria-invalid={fieldState.invalid || inputProps["aria-invalid"]}
        aria-describedby={describedBy}
        suppressDraftFeedback={Boolean(error)}
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
export const DateField = <T extends FieldValues = FieldValues>(
  props: DateFieldProps<T>
) => <CalendarField<T> {...props} kind="date" />;
export const MonthField = <T extends FieldValues = FieldValues>(
  props: MonthFieldProps<T>
) => <CalendarField<T> {...props} kind="month" />;
