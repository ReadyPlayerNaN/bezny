import { Button, Popover, PopoverContent, PopoverTrigger } from "@bezny/base";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AdminCommandInput } from "./admin-command-input.js";
import { useAdminListControls } from "./admin-list-controls.js";

import styles from "./admin-sorting.module.scss";

export const AdminCollectionSorting = () => {
  const { sortCommand, query } = useAdminListControls();
  const { t } = useTranslation("beznyAdmin");
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!sortCommand?.input) {
    return null;
  }
  const { input } = sortCommand;
  return (
    <Popover
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        setFailed(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="secondary">{sortCommand.label}</Button>
      </PopoverTrigger>
      <PopoverContent className={styles.popover} aria-label={sortCommand.label}>
        <AdminCommandInput
          key={JSON.stringify(query)}
          command={sortCommand}
          apply={async (value) => {
            setFailed(false);
            try {
              await input.execute(value);
              setOpen(false);
            } catch {
              setFailed(true);
            }
          }}
          cancel={() => setOpen(false)}
          cancelLabel={t("chrome.cancel")}
        />
        {failed && <p role="alert">{t("error")}</p>}
      </PopoverContent>
    </Popover>
  );
};
