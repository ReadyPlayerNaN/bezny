import type { ComponentPropsWithRef, ReactNode } from "react";

import { AdminAccountMenu } from "./admin-account-menu.js";
import type { AdminAccountMenuProps } from "./admin-account-menu.js";
import { AdminCommandPalette } from "./admin-command-palette.js";
import type { AdminCommandPaletteProps } from "./admin-command-palette.js";

import styles from "./admin-chrome.module.scss";

export interface AdminHeaderProps extends Omit<
  ComponentPropsWithRef<"div">,
  "title"
> {
  title: ReactNode;
  account?: AdminAccountMenuProps;
  commandPalette?: AdminCommandPaletteProps | false;
  tools?: ReactNode;
}
/** Default admin chrome. Pass into AdminLayout's header slot. */
export const AdminHeader = ({
  title,
  account,
  commandPalette,
  tools,
  className,
  ...props
}: AdminHeaderProps) => (
  <div
    {...props}
    className={[styles.header, className].filter(Boolean).join(" ")}
  >
    <strong>{title}</strong>
    <div className={styles.headerTools}>
      {commandPalette !== false && <AdminCommandPalette {...commandPalette} />}
      {account && <AdminAccountMenu {...account} />}
      {tools}
    </div>
  </div>
);
export { AdminLanguageMenuItems } from "./admin-language-menu-items.js";
export { AdminAccountMenu } from "./admin-account-menu.js";
export type {
  AdminAccountMenuProps,
  AdminAccountUser,
  AdminAccountValues,
} from "./admin-account-menu.js";
export {
  AdminCommandPalette,
  adminCommandPaletteTriggerId,
} from "./admin-command-palette.js";
export type { AdminCommandPaletteProps } from "./admin-command-palette.js";
