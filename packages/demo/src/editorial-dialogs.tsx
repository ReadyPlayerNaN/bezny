import {
  useAdminEntityCommands,
  useAdminEntityNavigate,
} from "@bezny/admin/commands";
import {
  useAdminDataSession,
  useAdminEntityRegistry,
} from "@bezny/admin/context";
import { adminSelectionAtom } from "@bezny/admin/entities";
import type { AdminCommand } from "@bezny/admin/entities";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  IconButton,
} from "@bezny/base";
import { Command as CommandMenu } from "cmdk";
import { useAtom, useStore } from "jotai";
import { Command, Search, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { EditorialCommandInput } from "./editorial-command-input.js";
import {
  deletionRequestAtom,
  editorialResources,
  noticeAtom,
} from "./editorial-records.js";

import styles from "./editorial-admin.module.scss";

export const EditorialCommandPalette = () => {
  const { t, i18n } = useTranslation("editorial");
  const { paletteCommands } = useAdminEntityCommands();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminCommand | null>(null);
  const pendingCommand = useRef<AdminCommand | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setQuery("");
    setEditing(null);
  };
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== "k"
      ) {
        return;
      }
      if (
        !open &&
        document.querySelector('[role="dialog"], [role="alertdialog"]')
      ) {
        return;
      }
      event.preventDefault();
      setOpen((current) => !current);
      setQuery("");
      setEditing(null);
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <IconButton
          ref={trigger}
          id="command-palette-trigger"
          variant="secondary"
          icon={Command}
          aria-label={t("palette")}
          aria-keyshortcuts="Control+k Meta+k"
        />
      </DialogTrigger>
      <DialogContent
        className={styles.palette}
        aria-describedby={undefined}
        dir={i18n.dir()}
        onCloseAutoFocus={async (event) => {
          const command = pendingCommand.current;
          pendingCommand.current = null;
          if (command) {
            // Execute after dismissal so a new modal or form can receive focus.
            event.preventDefault();
            trigger.current?.focus();
            await command.execute();
          }
        }}
      >
        <DialogTitle className={styles.paletteTitle}>
          {t("palette")}
        </DialogTitle>
        {editing ? (
          <div className={styles.paletteEditor}>
            <EditorialCommandInput
              key={editing.id}
              command={editing}
              cancel={() => setEditing(null)}
              apply={(value) => {
                pendingCommand.current = {
                  ...editing,
                  execute: () => editing.input?.execute(value),
                };
                setOpen(false);
              }}
            />
          </div>
        ) : (
          <CommandMenu label={t("searchCommands")} loop vimBindings={false}>
            <div className={styles.paletteSearch}>
              <Search aria-hidden="true" className={styles.paletteIcon} />
              <CommandMenu.Input
                autoFocus
                className={styles.paletteInput}
                aria-label={t("searchCommands")}
                placeholder={t("searchCommands")}
                value={query}
                onValueChange={setQuery}
              />
              <DialogClose asChild>
                <button
                  type="button"
                  className={styles.paletteDismiss}
                  aria-label={t("closePalette")}
                >
                  <kbd>Esc</kbd>
                </button>
              </DialogClose>
            </div>
            <CommandMenu.List className={styles.commands} label={t("commands")}>
              <CommandMenu.Empty className={styles.paletteEmpty}>
                <output>{t("noCommands")}</output>
              </CommandMenu.Empty>
              {paletteCommands.map((command) => (
                <CommandMenu.Item
                  key={command.id}
                  value={command.id}
                  keywords={[command.label]}
                  className={styles.paletteItem}
                  data-destructive={command.destructive || undefined}
                  onSelect={() => {
                    if (command.input) {
                      setEditing(command);
                    } else {
                      pendingCommand.current = command;
                      setOpen(false);
                    }
                  }}
                >
                  <span>{command.label}</span>
                  {!command.input && (
                    <kbd aria-hidden="true" className={styles.paletteEnter}>
                      ↵
                    </kbd>
                  )}
                  {command.input && (
                    <ChevronRight
                      aria-hidden="true"
                      className={styles.paletteIcon}
                    />
                  )}
                </CommandMenu.Item>
              ))}
            </CommandMenu.List>
          </CommandMenu>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const EditorialDeleteDialog = () => {
  const { t, i18n } = useTranslation("editorial");
  const registry = useAdminEntityRegistry();
  const [request, setRequest] = useAtom(deletionRequestAtom);
  const [firstResource] = editorialResources;
  const resource =
    registry.get(request?.entity ?? firstResource?.key ?? "") ?? firstResource;
  if (!resource) {
    throw new Error("No editorial resource registered.");
  }
  const session = useAdminDataSession();
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const store = useStore();
  const navigate = useAdminEntityNavigate();
  const targetIds = new Set(request?.ids);
  const labels = request?.labels ?? [];
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
          setFailure(null);
        }
      }}
    >
      {request && (
        <AlertDialogContent
          dir={i18n.dir()}
          onEscapeKeyDown={(event) => {
            if (busy) {
              event.preventDefault();
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const target = request.returnFocus?.isConnected
              ? request.returnFocus
              : document.querySelector<HTMLElement>("#command-palette-trigger");
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
