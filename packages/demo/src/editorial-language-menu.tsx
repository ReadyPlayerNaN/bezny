import { useAdminEntityCommands } from "@bezny/admin/commands";
import { Button, Icon } from "@bezny/base";
import {
  Root,
  Trigger,
  Portal,
  Content,
  RadioGroup,
  RadioItem,
} from "@radix-ui/react-dropdown-menu";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import styles from "./editorial-admin.module.scss";

/** Ordinary language selection executes the same commands as the palette. */
export const EditorialLanguageMenu = () => {
  const { t, i18n } = useTranslation("editorial");
  const { languageCommands } = useAdminEntityCommands();
  return (
    <Root>
      <Trigger asChild>
        <Button variant="secondary" aria-label={t("language")}>
          <Icon
            icon={Languages}
            className={styles.actionIcon}
            aria-hidden="true"
          />
        </Button>
      </Trigger>
      <Portal>
        <Content
          className={styles.actionMenu}
          align="end"
          aria-label={t("language")}
        >
          <RadioGroup value={i18n.resolvedLanguage ?? i18n.language}>
            {languageCommands.map((command) => (
              <RadioItem
                key={command.id}
                value={command.id.slice("language.".length)}
                className={styles.actionMenuItem}
                onSelect={async () => {
                  await command.execute();
                }}
              >
                {command.label}
              </RadioItem>
            ))}
          </RadioGroup>
        </Content>
      </Portal>
    </Root>
  );
};
