import type { ComponentType, ReactNode } from "react";
import type { Resolver } from "react-hook-form";

/** Flat form values are parsed into domain mutation values by parseValues. */
export type AdminFormValues = Record<string, string | number | boolean>;
export interface AdminFieldScope {
  values: Readonly<AdminFormValues>;
  record: unknown;
}
export interface AdminFieldComponentProps {
  field: AdminEntityField;
  disabled: boolean;
  onValueChange?: () => void | Promise<void>;
}
export interface AdminEntityField {
  key: string;
  label: string;
  labelKey?: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "select"
    | "email"
    | "url"
    | "password"
    | "date";
  /** Component binds the registered key through the existing RHF FormProvider. */
  component?: ComponentType<AdminFieldComponentProps>;
  disabled?: boolean | ((scope: AdminFieldScope) => boolean);
  /** Exclude from detail fallback, record projection and palette value editors. */
  sensitive?: boolean;
  autoComplete?: string;
  step?: number | "any";
  minLength?: number;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  min?: number;
  max?: number;
  maxLength?: number;
  help?: string;
  options?: readonly { value: string; label: string; labelKey?: string }[];
  /** Derive dependent values when this field changes, e.g. a content locale. */
  deriveValues?: (
    values: AdminFormValues,
    record: unknown
  ) => Partial<AdminFormValues> | Promise<Partial<AdminFormValues>>;
}
export interface AdminEntityForm {
  fields: readonly AdminEntityField[];
  /** Schema-library-neutral RHF validation; transformed values reach parseValues. */
  resolver?: Resolver<AdminFormValues>;
  /** Map host validation/transport errors to registered keys; no raw errors are exposed. */
  errors?: (error: unknown) => Readonly<Record<string, string>>;
  defaultValues?: AdminFormValues | (() => AdminFormValues);
  /** Project a complete adapter payload into the registered editable fields. */
  readValues?: (data: unknown) => AdminFormValues;
}
export const isAdminSensitiveField = (field: AdminEntityField) =>
  field.sensitive === true || field.type === "password";

/** Native flat records need no projection; nested/domain records can supply readValues. */
export const readAdminFormValues = (
  form: AdminEntityForm,
  data?: unknown
): AdminFormValues => {
  const defaults =
    typeof form.defaultValues === "function"
      ? form.defaultValues()
      : form.defaultValues;
  const projected =
    data !== undefined && form.readValues ? form.readValues(data) : data;
  return Object.fromEntries(
    form.fields.map((field) => {
      const value =
        !isAdminSensitiveField(field) &&
        projected &&
        typeof projected === "object" &&
        field.key in projected
          ? Reflect.get(projected, field.key)
          : undefined;
      const fallback =
        defaults?.[field.key] ?? (field.type === "checkbox" ? false : "");
      return [
        field.key,
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
          ? value
          : fallback,
      ];
    })
  );
};
export const isAdminFieldDisabled = (
  field: AdminEntityField,
  scope: AdminFieldScope
) =>
  typeof field.disabled === "function"
    ? field.disabled(scope)
    : field.disabled === true;
export const validateAdminFormFields = (
  definitions: readonly AdminEntityField[],
  owner: string
) => {
  const fields = new Set<string>();
  for (const field of definitions) {
    if (
      !/^[a-zA-Z][a-zA-Z0-9_-]*$/u.test(field.key) ||
      fields.has(field.key) ||
      ["constructor", "prototype", "__proto__"].includes(field.key)
    ) {
      throw new Error(`Invalid or duplicate field ${field.key} for ${owner}`);
    }
    if (
      field.type === "select" &&
      (!field.options?.length ||
        new Set(field.options.map((option) => option.value)).size !==
          field.options.length ||
        field.options.some((option) => !option.value))
    ) {
      throw new Error(`Invalid choices for ${owner}/${field.key}`);
    }
    fields.add(field.key);
  }
};
export interface AdminEntityColumn {
  key: string;
  label: string;
  labelKey?: string;
  /** Default pages pass their view so list previews need not truncate detail content. */
  render: (data: unknown, view?: "list" | "detail") => ReactNode;
}
