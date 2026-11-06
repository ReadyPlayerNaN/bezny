import { useCallback, useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import type {
  AdminEntityForm,
  AdminFormValues,
} from "./admin-entity-fields.js";
import { isAdminFieldDisabled } from "./admin-entity-fields.js";

const applyAdminFormErrors = (
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
      form.setError(field.key, { message, type: "server" });
      mapped = true;
    }
  }
  if (!mapped) {
    form.setError("root", { message: fallback });
  }
  return mapped;
};

/** Focus only after React has re-enabled controls, never during submission. */
export const useAdminFormErrors = (
  form: UseFormReturn<AdminFormValues>,
  definition: AdminEntityForm | undefined,
  {
    disabled,
    isCurrent,
    record,
  }: {
    disabled: boolean;
    isCurrent: () => boolean;
    record?: unknown;
  }
) => {
  const pendingFocus = useRef(false);
  const { errors } = form.formState;
  useEffect(() => {
    if (!pendingFocus.current) {
      return;
    }
    if (!isCurrent()) {
      pendingFocus.current = false;
      return;
    }
    if (disabled) {
      return;
    }
    pendingFocus.current = false;
    const values = form.getValues();
    const field = definition?.fields.find(
      (candidate) =>
        errors[candidate.key]?.type === "server" &&
        !isAdminFieldDisabled(candidate, { record, values })
    );
    if (field) {
      // oxlint-disable-next-line react-doctor/no-pass-data-to-parent, react-doctor/no-pass-live-state-to-parent -- RHF ref focus after controls are enabled; no parent state is updated.
      form.setFocus(field.key);
    }
  }, [definition, disabled, errors, form, isCurrent, record]);
  return useCallback(
    (error: unknown, fallback: string) => {
      pendingFocus.current = applyAdminFormErrors(
        form,
        definition,
        error,
        fallback
      );
    },
    [definition, form]
  );
};
