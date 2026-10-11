import {
  Avatar,
  AvatarImage,
  AvatarFallback,
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
import type { DialogContentProps } from "@bezny/base";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import styles from "./admin-chrome.module.scss";

export interface AdminAccountUser {
  name: string;
  email: string;
  avatarUrl?: string;
}
export type AdminAccountValues = Pick<AdminAccountUser, "name" | "email">;
export interface AdminAccountMenuProps {
  user: AdminAccountUser;
  onSave?: (values: AdminAccountValues) => Promise<void>;
  onLogout?: () => Promise<void>;
  description?: ReactNode;
  children?: ReactNode;
  container?: DialogContentProps["container"];
}
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const AccountForm = ({
  user,
  onSave,
}: {
  user: AdminAccountUser;
  onSave: (values: AdminAccountValues) => Promise<void>;
}) => {
  const { t } = useTranslation("beznyAdmin", { keyPrefix: "chrome" });
  const form = useForm<AdminAccountValues>({
    defaultValues: { email: user.email, name: user.name },
  });
  return (
    <form
      className={styles.form}
      noValidate
      onSubmit={form.handleSubmit(async (values) => {
        try {
          await onSave({
            email: values.email.trim(),
            name: values.name.trim(),
          });
        } catch {
          form.setError("root", { message: t("accountError") });
        }
      })}
    >
      <TextField<AdminAccountValues>
        control={form.control}
        name="name"
        label={t("name")}
        autoComplete="name"
        rules={{
          validate: (value) => value.trim().length > 0 || t("nameRequired"),
        }}
      />
      <EmailField<AdminAccountValues>
        control={form.control}
        name="email"
        label={t("email")}
        autoComplete="email"
        rules={{
          pattern: { message: t("emailInvalid"), value: emailPattern },
          required: t("emailRequired"),
        }}
      />
      {form.formState.errors.root && (
        <p role="alert">{form.formState.errors.root.message}</p>
      )}
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

/** Package-owned UI; the host retains authentication, persistence and session cleanup. */
export const AdminAccountMenu = ({
  user,
  onSave,
  onLogout,
  description,
  children,
  container,
}: AdminAccountMenuProps) => {
  const { t, i18n } = useTranslation("beznyAdmin", { keyPrefix: "chrome" });
  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initials =
    user.name
      .trim()
      .split(/\s+/u)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toLocaleUpperCase() || "?";
  const handleSave = async (values: AdminAccountValues) => {
    await onSave?.(values);
    setEditing(false);
  };
  return (
    <Dialog open={editing} onOpenChange={setEditing}>
      <DropdownMenu dir={i18n.dir()}>
        <DropdownMenuTrigger asChild>
          <IconButton
            variant="secondary"
            ref={triggerRef}
            aria-label={t("accountMenu")}
            icon={
              user.avatarUrl ? (
                <Avatar size="small" aria-hidden="true">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              ) : (
                <span aria-hidden="true">{initials}</span>
              )
            }
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          container={container}
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
          {onSave && (
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              {t("editAccount")}
            </DropdownMenuItem>
          )}
          {children && (
            <>
              <DropdownMenuSeparator />
              {children}
            </>
          )}
          {onLogout && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={loggingOut}
                onSelect={async () => {
                  setLogoutError(false);
                  setLoggingOut(true);
                  try {
                    await onLogout();
                  } catch {
                    setLogoutError(true);
                  }
                  setLoggingOut(false);
                }}
              >
                {t("logout")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {logoutError && <span role="alert">{t("logoutError")}</span>}
      {onSave && (
        <DialogContent
          container={container}
          dir={i18n.dir()}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <DialogTitle>{t("editAccount")}</DialogTitle>
          <DialogDescription>
            {description ?? t("accountDescription")}
          </DialogDescription>
          <AccountForm user={user} onSave={handleSave} />
        </DialogContent>
      )}
    </Dialog>
  );
};
