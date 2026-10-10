import { adminSelectionAtom } from "@bezny/admin/entities";
import {
  Avatar,
  AvatarFallback,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Submit,
  TextField,
  EmailField,
} from "@bezny/base";
import { useAtom, useSetAtom } from "jotai";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { editorialUserAtom } from "./editorial-authentication.js";
import type { EditorialUser } from "./editorial-authentication.js";
import { EditorialLanguageOptions } from "./editorial-language-menu.js";
import { deletionRequestAtom, noticeAtom } from "./editorial-records.js";

import styles from "./editorial-admin.module.scss";

type AccountValues = Pick<EditorialUser, "name" | "email">;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const AccountForm = ({
  user,
  onSave,
}: {
  user: EditorialUser;
  onSave: (values: AccountValues) => void;
}) => {
  const { t } = useTranslation("authentication");
  const form = useForm<AccountValues>({
    defaultValues: { email: user.email, name: user.name },
  });
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={form.handleSubmit(onSave)}
    >
      <TextField<AccountValues>
        control={form.control}
        name="name"
        label={t("name")}
        autoComplete="name"
        rules={{
          validate: (value) => value.trim().length > 0 || t("nameRequired"),
        }}
      />
      <EmailField<AccountValues>
        control={form.control}
        name="email"
        label={t("email")}
        autoComplete="email"
        rules={{
          pattern: { message: t("emailInvalid"), value: emailPattern },
          required: t("emailRequired"),
        }}
      />
      <div className={styles.actions}>
        <Submit>{t("saveAccount")}</Submit>
        <DialogClose asChild>
          <Button variant="secondary">{t("cancel")}</Button>
        </DialogClose>
      </div>
    </form>
  );
};

export const EditorialAccountMenu = () => {
  const { t, i18n } = useTranslation("authentication");
  const [user, setUser] = useAtom(editorialUserAtom);
  const setSelection = useSetAtom(adminSelectionAtom);
  const setDeletion = useSetAtom(deletionRequestAtom);
  const setNotice = useSetAtom(noticeAtom);
  const [editing, setEditing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (!user) {
    return null;
  }
  const initials = user.name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
  return (
    <Dialog open={editing} onOpenChange={setEditing}>
      <DropdownMenu dir={i18n.dir()}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className={styles.avatarTrigger}
            ref={triggerRef}
            aria-label={t("accountMenu")}
          >
            <Avatar size="small" aria-hidden="true">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          aria-label={t("accountMenu")}
          onCloseAutoFocus={(event) => {
            if (editing) {
              event.preventDefault();
            }
          }}
        >
          <DropdownMenuLabel>
            {user.name}
            <br />
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => {
              setEditing(true);
            }}
          >
            {t("editAccount")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <EditorialLanguageOptions />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setSelection(null);
              setDeletion(null);
              setNotice(null);
              setUser(null);
            }}
          >
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DialogTitle>{t("editAccount")}</DialogTitle>
        <DialogDescription>{t("accountDescription")}</DialogDescription>
        <AccountForm
          user={user}
          onSave={(values) => {
            setUser({
              ...user,
              email: values.email.trim(),
              name: values.name.trim(),
            });
            setEditing(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
