import type { UseFormReturn } from "react-hook-form";

import type {
  AdminEntityForm,
  AdminFormValues,
} from "./admin-entity-fields.js";

export const applyAdminFormErrors = (
  form: UseFormReturn<AdminFormValues>,
  definition: AdminEntityForm | undefined,
  error: unknown,
  fallback: string
) => {
  let errors: Readonly<Record<string, string>> | undefined;
  try {
    errors = definition?.errors?.(error);
  } catch {
    /* A host mapper failure must remain recoverable. */
  }
  let mapped = false;
  for (const field of definition?.fields ?? []) {
    const message = errors?.[field.key];
    if (typeof message === "string" && message) {
      form.setError(
        field.key,
        { message, type: "server" },
        { shouldFocus: !mapped }
      );
      mapped = true;
    }
  }
  if (!mapped) {
    form.setError("root", { message: fallback });
  }
};
