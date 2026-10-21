import { adminSelectionAtom } from "@bezny/admin/entities";
import { AdminAccountMenu, AdminLanguageMenuItems } from "@bezny/admin/header";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import {
  editorialUserAtom,
  editorialAuthenticationAtom,
} from "./editorial-auth-state.js";
import { noticeAtom } from "./editorial-notices.js";

/** Demo authentication bindings only; all account UI belongs to admin. */
export const EditorialAccountMenu = () => {
  const { t } = useTranslation("authentication");
  const user = useAtomValue(editorialUserAtom);
  const authentication = useAtomValue(editorialAuthenticationAtom);
  const setSelection = useSetAtom(adminSelectionAtom);
  const setNotice = useSetAtom(noticeAtom);
  if (!user || !authentication) {
    return null;
  }
  return (
    <AdminAccountMenu
      user={user}
      description={t("accountDescription")}
      onSave={async (values) => {
        await authentication.updateAccount(values);
      }}
      onLogout={async () => {
        await authentication.logout();
        setSelection(null);
        setNotice(null);
      }}
    >
      <AdminLanguageMenuItems />
    </AdminAccountMenu>
  );
};
