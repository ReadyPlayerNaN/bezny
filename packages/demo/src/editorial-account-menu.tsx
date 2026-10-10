import { adminSelectionAtom } from "@bezny/admin/entities";
import {
  Button,
  IconButton,
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
import { useAtomValue, useSetAtom } from "jotai";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { EditorialUser } from "./editorial-auth-contract.js";
import {
  editorialUserAtom,
  editorialAuthenticationAtom,
} from "./editorial-auth-state.js";
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
  onSave: (values: AccountValues) => Promise<void>;
}) => {
  const { t } = useTranslation("authentication");
  const form = useForm<AccountValues>({
    defaultValues: { email: user.email, name: user.name },
  });
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSave(values);
        } catch {
          form.setError("root", { message: t("accountError") });
        }
      })}
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
      {form.formState.errors.root ? (
        <p role="alert">{form.formState.errors.root.message}</p>
      ) : null}
      <div className={styles.actions}>
        <Submit loading={form.formState.isSubmitting}>
          {t("saveAccount")}
        </Submit>
        <DialogClose asChild>
          <Button variant="secondary">{t("cancel")}</Button>
        </DialogClose>
      </div>
    </form>
  );
};

export const EditorialAccountMenu = () => {
  const { t, i18n } = useTranslation("authentication");
  const user = useAtomValue(editorialUserAtom);
  const authentication = useAtomValue(editorialAuthenticationAtom);
  const setSelection = useSetAtom(adminSelectionAtom);
  const setDeletion = useSetAtom(deletionRequestAtom);
  const setNotice = useSetAtom(noticeAtom);
  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (!user || !authentication) {
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
          <IconButton
            variant="secondary"
            ref={triggerRef}
            aria-label={t("accountMenu")}
            icon={<span aria-hidden="true">{initials}</span>}
          />
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
            disabled={loggingOut}
            onSelect={async () => {
              setLogoutError(false);
              setLoggingOut(true);
              try {
                await authentication.logout();
                setSelection(null);
                setDeletion(null);
                setNotice(null);
              } catch {
                setLogoutError(true);
              }
              setLoggingOut(false);
            }}
          >
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {logoutError ? <span role="alert">{t("logoutError")}</span> : null}
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
          onSave={async (values) => {
            await authentication.updateAccount({
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
