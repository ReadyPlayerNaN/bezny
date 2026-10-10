import { useAdminEntityCommands } from "@bezny/admin/commands";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@bezny/base";
import { useTranslation } from "react-i18next";

/** Language selection inside the account menu executes the palette's commands. */
export const EditorialLanguageOptions = () => {
  const { t, i18n } = useTranslation("editorial");
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
