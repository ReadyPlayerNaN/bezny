import type { TFunction } from "i18next";
import type { UseFormReturn } from "react-hook-form";

import type {
  AdminEntityField,
  AdminFormValues,
} from "./admin-entity-fields.js";
import type { AdminCommand } from "./admin-entity-model.js";

export const createAdminFormFieldCommands = ({
  entityKey,
  fields,
  form,
  values,
  translate,
  deriveValues,
}: {
  entityKey: string;
  fields: readonly AdminEntityField[];
  form: UseFormReturn<AdminFormValues>;
  values: Partial<AdminFormValues>;
  translate: TFunction;
  deriveValues: (field: AdminEntityField) => Promise<void>;
}): AdminCommand[] =>
  fields.map((field) => {
    const label = translate(field.labelKey ?? field.label, {
      defaultValue: field.label,
    });
    const setValue = async (value: string | boolean) => {
      form.setValue(field.key, value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      await deriveValues(field);
    };
    if (field.type === "checkbox") {
      return {
        execute: () => setValue(form.getValues(field.key) !== true),
        id: `${entityKey}.field.${field.key}`,
        label,
      };
    }
    return {
      execute: () => form.setFocus(field.key),
      id: `${entityKey}.field.${field.key}`,
      input: {
        allowEmpty: !field.required,
        execute: setValue,
        label,
        ...(field.max === undefined ? {} : { max: field.max }),
        ...(field.min === undefined ? {} : { min: field.min }),
        ...(field.maxLength === undefined
          ? {}
          : { maxLength: field.maxLength }),
        ...(field.options
          ? {
              options: field.options.map((option) => ({
                label: translate(option.labelKey ?? option.label, {
                  defaultValue: option.label,
                }),
                value: option.value,
              })),
            }
          : {}),
        type:
          field.type === "number" || field.type === "textarea"
            ? field.type
            : "text",
        value: String(values[field.key] ?? ""),
      },
      label,
    };
  });
