import type { ComponentPropsWithRef } from "react";
import { useLayoutEffect } from "react";
import type { RemoveScroll as ScrollIsolationComponent } from "react-remove-scroll";
import sidecar from "react-remove-scroll/sidecar";
import { RemoveScroll as ScrollIsolation } from "react-remove-scroll/UI";

import styles from "./scroll-lock.module.scss";

const documentLockClass = styles.documentLocked;
const reservedScrollbarClass = styles.reservedScrollbar;
if (!(documentLockClass && reservedScrollbarClass)) {
  throw new Error("Scroll-lock stylesheet bindings are missing.");
}
const lockAttribute = "data-bezny-scroll-locked";
const gutterAttribute = "data-bezny-scrollbar-gutter";
interface DocumentLock {
  count: number;
  previousLock: string | null;
  previousGutter: string | null;
  previousLockClass: boolean;
  previousGutterClass: boolean;
}
const documentLocks = new WeakMap<Document, DocumentLock>();
const restoreAttribute = (
  root: HTMLElement,
  name: string,
  value: string | null
) => {
  if (value === null) {
    root.removeAttribute(name);
  } else {
    root.setAttribute(name, value);
  }
};

/** Own only document overflow styling; Radix and react-remove-scroll own interactions. */
export const acquireDocumentScrollLock = (owner: Document): (() => void) => {
  const root = owner.documentElement;
  let lock = documentLocks.get(owner);
  if (!lock) {
    lock = {
      count: 0,
      previousGutter: root.getAttribute(gutterAttribute),
      previousGutterClass: root.classList.contains(reservedScrollbarClass),
      previousLock: root.getAttribute(lockAttribute),
      previousLockClass: root.classList.contains(documentLockClass),
    };
    documentLocks.set(owner, lock);
    const existingGutter =
      owner.defaultView?.getComputedStyle(root).scrollbarGutter ?? "";
    if (
      (owner.defaultView?.innerWidth ?? root.clientWidth) > root.clientWidth &&
      !existingGutter.includes("stable")
    ) {
      root.setAttribute(gutterAttribute, "");
      root.classList.add(reservedScrollbarClass);
    }
    root.setAttribute(lockAttribute, "");
    root.classList.add(documentLockClass);
  }
  lock.count += 1;
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    lock.count -= 1;
    if (lock.count === 0) {
      restoreAttribute(root, lockAttribute, lock.previousLock);
      restoreAttribute(root, gutterAttribute, lock.previousGutter);
      root.classList.toggle(documentLockClass, lock.previousLockClass);
      root.classList.toggle(reservedScrollbarClass, lock.previousGutterClass);
      documentLocks.delete(owner);
    }
  };
};

type ScrollLockProps = ComponentPropsWithRef<typeof ScrollIsolationComponent>;
const ScrollLock = ({
  enabled = true,
  removeScrollBar = true,
  ...props
}: ScrollLockProps) => {
  useLayoutEffect(() => {
    if (enabled && removeScrollBar) {
      return acquireDocumentScrollLock(document);
    }
  }, [enabled, removeScrollBar]);
  return (
    <ScrollIsolation
      {...props}
      enabled={enabled}
      removeScrollBar={false}
      sideCar={sidecar}
    />
  );
};

// The build alias is private; retain the dependency's shape for Radix consumers.
export const RemoveScroll = Object.assign(ScrollLock, {
  classNames: ScrollIsolation.classNames,
});
