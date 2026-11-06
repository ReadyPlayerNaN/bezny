import type { TFunction } from "i18next";
import type { UseFormReturn } from "react-hook-form";

import type {
  AdminEntityField,
  AdminFormValues,
} from "./admin-entity-fields.js";
import { isAdminSensitiveField } from "./admin-entity-fields.js";
import type { AdminCommand } from "./admin-entity-model.js";

export const createAdminFormFieldCommands = ({
  entityKey,
  fields,
  form,
  values,
  translate,
  deriveValues,
  isAvailable = () => true,
}: {
  entityKey: string;
  fields: readonly AdminEntityField[];
  form: UseFormReturn<AdminFormValues>;
  values: Partial<AdminFormValues>;
  translate: TFunction;
  deriveValues: (field: AdminEntityField) => Promise<void>;
  isAvailable?: (field: AdminEntityField) => boolean;
}): AdminCommand[] =>
  fields.flatMap<AdminCommand>((field) => {
    if (!isAvailable(field)) {
      return [];
    }
    const label = translate(field.labelKey ?? field.label, {
      defaultValue: field.label,
    });
    const setValue = async (value: string | boolean) => {
      if (!isAvailable(field)) {
        return;
      }
      form.setValue(field.key, value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      await deriveValues(field);
    };
    if (
      isAdminSensitiveField(field) ||
      field.component ||
      field.type === "date"
    ) {
      return {
        execute: () => {
          if (isAvailable(field)) {
            form.setFocus(field.key);
          }
        },
        id: `${entityKey}.field.${field.key}`,
        label,
      };
    }
    if (field.type === "checkbox") {
      return {
        execute: () => setValue(form.getValues(field.key) !== true),
        id: `${entityKey}.field.${field.key}`,
        label,
      };
    }
    return {
      execute: () => {
        if (isAvailable(field)) {
          form.setFocus(field.key);
        }
      },
      id: `${entityKey}.field.${field.key}`,
      input: {
        allowEmpty: !field.required,
        execute: setValue,
        label,
        ...(field.max === undefined ? {} : { max: field.max }),
        ...(field.min === undefined ? {} : { min: field.min }),
        ...(field.type === "number"
          ? { min: field.min ?? -Number.MAX_VALUE, step: field.step ?? "any" }
          : {}),
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
