import { useAdminEntityNavigate } from "@bezny/admin/commands";
import {
  useAdminDataSession,
  useAdminEntityRegistry,
} from "@bezny/admin/context";
import { adminSelectionAtom } from "@bezny/admin/entities";
import { adminCommandPaletteTriggerId } from "@bezny/admin/header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Button,
} from "@bezny/base";
import { useAtom, useStore } from "jotai";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  deletionRequestAtom,
  editorialResources,
  noticeAtom,
} from "./editorial-records.js";

import styles from "./editorial-admin.module.scss";

export const EditorialDeleteDialog = () => {
  const { t, i18n } = useTranslation("editorial");
  const registry = useAdminEntityRegistry();
  const [request, setRequest] = useAtom(deletionRequestAtom);
  // Keep the last presentation until Radix finishes the exit animation.
  const [displayRequest, setDisplayRequest] = useState(request);
  if (request && request !== displayRequest) {
    setDisplayRequest(request);
  }
  const [firstResource] = editorialResources;
  const resource =
    registry.get(displayRequest?.entity ?? firstResource?.key ?? "") ??
    firstResource;
  if (!resource) {
    throw new Error("No editorial resource registered.");
  }
  const session = useAdminDataSession();
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const store = useStore();
  const navigate = useAdminEntityNavigate();
  const targetIds = new Set(request?.ids);
  const labels = displayRequest?.labels ?? [];
  const confirm = async () => {
    if (!request || busy || labels.length === 0) {
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      await session.remove(request.entity, request.ids);
      store.set(adminSelectionAtom, (current) =>
        current?.entity === request.entity
          ? {
              entity: current.entity,
              ids: current.ids.filter((id) => !targetIds.has(id)),
            }
          : current
      );
      store.set(noticeAtom, {
        count: labels.length,
        entity: request.entity,
        key: "deleted",
      });
      setRequest(null);
      await navigate({ entity: request.entity, view: "list" });
    } catch {
      setFailure(t("deleteError"));
    }
    setBusy(false);
  };
  return (
    <AlertDialog
      open={request !== null}
      onOpenChange={(open) => {
        if (!open) {
          setRequest(null);
        }
      }}
    >
      {displayRequest && (
        <AlertDialogContent
          dir={i18n.dir()}
          onEscapeKeyDown={(event) => {
            if (busy) {
              event.preventDefault();
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            setDisplayRequest(null);
            setFailure(null);
            const target = displayRequest.returnFocus?.isConnected
              ? displayRequest.returnFocus
              : document.querySelector<HTMLElement>(
                  `#${adminCommandPaletteTriggerId}`
                );
            target?.focus();
          }}
        >
          <AlertDialogTitle>
            {t("deleteTitle", { entity: resource.label.toLocaleLowerCase() })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescription", { records: labels.join(", ") })}
          </AlertDialogDescription>
          {failure && <p role="alert">{failure}</p>}
          <div className={styles.actions}>
            <AlertDialogCancel asChild>
              <Button variant="secondary" disabled={busy}>
                {t("cancelDeletion")}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="critical"
                disabled={busy || labels.length === 0}
                onClick={async (event) => {
                  event.preventDefault();
                  await confirm();
                }}
              >
                {t("confirmDeletion")}
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
};
