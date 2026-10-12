import type { ReactNode } from "react";

/** Flat form values are parsed into domain mutation values by parseValues. */
export type AdminFormValues = Record<string, string | number | boolean>;
export interface AdminEntityField {
  key: string;
  label: string;
  labelKey?: string;
  type?: "text" | "textarea" | "number" | "checkbox" | "select";
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
  defaultValues?: AdminFormValues | (() => AdminFormValues);
  /** Project a complete adapter payload into the registered editable fields. */
  readValues?: (data: unknown) => AdminFormValues;
}
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
        projected && typeof projected === "object" && field.key in projected
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
export interface AdminEntityColumn {
  key: string;
  label: string;
  labelKey?: string;
  /** Default pages pass their view so list previews need not truncate detail content. */
  render: (data: unknown, view?: "list" | "detail") => ReactNode;
}
