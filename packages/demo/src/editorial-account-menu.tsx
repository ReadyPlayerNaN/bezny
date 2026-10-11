import { adminSelectionAtom } from "@bezny/admin/entities";
import { AdminAccountMenu, AdminLanguageMenuItems } from "@bezny/admin/header";
import { useAtomValue, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

import {
  editorialUserAtom,
  editorialAuthenticationAtom,
} from "./editorial-auth-state.js";
import { deletionRequestAtom, noticeAtom } from "./editorial-records.js";

/** Demo authentication bindings only; all account UI belongs to admin. */
export const EditorialAccountMenu = () => {
  const { t } = useTranslation("authentication");
  const user = useAtomValue(editorialUserAtom);
  const authentication = useAtomValue(editorialAuthenticationAtom);
  const setSelection = useSetAtom(adminSelectionAtom);
  const setDeletion = useSetAtom(deletionRequestAtom);
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
        setDeletion(null);
        setNotice(null);
      }}
    >
      <AdminLanguageMenuItems />
    </AdminAccountMenu>
  );
};
