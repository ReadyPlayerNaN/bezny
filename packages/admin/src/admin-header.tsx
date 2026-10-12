import type { ComponentPropsWithRef, ReactNode } from "react";

import { AdminAccountMenu } from "./admin-account-menu.js";
import type { AdminAccountMenuProps } from "./admin-account-menu.js";
import { AdminCommandPalette } from "./admin-command-palette.js";
import type { AdminCommandPaletteProps } from "./admin-command-palette.js";
import type { AdminCommand } from "./admin-entity-model.js";
import {
  AdminRefreshButton,
  ConnectedAdminRefreshButton,
} from "./admin-refresh-button.js";

import styles from "./admin-chrome.module.scss";

export interface AdminHeaderProps extends Omit<
  ComponentPropsWithRef<"div">,
  "title"
> {
  title: ReactNode;
  account?: AdminAccountMenuProps;
  commandPalette?: AdminCommandPaletteProps | false;
  /** Defaults to the registered refresh command alongside the connected palette. */
  refresh?: AdminCommand | false;
  tools?: ReactNode;
}
/** Default admin chrome. Pass into AdminLayout's header slot. */
export const AdminHeader = ({
  title,
  account,
  commandPalette,
  refresh,
  tools,
  className,
  ...props
}: AdminHeaderProps) => {
  let refreshControl: ReactNode = null;
  if (refresh) {
    refreshControl = <AdminRefreshButton command={refresh} />;
  } else if (
    refresh !== false &&
    commandPalette !== false &&
    commandPalette?.commands === undefined
  ) {
    refreshControl = <ConnectedAdminRefreshButton />;
  }
  return (
    <div
      {...props}
      className={[styles.header, className].filter(Boolean).join(" ")}
    >
      <strong>{title}</strong>
      <div className={styles.headerTools}>
        {refreshControl}
        {commandPalette !== false && (
          <AdminCommandPalette {...commandPalette} />
        )}
        {account && <AdminAccountMenu {...account} />}
        {tools}
      </div>
    </div>
  );
};
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
