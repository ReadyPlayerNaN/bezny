import {
  CheckboxField,
  TextField,
  TextareaField,
  FieldLabel,
  FieldFeedback,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@bezny/base";
import { useId } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { AdminEntityField } from "./admin-entity-fields.js";

export const AdminRegisteredField = ({
  field,
  disabled = false,
  onValueChange,
}: {
  field: AdminEntityField;
  disabled?: boolean;
  onValueChange?: () => void | Promise<void>;
}) => {
  const { t } = useTranslation("beznyAdmin");
  const id = useId();
  const label = t(field.labelKey ?? field.label, { defaultValue: field.label });
  const rules = {
    ...(onValueChange ? { onChange: onValueChange } : {}),
    required: field.required
      ? t("defaults.required", { defaultValue: "This field is required." })
      : false,
  };
  const props = { disabled, help: field.help, label, name: field.key, rules };
  if (field.type === "checkbox") {
    return <CheckboxField {...props} />;
  }
  if (field.type === "textarea") {
    return (
      <TextareaField
        {...props}
        maxLength={field.maxLength}
        rules={{
          ...rules,
          ...(field.maxLength
            ? { maxLength: { message: t("error"), value: field.maxLength } }
            : {}),
        }}
      />
    );
  }
  if (field.type === "select") {
    return (
      <Controller
        name={field.key}
        rules={rules}
        render={({ field: binding, fieldState }) => (
          <div>
            <FieldLabel htmlFor={id} required={field.required ?? false}>
              {label}
            </FieldLabel>
            <Select
              name={binding.name}
              required={field.required ?? false}
              disabled={disabled}
              value={binding.value ? `value:${binding.value}` : "empty"}
              onValueChange={(value) =>
                binding.onChange(
                  value === "empty" ? "" : value.slice("value:".length)
                )
              }
            >
              <SelectTrigger
                id={id}
                ref={binding.ref}
                onBlur={() => binding.onBlur()}
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  [
                    field.help ? `${id}-help` : undefined,
                    fieldState.error ? `${id}-error` : undefined,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {!field.options?.some((option) => option.value === "") && (
                  <SelectItem value="empty">
                    {t("defaults.choose", { defaultValue: "Choose…" })}
                  </SelectItem>
                )}
                {field.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value ? `value:${option.value}` : "empty"}
                  >
                    {t(option.labelKey ?? option.label, {
                      defaultValue: option.label,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldFeedback
              help={field.help}
              helpId={`${id}-help`}
              error={fieldState.error?.message}
              errorId={`${id}-error`}
            />
          </div>
        )}
      />
    );
  }
  return (
    <TextField
      {...props}
      type={field.type === "number" ? "number" : "text"}
      min={field.min}
      max={field.max}
      maxLength={field.maxLength}
      rules={{
        ...rules,
        ...(field.maxLength
          ? { maxLength: { message: t("error"), value: field.maxLength } }
          : {}),
        ...(field.type === "number"
          ? {
              validate: (value: unknown) =>
                (!field.required && value === "") ||
                (Number.isFinite(Number(value)) &&
                  Number(value) >= (field.min ?? -Infinity) &&
                  Number(value) <= (field.max ?? Infinity)) ||
                t("error"),
            }
          : {}),
      }}
    />
  );
};
