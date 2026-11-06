import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  Submit,
} from "@bezny/base";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  adminActionRequestAtom,
  currentAdminActionScope,
} from "./admin-action-request.js";
import type { AdminActionRequest } from "./admin-action-request.js";
import { useAdminDataSession } from "./admin-entity-context.js";
import type { AdminFormValues } from "./admin-entity-fields.js";
import {
  readAdminFormValues,
  isAdminFieldDisabled,
} from "./admin-entity-fields.js";
import { adminSelectionAtom } from "./admin-entity-model.js";
import type { AdminActionResult } from "./admin-entity-model.js";
import { useAdminFormErrors } from "./admin-form-errors.js";
import { AdminRegisteredField } from "./admin-registered-field.js";

import styles from "./admin-chrome.module.scss";

const remainingIds = (result: AdminActionResult, ids: readonly string[]) => {
  const failed = result?.failedIds ?? [];
  const targets = new Set(ids);
  if (
    !result ||
    (result.message !== undefined &&
      (typeof result.message !== "string" || result.message.length > 4000)) ||
    !Array.isArray(failed)
  ) {
    throw new Error("Invalid operation result.");
  }
  if (
    failed.length > ids.length ||
    new Set(failed).size !== failed.length ||
    failed.some((id) => !targets.has(id))
  ) {
    throw new Error("Invalid operation result.");
  }
  return [...failed];
};
const ActionForm = ({
  request,
  close,
}: {
  request: AdminActionRequest;
  close: () => void;
}) => {
  const { action, scope } = request;
  const { operation } = action;
  const { t } = useTranslation("beznyAdmin");
  const form = useForm<AdminFormValues>({
    defaultValues: operation?.input ? readAdminFormValues(operation.input) : {},
    ...(operation?.input?.resolver
      ? { resolver: operation.input.resolver }
      : {}),
  });
  useWatch({ control: form.control });
  const [targets, setTargets] = useState(scope.ids);
  const targetSet = new Set(targets);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AdminActionResult | null>(null);
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const complete = result !== null && !result.failedIds?.length;
  const applyErrors = useAdminFormErrors(form, operation?.input, {
    disabled: busy || complete || form.formState.isSubmitting,
    isCurrent: () =>
      scope.store.get(adminActionRequestAtom) === request &&
      controller.current?.signal.aborted === false,
  });
  const submit = async (values: AdminFormValues) => {
    if (
      locked.current ||
      !operation ||
      scope.store.get(adminActionRequestAtom) !== request
    ) {
      return;
    }
    const current = currentAdminActionScope(request, targets);
    const owner = controller.current;
    if (!current || !owner || owner.signal.aborted) {
      close();
      return;
    }
    locked.current = true;
    setBusy(true);
    form.clearErrors();
    try {
      const response = await scope.session.execute(
        scope.entity.key,
        action.id,
        async (adapterRequest) => {
          const output = await operation.execute(
            current,
            values,
            adapterRequest
          );
          remainingIds(output, targets);
          return output;
        },
        operation.affected,
        owner.signal
      );
      if (
        owner.signal.aborted ||
        scope.store.get(adminActionRequestAtom) !== request
      ) {
        return;
      }
      const failed = remainingIds(response, targets);
      if (failed.length) {
        setTargets(failed);
        if (action.target === "selection") {
          scope.store.set(adminSelectionAtom, {
            entity: scope.entity.key,
            ids: failed,
          });
        }
        setResult({
          failedIds: failed,
          message: response?.message ?? t("chrome.commandError"),
        });
      } else if (response?.message) {
        setResult({ message: response.message });
      } else {
        close();
      }
    } catch (error) {
      if (
        !owner.signal.aborted &&
        scope.store.get(adminActionRequestAtom) === request
      ) {
        applyErrors(error, t("chrome.commandError"));
      }
    }
    if (controller.current === owner && !owner.signal.aborted) {
      locked.current = false;
      setBusy(false);
    }
  };
  const start = useEffectEvent(() => {
    void form.handleSubmit(submit)();
  });
  useEffect(() => {
    const owner = new AbortController();
    controller.current = owner;
    if (!operation?.confirm && !operation?.input) {
      queueMicrotask(() => {
        if (!owner.signal.aborted) {
          start();
        }
      });
    }
    return () => owner.abort();
  }, [operation]);
  return (
    <FormProvider {...form}>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit(submit)(event);
        }}
      >
        {operation?.input?.fields.map((field) => (
          <AdminRegisteredField
            key={field.key}
            field={field}
            disabled={
              busy ||
              complete ||
              isAdminFieldDisabled(field, {
                record: undefined,
                values: form.getValues(),
              })
            }
          />
        ))}
        {form.formState.errors.root && (
          <p role="alert">{form.formState.errors.root.message}</p>
        )}
        {result && (
          <p role={result.failedIds?.length ? "alert" : "status"}>
            {result.message}
          </p>
        )}
        <div className={styles.actions}>
          {!complete && (
            <Submit
              disabled={busy}
              variant={action.destructive ? "critical" : "primary"}
            >
              {action.label({
                ...scope,
                ids: targets,
                records: scope.records.filter((record) =>
                  targetSet.has(record.id)
                ),
              })}
            </Submit>
          )}
          <Button variant="secondary" onClick={close}>
            {t("chrome.cancel")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
export const AdminActionDialog = () => {
  const [request, setRequest] = useAtom(adminActionRequestAtom);
  const session = useAdminDataSession();
  const snapshot = useAtomValue(session.snapshotAtom);
  const { i18n } = useTranslation("beznyAdmin");
  const focus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (request) {
      focus.current = request.returnFocus;
    }
  }, [request]);
  useEffect(() => {
    if (request && snapshot.key !== request.key) {
      setRequest(null);
    }
  }, [request, setRequest, snapshot.key]);
  useEffect(() => () => setRequest(null), [setRequest]);
  return (
    <Dialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          setRequest(null);
        }
      }}
    >
      <DialogContent
        dir={i18n.dir()}
        onCloseAutoFocus={(event) => {
          if (focus.current?.isConnected) {
            event.preventDefault();
            focus.current.focus();
          }
        }}
      >
        <DialogTitle>{request?.action.label(request.scope)}</DialogTitle>
        <DialogDescription>
          {request?.action.operation?.confirm?.(request.scope) ??
            request?.scope.records.map((record) => record.label).join(", ")}
        </DialogDescription>
        {request && (
          <ActionForm request={request} close={() => setRequest(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
};
