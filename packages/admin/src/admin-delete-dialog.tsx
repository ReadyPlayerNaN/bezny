import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Button,
} from "@bezny/base";
import { atom, useAtom, useStore } from "jotai";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useAdminEntityNavigate } from "./admin-entity-commands.js";
import {
  useAdminEntityContext,
  useAdminDataSession,
} from "./admin-entity-context.js";
import { adminSelectionAtom } from "./admin-entity-model.js";
import type { AdminActionScope } from "./admin-entity-model.js";

export const adminDeletionRequestAtom = atom<{
  scope: AdminActionScope;
  returnFocus: HTMLElement | null;
  target: "record" | "selection";
} | null>(null);
export const AdminDeleteDialog = () => {
  const [request, setRequest] = useAtom(adminDeletionRequestAtom);
  const context = useAdminEntityContext();
  const session = useAdminDataSession();
  const navigate = useAdminEntityNavigate();
  const store = useStore();
  const { t, i18n } = useTranslation("beznyAdmin");
  const [busy, setBusy] = useState(false);
  const [failureRequest, setFailureRequest] = useState<typeof request>(null);
  const focusTarget = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (request) {
      focusTarget.current = request.returnFocus;
    }
  }, [request]);
  useEffect(() => () => setRequest(null), [setRequest]);
  const confirm = async () => {
    if (!request || busy || request.scope.entity.key !== context.entity?.key) {
      return;
    }
    const { scope } = request;
    const available = new Set(
      store.get(scope.entity.records).map((record) => record.id)
    );
    const selection = store.get(adminSelectionAtom);
    const targets = new Set(scope.ids);
    const staleSelection =
      request.target === "selection" &&
      (selection?.entity !== scope.entity.key ||
        selection.ids.length !== scope.ids.length ||
        !selection.ids.every((id) => targets.has(id)));
    if (staleSelection || !scope.ids.every((id) => available.has(id))) {
      setRequest(null);
      return;
    }
    setBusy(true);
    setFailureRequest(null);
    try {
      await session.remove(scope.entity.key, scope.ids);
      store.set(adminSelectionAtom, null);
      setRequest(null);
      await navigate({ entity: scope.entity.key, view: "list" });
    } catch {
      setFailureRequest(request);
    }
    setBusy(false);
  };
  return (
    <AlertDialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setRequest(null);
          setFailureRequest(null);
        }
      }}
    >
      <AlertDialogContent
        dir={i18n.dir()}
        onEscapeKeyDown={(event) => {
          if (busy) {
            event.preventDefault();
          }
        }}
        onCloseAutoFocus={(event) => {
          const target = focusTarget.current;
          if (target?.isConnected) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <AlertDialogTitle>
          {t("defaults.deleteTitle", { defaultValue: "Delete records?" })}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {t("defaults.deleteDescription", {
            defaultValue: "This cannot be undone: {{records}}",
            records: request?.scope.records
              .map((record) => record.label)
              .join(", "),
          })}
        </AlertDialogDescription>
        {request && failureRequest === request && (
          <p role="alert">
            {t("defaults.deleteError", {
              defaultValue: "Could not delete. Try again.",
            })}
          </p>
        )}
        <AlertDialogCancel asChild>
          <Button disabled={busy} variant="secondary">
            {t("defaults.cancel", { defaultValue: "Cancel" })}
          </Button>
        </AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            disabled={busy}
            variant="critical"
            onClick={async (event) => {
              event.preventDefault();
              await confirm();
            }}
          >
            {t("defaults.confirmDelete", { defaultValue: "Delete" })}
          </Button>
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
};
