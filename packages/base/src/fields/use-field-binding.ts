import { useId } from "react";
import type { AriaAttributes, ReactNode } from "react";
import { useController } from "react-hook-form";
import type { FieldValues, UseControllerProps } from "react-hook-form";

export type FieldBindingProps<T extends FieldValues> = UseControllerProps<T> & {
  label: ReactNode;
  help?: ReactNode;
  id?: string;
};

export const useFieldBinding = <
  T extends FieldValues,
  TInputProps extends AriaAttributes,
>(
  props: FieldBindingProps<T> & TInputProps
) => {
  const {
    name,
    control,
    rules,
    defaultValue,
    shouldUnregister,
    exact,
    disabled,
    label,
    help,
    id,
    ...inputProps
  } = props;
  const binding: UseControllerProps<T> = { name };
  if (control !== undefined) {
    binding.control = control;
  }
  if (rules !== undefined) {
    binding.rules = rules;
  }
  if (defaultValue !== undefined) {
    binding.defaultValue = defaultValue;
  }
  if (shouldUnregister !== undefined) {
    binding.shouldUnregister = shouldUnregister;
  }
  if (exact !== undefined) {
    binding.exact = exact;
  }
  if (disabled !== undefined) {
    binding.disabled = disabled;
  }

  const generatedId = useId();
  const { field, fieldState } = useController(binding);
  const fieldId = id ?? generatedId;
  const error = fieldState.error
    ? fieldState.error.message || "Invalid value."
    : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = help ? `${fieldId}-help` : undefined;
  const describedBy =
    [inputProps["aria-describedby"], errorId, helpId]
      .filter(Boolean)
      .join(" ") || undefined;
  const requiredRule = rules?.required;
  const requiredByRules = Boolean(
    typeof requiredRule === "object" ? requiredRule.value : requiredRule
  );

  return {
    describedBy,
    error,
    errorId,
    field,
    fieldId,
    fieldState,
    help,
    helpId,
    inputProps,
    label,
    labelId: `${fieldId}-label`,
    requiredByRules,
  };
};
