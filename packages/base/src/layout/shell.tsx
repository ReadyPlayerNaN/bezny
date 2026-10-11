import { Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import type { ComponentPropsWithRef, MouseEvent, ReactNode } from "react";

import { Main } from "../content/heading.js";
import { Button } from "../controls/button.js";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../controls/dialog.js";
import type { DialogContentProps } from "../controls/dialog.js";
import { IconButton } from "../controls/icon-button.js";

import styles from "./shell.module.scss";

export type ShellProps = ComponentPropsWithRef<"div"> & {
  header?: ReactNode;
  navigation?: ReactNode;
  navigationLabel?: string;
  openNavigationLabel?: string;
  closeNavigationLabel?: string;
  navigationContainer?: DialogContentProps["container"];
  footer?: ReactNode;
};

/** CSS selects the viewport layout; Radix owns only modal interactions. */
export const Shell = ({
  header,
  navigation,
  navigationLabel = "Entities",
  openNavigationLabel = "Open navigation",
  closeNavigationLabel = "Close navigation",
  navigationContainer,
  footer,
  children,
  className,
  ...props
}: ShellProps) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const handleCloseAutoFocus = (event: Event) => {
    // CSS may hide the trigger after resizing. Return to visible navigation
    // rather than focusing a hidden button; this does not select a viewport.
    if (
      !menuRef.current?.getClientRects().length &&
      navigationRef.current?.getClientRects().length
    ) {
      event.preventDefault();
      const link =
        navigationRef.current.querySelector<HTMLAnchorElement>(
          'a[aria-current="page"]'
        ) ?? navigationRef.current.querySelector<HTMLAnchorElement>("a[href]");
      link?.focus();
    }
  };
  const hasNavigation =
    navigation !== null && navigation !== undefined && navigation !== false;
  const hasHeader = header !== null && header !== undefined && header !== false;
  const handleNavigationClick = (event: MouseEvent<HTMLDivElement>) => {
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    ) {
      return;
    }
    const ownerWindow = event.currentTarget.ownerDocument.defaultView;
    const anchor =
      ownerWindow && event.target instanceof ownerWindow.Element
        ? event.target.closest("a[href]")
        : null;
    if (
      anchor &&
      !anchor.hasAttribute("download") &&
      (!anchor.getAttribute("target") ||
        anchor.getAttribute("target") === "_self")
    ) {
      setOpen(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div
        {...props}
        className={[styles.shell, className].filter(Boolean).join(" ")}
        data-navigation={hasNavigation}
      >
        {(hasNavigation || hasHeader) && (
          <header>
            <div className={styles.toolbar}>
              {hasNavigation && (
                <span className={styles.menuTrigger}>
                  <DialogTrigger asChild>
                    <IconButton
                      ref={menuRef}
                      icon={Menu}
                      aria-label={openNavigationLabel}
                      variant="secondary"
                    />
                  </DialogTrigger>
                </span>
              )}
              {hasHeader && (
                <div className={styles.headerContent}>{header}</div>
              )}
            </div>
          </header>
        )}
        {hasNavigation && (
          <nav
            ref={navigationRef}
            className={styles.navigation}
            aria-label={navigationLabel}
          >
            {navigation}
          </nav>
        )}
        <Main>{children}</Main>
        {footer !== null && footer !== undefined && footer !== false && (
          <footer>{footer}</footer>
        )}
      </div>
      {hasNavigation && (
        <DialogContent
          className={styles.drawer}
          dir={props.dir}
          container={navigationContainer}
          aria-describedby={undefined}
          aria-modal="true"
          onCloseAutoFocus={handleCloseAutoFocus}
          onClick={handleNavigationClick}
        >
          <div className={styles.drawerHeader}>
            <DialogTitle className={styles.drawerTitle}>
              {navigationLabel}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                className={styles.closeButton}
                aria-label={closeNavigationLabel}
                variant="secondary"
              >
                <X aria-hidden="true" />
              </Button>
            </DialogClose>
          </div>
          <nav className={styles.drawerNavigation} aria-label={navigationLabel}>
            {navigation}
          </nav>
        </DialogContent>
      )}
    </Dialog>
  );
};
