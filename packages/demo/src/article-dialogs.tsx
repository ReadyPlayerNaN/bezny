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
import { useNavigate } from "@tanstack/react-router";
import { useAtom, useSetAtom } from "jotai";
import { useRef, useState } from "react";

import { useArticleCommands } from "./article-actions.js";
import type { ArticleCommand } from "./article-actions.js";
import {
  articlesAtom,
  deletionRequestAtom,
  noticeAtom,
  selectedArticleIdsAtom,
} from "./article-state.js";

import styles from "./editorial-admin.module.scss";

export const ArticleCommandPalette = () => {
  const { paletteCommands } = useArticleCommands();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pendingCommand = useRef<ArticleCommand | null>(null);
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
          Search actions for the current article context. Tab to a command and
          press Enter.
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

export const ArticleDeleteDialog = () => {
  const [request, setRequest] = useAtom(deletionRequestAtom);
  const [articles, setArticles] = useAtom(articlesAtom);
  const setSelection = useSetAtom(selectedArticleIdsAtom);
  const setNotice = useSetAtom(noticeAtom);
  const navigate = useNavigate();
  const targetIds = new Set(request?.ids);
  const records = articles.filter((article) => targetIds.has(article.id));
  const confirm = async () => {
    if (!request || records.length === 0) {
      return;
    }
    setArticles((current) =>
      current.filter((article) => !targetIds.has(article.id))
    );
    setSelection((ids) => ids.filter((id) => !targetIds.has(id)));
    setNotice(
      `${records.length} article${records.length === 1 ? "" : "s"} deleted.`
    );
    await navigate({ to: "/articles" });
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
          <AlertDialogTitle>Delete articles?</AlertDialogTitle>
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
