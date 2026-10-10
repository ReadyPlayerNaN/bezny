import {
  useAdminEntityCommands,
  useAdminEntityNavigate,
} from "@bezny/admin/commands";
import { useAdminDataSession } from "@bezny/admin/context";
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
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  TextInput,
} from "@bezny/base";
import { useAtom, useStore } from "jotai";
import { useRef, useState } from "react";

import { EditorialCommandInput } from "./editorial-command-input.js";
import {
  deletionRequestAtom,
  editorialResources,
  noticeAtom,
} from "./editorial-records.js";

import styles from "./editorial-admin.module.scss";

export const EditorialCommandPalette = () => {
  const { paletteCommands } = useAdminEntityCommands();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminCommand | null>(null);
  const pendingCommand = useRef<AdminCommand | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const matching = paletteCommands.filter((command) =>
    command.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        setQuery("");
        setEditing(null);
      }}
    >
      <DialogTrigger asChild>
        <Button ref={trigger} id="command-palette-trigger" variant="secondary">
          Command palette
        </Button>
      </DialogTrigger>
      <DialogContent
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
        <DialogTitle>Command palette</DialogTitle>
        <DialogDescription>
          Search registered entity routes and actions for the current context.
          Tab to a command and press Enter.
        </DialogDescription>
        {editing ? (
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
        ) : (
          <>
            <TextInput
              aria-label="Search commands"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <ul className={styles.commands} aria-label="Available commands">
              {matching.map((command) => (
                <li key={command.id}>
                  <Button
                    fullWidth
                    variant={command.destructive ? "critical" : "secondary"}
                    onClick={() => {
                      if (command.input) {
                        setEditing(command);
                      } else {
                        pendingCommand.current = command;
                        setOpen(false);
                      }
                    }}
                  >
                    {command.label}
                  </Button>
                </li>
              ))}
            </ul>
            {matching.length === 0 && <output>No matching commands.</output>}
          </>
        )}
        <DialogClose asChild>
          <Button variant="secondary">Close palette</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export const EditorialDeleteDialog = () => {
  const [request, setRequest] = useAtom(deletionRequestAtom);
  const [firstResource] = editorialResources;
  const resource =
    editorialResources.find((item) => item.key === request?.entity) ??
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
      store.set(
        noticeAtom,
        `${labels.length} ${labels.length === 1 ? resource.singularLabel.toLocaleLowerCase() : resource.label.toLocaleLowerCase()} deleted.`
      );
      setRequest(null);
      await navigate({ entity: request.entity, view: "list" });
    } catch (error) {
      setFailure(
        error instanceof Error ? error.message : "Unable to delete records."
      );
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
            Delete {resource.label.toLocaleLowerCase()}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes {labels.join(", ")}. This cannot be undone.
          </AlertDialogDescription>
          {failure && <p role="alert">{failure}</p>}
          <div className={styles.actions}>
            <AlertDialogCancel asChild>
              <Button variant="secondary" disabled={busy}>
                Cancel deletion
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
                Confirm deletion
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
};
