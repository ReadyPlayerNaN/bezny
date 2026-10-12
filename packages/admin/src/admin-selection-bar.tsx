import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  IconButton,
} from "@bezny/base";
import { SquareMenu, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAdminEntityCommands } from "./admin-entity-commands.js";
import { useAdminEntityContext } from "./admin-entity-context.js";
import type { AdminCommand } from "./admin-entity-model.js";

import styles from "./admin-selection.module.scss";

/** Floating presentation of the shared row/palette selection command catalog. */
export const AdminSelectionBar = () => {
  const { entity, selectedIds } = useAdminEntityContext();
  const { selectionCommands } = useAdminEntityCommands();
  const { t, i18n } = useTranslation("beznyAdmin");
  const language = i18n.resolvedLanguage ?? i18n.language;
  const formatter = useMemo(() => new Intl.NumberFormat(language), [language]);
  const trigger = useRef<HTMLButtonElement>(null);
  const pending = useRef<AdminCommand | null>(null);
  const [failed, setFailed] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const bindContainer = useCallback((element: HTMLFieldSetElement | null) => {
    setContainer(element?.closest<HTMLElement>("[dir]") ?? null);
  }, []);
  const clear = selectionCommands.find(
    (command) => command.id === `${entity?.key}.selection.clear`
  );
  const actions = selectionCommands.filter((command) => command !== clear);
  const execute = async (command: AdminCommand) => {
    setFailed(false);
    try {
      await command.execute();
    } catch {
      setFailed(true);
    }
  };
  if (selectedIds.length === 0 || !clear) {
    return null;
  }
  const formattedCount = formatter.format(selectedIds.length);
  return (
    <fieldset
      ref={bindContainer}
      className={styles.selectionBar}
      aria-label={t("defaults.selectionBar")}
    >
      <span aria-live="polite">
        {t("defaults.selectionCount", {
          count: selectedIds.length,
          formattedCount,
        })}
      </span>
      <DropdownMenu dir={i18n.dir()}>
        <DropdownMenuTrigger asChild>
          <IconButton
            ref={trigger}
            variant="secondary"
            icon={SquareMenu}
            aria-label={t("defaults.selectionActions")}
            disabled={actions.length === 0}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          container={container}
          side="top"
          align="center"
          aria-label={t("defaults.selectionActions")}
          onCloseAutoFocus={(event) => {
            const command = pending.current;
            pending.current = null;
            if (command) {
              // Close the menu before opening a dialog, with its trigger as the return-focus target.
              event.preventDefault();
              trigger.current?.focus();
              void execute(command);
            }
          }}
        >
          {actions.map((command) => (
            <DropdownMenuItem
              key={command.id}
              tone={command.destructive ? "critical" : "secondary"}
              onSelect={() => {
                pending.current = command;
              }}
            >
              {command.menuLabel ?? command.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <IconButton
        variant="secondary"
        icon={X}
        aria-label={clear.label}
        onClick={async () => {
          const row = container?.querySelector<HTMLElement>(
            "[data-selection-id]"
          );
          await execute(clear);
          row?.focus();
        }}
      />
      {failed && <span role="alert">{t("error")}</span>}
    </fieldset>
  );
};
