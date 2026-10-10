import { useAdminEntityCommands } from "@bezny/admin/commands";
import { useAdminEntityContext } from "@bezny/admin/context";
import type { AdminCommand } from "@bezny/admin/entities";
import { Button, Icon } from "@bezny/base";
import {
  Root,
  Trigger,
  Portal,
  Content,
  Item,
} from "@radix-ui/react-dropdown-menu";
import { SquareMenu, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./editorial-admin.module.scss";

/** Floating presentation of the same selection commands used by rows and the palette. */
export const EditorialSelectionBar = () => {
  const { t, i18n } = useTranslation("editorial");
  const { entity, selectedIds } = useAdminEntityContext();
  const { selectionCommands } = useAdminEntityCommands();
  const trigger = useRef<HTMLButtonElement>(null);
  const pending = useRef<AdminCommand | null>(null);
  const [failed, setFailed] = useState(false);
  const locale = i18n.resolvedLanguage ?? "en";
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        numberingSystem: locale === "ar" ? "arab" : undefined,
      }),
    [locale]
  );
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
    <fieldset className={styles.selectionBar} aria-label={t("selectionBar")}>
      <span aria-live="polite">
        {t("selectionCount", { count: selectedIds.length, formattedCount })}
      </span>
      <Root>
        <Trigger asChild>
          <Button
            ref={trigger}
            variant="secondary"
            aria-label={t("selectionActions")}
            disabled={actions.length === 0}
          >
            <Icon
              icon={SquareMenu}
              className={styles.selectionIcon}
              aria-hidden="true"
            />
          </Button>
        </Trigger>
        <Portal>
          <Content
            className={styles.selectionMenu}
            side="top"
            align="center"
            aria-label={t("selectionActions")}
            onCloseAutoFocus={(event) => {
              const command = pending.current;
              pending.current = null;
              if (command) {
                // Dismiss before opening confirmation; preserve the trigger as its return-focus target.
                event.preventDefault();
                trigger.current?.focus();
                void execute(command);
              }
            }}
          >
            {actions.map((command) => (
              <Item
                key={command.id}
                className={styles.selectionMenuItem}
                data-destructive={command.destructive}
                onSelect={() => {
                  pending.current = command;
                }}
              >
                {command.label}
              </Item>
            ))}
          </Content>
        </Portal>
      </Root>
      <Button
        variant="secondary"
        aria-label={clear.label}
        onClick={async () => {
          const row = document.querySelector<HTMLElement>(
            "main [data-selection-id]"
          );
          await execute(clear);
          row?.focus();
        }}
      >
        <Icon icon={X} className={styles.selectionIcon} aria-hidden="true" />
      </Button>
      {failed && <span role="alert">{t("saveError")}</span>}
    </fieldset>
  );
};
