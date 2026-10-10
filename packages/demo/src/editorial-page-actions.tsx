import type { AdminCommand } from "@bezny/admin/entities";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bezny/base";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export const EditorialPageActions = ({
  title,
  commands,
}: {
  title: string;
  commands: readonly AdminCommand[];
}) => {
  const { t, i18n } = useTranslation("editorial");
  const trigger = useRef<HTMLButtonElement>(null);
  const pending = useRef<AdminCommand | null>(null);
  const [failed, setFailed] = useState(false);
  const label = t("actions", { title });

  return (
    <>
      <DropdownMenu dir={i18n.dir()}>
        <DropdownMenuTrigger asChild>
          <Button
            ref={trigger}
            variant="secondary"
            aria-label={label}
            disabled={commands.length === 0}
          >
            {t("pageActions")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          aria-label={label}
          onCloseAutoFocus={async (event) => {
            const command = pending.current;
            pending.current = null;
            if (!command) {
              return;
            }
            // Dismiss the menu before navigation or confirmation takes focus.
            event.preventDefault();
            trigger.current?.focus();
            setFailed(false);
            try {
              await command.execute();
            } catch {
              setFailed(true);
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
              {command.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {failed && <span role="alert">{t("saveError")}</span>}
    </>
  );
};
