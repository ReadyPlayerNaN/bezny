import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bezny/base";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { AdminCommand } from "./admin-entity-model.js";

/** Collapsed detail commands with a safe menu-to-confirmation focus handoff. */
export const AdminDetailActions = ({
  commands,
}: {
  commands: readonly AdminCommand[];
}) => {
  const { t, i18n } = useTranslation("beznyAdmin");
  const trigger = useRef<HTMLButtonElement | null>(null);
  const pending = useRef<AdminCommand | null>(null);
  const [failed, setFailed] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const bindTrigger = useCallback((element: HTMLButtonElement | null) => {
    trigger.current = element;
    setContainer(element?.closest<HTMLElement>("[dir]") ?? null);
  }, []);
  const execute = async (command: AdminCommand) => {
    setFailed(false);
    try {
      await command.execute();
    } catch {
      setFailed(true);
    }
  };
  return (
    <>
      <DropdownMenu dir={i18n.dir()}>
        <DropdownMenuTrigger asChild>
          <Button ref={bindTrigger} variant="secondary">
            {t("defaults.actionMenu")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          container={container}
          align="end"
          onCloseAutoFocus={(event) => {
            const command = pending.current;
            pending.current = null;
            if (command) {
              // Finish closing before a command opens its dialog or navigates.
              event.preventDefault();
              trigger.current?.focus();
              void execute(command);
            }
          }}
        >
          {commands.map((command) => (
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
      {failed && <p role="alert">{t("error")}</p>}
    </>
  );
};
