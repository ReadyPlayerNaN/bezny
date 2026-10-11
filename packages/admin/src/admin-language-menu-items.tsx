import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@bezny/base";
import { useTranslation } from "react-i18next";

import { useAdminEntityCommands } from "./admin-entity-commands.js";

/** Language selection inside the account menu executes the palette's commands. */
export const AdminLanguageMenuItems = () => {
  const { t, i18n } = useTranslation("beznyAdmin", { keyPrefix: "chrome" });
  const { languageCommands } = useAdminEntityCommands();
  return (
    <>
      <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        aria-label={t("language")}
        value={i18n.resolvedLanguage ?? i18n.language}
      >
        {languageCommands.map((command) => (
          <DropdownMenuRadioItem
            key={command.id}
            value={command.id.slice("language.".length)}
            onSelect={async () => {
              await command.execute();
            }}
          >
            {command.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  );
};
