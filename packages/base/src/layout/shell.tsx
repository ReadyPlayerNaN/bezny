import { PanelLeft, X } from "lucide-react";
import { useId } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { Main } from "../content/heading.js";

import styles from "./shell.module.scss";

export type ShellProps = ComponentPropsWithRef<"div"> & {
  header?: ReactNode;
  navigation?: ReactNode;
  navigationLabel?: string;
  openNavigationLabel?: string;
  closeNavigationLabel?: string;
  footer?: ReactNode;
};

/** One navigation tree: native HTML owns toggling; SCSS owns every viewport. */
export const Shell = ({
  header,
  navigation,
  navigationLabel = "Entities",
  openNavigationLabel = "Open navigation",
  closeNavigationLabel = "Close navigation",
  footer,
  children,
  className,
  ...props
}: ShellProps) => {
  const navigationId = useId();
  const hasNavigation =
    navigation !== null && navigation !== undefined && navigation !== false;
  const hasHeader = header !== null && header !== undefined && header !== false;
  return (
    <div
      {...props}
      className={[styles.shell, className].filter(Boolean).join(" ")}
      data-navigation={hasNavigation}
    >
      {(hasNavigation || hasHeader) && (
        <header>
          <div className={styles.toolbar}>
            {hasNavigation && (
              <button
                type="button"
                className={styles.menuTrigger}
                popoverTarget={navigationId}
                popoverTargetAction="toggle"
              >
                <PanelLeft aria-hidden="true" />
                <span className={styles.openLabel}>{openNavigationLabel}</span>
                <span className={styles.closeLabel}>
                  {closeNavigationLabel}
                </span>
              </button>
            )}
            {hasHeader && <div className={styles.headerContent}>{header}</div>}
          </div>
        </header>
      )}
      {hasNavigation && (
        <nav
          id={navigationId}
          className={styles.navigation}
          aria-label={navigationLabel}
          popover="auto"
        >
          <div className={styles.navigationHeader}>
            <strong>{navigationLabel}</strong>
            <button
              type="button"
              className={styles.closeButton}
              popoverTarget={navigationId}
              popoverTargetAction="hide"
              aria-label={closeNavigationLabel}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          {navigation}
        </nav>
      )}
      <Main>{children}</Main>
      {footer !== null && footer !== undefined && footer !== false && (
        <footer>{footer}</footer>
      )}
    </div>
  );
};
