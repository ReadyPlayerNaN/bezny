import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  IconButton,
} from "@bezny/base";
import type { DialogContentProps } from "@bezny/base";
import { Command as CommandMenu } from "cmdk";
import { Command, Search, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { AdminCommandInput } from "./admin-command-input.js";
import { useAdminEntityCommands } from "./admin-entity-commands.js";
import type { AdminCommand } from "./admin-entity-model.js";

import styles from "./admin-chrome.module.scss";

export const adminCommandPaletteTriggerId = "command-palette-trigger";
export interface AdminCommandPaletteProps {
  /** Omit to consume the registered admin catalog. */
  commands?: readonly AdminCommand[];
  triggerId?: string;
  shortcut?: boolean;
  container?: DialogContentProps["container"];
}
const CommandPalette = ({
  commands,
  triggerId = adminCommandPaletteTriggerId,
  shortcut = true,
  container,
}: AdminCommandPaletteProps & { commands: readonly AdminCommand[] }) => {
  const { t, i18n } = useTranslation("beznyAdmin", { keyPrefix: "chrome" });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminCommand | null>(null);
  const pendingCommand = useRef<AdminCommand | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setQuery("");
      setEditing(null);
    }
  };
  useEffect(() => {
    if (!shortcut) {
      return;
    }
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
      if (!open) {
        setQuery("");
        setEditing(null);
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [open, shortcut]);
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <IconButton
          ref={trigger}
          id={triggerId}
          variant="secondary"
          icon={Command}
          aria-label={t("palette")}
          aria-keyshortcuts={shortcut ? "Control+k Meta+k" : undefined}
        />
      </DialogTrigger>
      <DialogContent
        container={container}
        className={styles.palette}
        aria-describedby={undefined}
        dir={i18n.dir()}
        onCloseAutoFocus={async (event) => {
          const command = pendingCommand.current;
          pendingCommand.current = null;
          if (command) {
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
            <AdminCommandInput
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
              {commands.map((command) => (
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

const ConnectedPalette = (props: AdminCommandPaletteProps) => {
  const { paletteCommands } = useAdminEntityCommands();
  return <CommandPalette {...props} commands={paletteCommands} />;
};
export const AdminCommandPalette = (props: AdminCommandPaletteProps) =>
  props.commands === undefined ? (
    <ConnectedPalette {...props} />
  ) : (
    <CommandPalette {...props} commands={props.commands} />
  );
