import type { ReactNode } from "react";
import type { FieldValues, UseControllerProps } from "react-hook-form";

import { RadioGroupInput, RadioInput } from "../inputs/radio-input.js";
import type { RadioGroupInputProps } from "../inputs/radio-input.js";
import { FieldFeedback } from "./field-feedback.js";
import { FieldLabel } from "./field-label.js";
import { useFieldBinding } from "./use-field-binding.js";
import type { FieldBindingProps } from "./use-field-binding.js";

import styles from "./field.module.scss";

export interface RadioFieldOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export type RadioFieldControlProps = Omit<
  RadioGroupInputProps,
  | keyof UseControllerProps<FieldValues>
  | "value"
  | "onValueChange"
  | "onBlur"
  | "ref"
  | "id"
  | "children"
> & { options: readonly RadioFieldOption[] };
export type RadioFieldProps<T extends FieldValues = FieldValues> =
  FieldBindingProps<T> & RadioFieldControlProps;

export const RadioField = <T extends FieldValues = FieldValues>(
  props: RadioFieldProps<T>
) => {
  const {
    field,
    fieldState,
    fieldId,
    inputProps,
    label,
    labelId,
    help,
    error,
    helpId,
    errorId,
    describedBy,
    requiredByRules,
  } = useFieldBinding<T, RadioFieldControlProps>(props);
  const { options, ...groupProps } = inputProps;
  const required = groupProps.required ?? requiredByRules;
  const handleValueChange = field.onChange;
  const handleBlur = field.onBlur;
  const selectedIndex = options.findIndex(
    (option) => option.value === field.value && !option.disabled
  );
  const focusIndex =
    selectedIndex === -1
      ? options.findIndex((option) => !option.disabled)
      : selectedIndex;
  return (
    <div className={styles.field}>
      <FieldLabel asComponent="span" id={labelId} required={required}>
        {label}
      </FieldLabel>
      <RadioGroupInput
        {...groupProps}
        name={field.name}
        disabled={field.disabled}
        value={String(field.value ?? "")}
        onValueChange={handleValueChange}
        onBlur={handleBlur}
        id={fieldId}
        required={required}
        aria-labelledby={labelId}
        aria-invalid={fieldState.invalid || groupProps["aria-invalid"]}
        aria-describedby={describedBy}
      >
        {options.map((option, index) => {
          const optionId = `${fieldId}-option-${index}`;
          return (
            <div key={option.value} className={styles.option}>
              <RadioInput
                id={optionId}
                value={option.value}
                disabled={option.disabled}
                ref={(element) => {
                  if (index === focusIndex) {
                    field.ref(element);
                  }
                }}
                aria-invalid={fieldState.invalid || groupProps["aria-invalid"]}
                aria-describedby={describedBy}
              />
              <FieldLabel htmlFor={optionId}>{option.label}</FieldLabel>
            </div>
          );
        })}
      </RadioGroupInput>
      <FieldFeedback
        error={error}
        help={help}
        errorId={errorId}
        helpId={helpId}
      />
    </div>
  );
};
