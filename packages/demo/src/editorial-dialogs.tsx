import {
  useAdminEntityCommands,
  useAdminEntityNavigate,
} from "@bezny/admin/commands";
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
import { useAtom, useAtomValue, useStore } from "jotai";
import { useRef, useState } from "react";

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
                  pendingCommand.current = command;
                  setOpen(false);
                }}
              >
                {command.label}
              </Button>
            </li>
          ))}
        </ul>
        {matching.length === 0 && <output>No matching commands.</output>}
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
  const allRecords = useAtomValue(resource.records);
  const store = useStore();
  const navigate = useAdminEntityNavigate();
  const targetIds = new Set(request?.ids);
  const records = allRecords.filter((record) => targetIds.has(record.id));
  const confirm = async () => {
    if (!request || records.length === 0) {
      return;
    }
    store.set(resource.records, (current) =>
      current.filter((record) => !targetIds.has(record.id))
    );
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
      `${records.length} ${records.length === 1 ? resource.singularLabel.toLocaleLowerCase() : resource.label.toLocaleLowerCase()} deleted.`
    );
    await navigate({ entity: request.entity, view: "list" });
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
      {request && (
        <AlertDialogContent
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
            This permanently deletes{" "}
            {records.map((article) => article.title).join(", ")}. This cannot be
            undone.
          </AlertDialogDescription>
          <div className={styles.actions}>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancel deletion</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="critical"
                disabled={records.length === 0}
                onClick={confirm}
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
