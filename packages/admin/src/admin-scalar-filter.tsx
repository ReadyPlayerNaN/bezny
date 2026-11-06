import { Button, Popover, PopoverContent, PopoverTrigger } from "@bezny/base";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AdminCommandInput } from "./admin-command-input.js";
import type { AdminCommand } from "./admin-entity-model.js";

export const AdminScalarFilter = ({ command }: { command: AdminCommand }) => {
  const { t } = useTranslation("beznyAdmin");
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setFailed(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="secondary">
          {command.input?.label}: {command.input?.value || t("defaults.all")}
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label={command.label}>
        <AdminCommandInput
          key={command.input?.value}
          command={command}
          cancel={() => setOpen(false)}
          cancelLabel={t("chrome.cancel")}
          apply={async (value) => {
            setFailed(false);
            try {
              await command.input?.execute(value);
              setOpen(false);
            } catch {
              setFailed(true);
            }
          }}
        />
        {failed && <p role="alert">{t("error")}</p>}
      </PopoverContent>
    </Popover>
  );
};
