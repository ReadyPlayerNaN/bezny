import { navigationHintCodes } from "./admin-navigation-hint-codes.js";
import {
  activateNavigationTarget,
  navigationEditor,
  navigationEventElement,
  navigationScope,
  navigationTargets,
} from "./admin-navigation-targets.js";
import type { NavigationTarget } from "./admin-navigation-targets.js";

import styles from "./admin-navigation.module.scss";

const compositionKeyCode = 229;
const cancellationEvents = [
  "resize",
  "blur",
  "pagehide",
  "popstate",
  "hashchange",
] as const;
const observedAttributes = [
  "disabled",
  "aria-disabled",
  "data-disabled",
  "hidden",
  "inert",
  "aria-hidden",
  "open",
  "data-state",
  "class",
  "style",
  "data-bezny-hint",
  "data-bezny-hints",
  "data-bezny-hint-action",
  "href",
  "role",
  "type",
  "contenteditable",
];

interface NavigationMarker extends NavigationTarget {
  code: string;
  badge: HTMLSpanElement;
}

export const unavailableNavigationKey = (event: KeyboardEvent): boolean =>
  event.defaultPrevented ||
  event.isComposing ||
  event.keyCode === compositionKeyCode ||
  event.ctrlKey ||
  event.altKey ||
  event.metaKey;

const consumeNavigationKey = (event: KeyboardEvent): void => {
  event.preventDefault();
  event.stopImmediatePropagation();
};

const createNavigationOverlay = (
  targets: NavigationTarget[],
  alphabet: string,
  scope: HTMLElement
) => {
  const document = scope.ownerDocument;
  const codes = navigationHintCodes(targets.length, alphabet);
  const overlay = document.createElement("div");
  overlay.className = styles.overlay ?? "";
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.beznyHintOverlay = "";
  const hasPopover = typeof overlay.showPopover === "function";
  if (hasPopover) {
    overlay.setAttribute("popover", "manual");
  }
  const fragment = document.createDocumentFragment();
  const markers: NavigationMarker[] = targets.map((target, index) => {
    const badge = document.createElement("span");
    const code = codes[index];
    if (!code) {
      throw new Error("A navigation target is missing its hint code.");
    }
    badge.className = styles.badge ?? "";
    badge.textContent = code.toUpperCase();
    badge.dataset.beznyHintCode = code;
    // Reserve space proportional to the code, including long codes from small alphabets.
    badge.style.left = `max(0px, min(${target.x}px, calc(100vw - ${code.length + 2}em)))`;
    badge.style.top = `min(${target.y}px, calc(100vh - 2em))`;
    fragment.append(badge);
    return { ...target, badge, code };
  });
  overlay.append(fragment);
  // Native manual popovers have no focusable content, do not dismiss Radix layers,
  // and render above stacking contexts. Keeping the DOM inside the scope preserves theming.
  scope.append(overlay);
  if (hasPopover) {
    overlay.showPopover();
  }
  return { markers, overlay };
};

export const startNavigationSession = (
  root: HTMLElement,
  alphabet: string,
  letters: string[],
  onEnd: () => void
): (() => void) | undefined => {
  const scope = navigationScope(root);
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!scope || !view) {
    return;
  }
  // Batch all visibility/geometry reads before rendering any hint DOM.
  const targets = navigationTargets(scope);
  if (targets.length === 0) {
    return;
  }
  const { overlay, markers } = createNavigationOverlay(
    targets,
    alphabet,
    scope
  );
  let prefix = "";
  let ended = false;
  let removeListeners: (() => void) | null = null;
  const cancel = () => {
    if (ended) {
      return;
    }
    ended = true;
    removeListeners?.();
    overlay.remove();
    onEnd();
  };
  const observer = new MutationObserver((records) => {
    if (records.some((record) => !overlay.contains(record.target))) {
      cancel();
    }
  });
  const onFocus = (event: FocusEvent) => {
    const element = navigationEventElement(event);
    if (element && (navigationEditor(element) || !scope.contains(element))) {
      cancel();
    }
  };
  const updatePrefix = (next: string) => {
    const matches = markers.filter((marker) => marker.code.startsWith(next));
    if (matches.length === 0) {
      return;
    }
    prefix = next;
    const selected = matches.find((marker) => marker.code === prefix);
    if (selected) {
      cancel();
      activateNavigationTarget(selected);
      return;
    }
    for (const marker of markers) {
      const hidden = !marker.code.startsWith(prefix);
      if (marker.badge.hidden !== hidden) {
        marker.badge.hidden = hidden;
      }
    }
  };
  const onHintKey = (event: KeyboardEvent) => {
    const element = navigationEventElement(event);
    if (
      unavailableNavigationKey(event) ||
      (element && navigationEditor(element))
    ) {
      cancel();
      return;
    }
    if (event.key === "Escape") {
      consumeNavigationKey(event);
      cancel();
      return;
    }
    const key = event.key.toLowerCase();
    if (event.key !== "Backspace" && !letters.includes(key)) {
      cancel();
      return;
    }
    consumeNavigationKey(event);
    if (!event.repeat) {
      updatePrefix(
        event.key === "Backspace" ? prefix.slice(0, -1) : prefix + key
      );
    }
  };
  removeListeners = () => {
    observer.disconnect();
    view.removeEventListener("keydown", onHintKey, true);
    view.removeEventListener("scroll", cancel, true);
    for (const type of cancellationEvents) {
      view.removeEventListener(type, cancel);
    }
    document.removeEventListener("pointerdown", cancel, true);
    document.removeEventListener("focusin", onFocus);
  };

  // Capture only while hint mode owns the keyboard. Escape must not reach Radix dismissal.
  view.addEventListener("keydown", onHintKey, true);
  view.addEventListener("scroll", cancel, true);
  for (const type of cancellationEvents) {
    view.addEventListener(type, cancel);
  }
  document.addEventListener("pointerdown", cancel, true);
  document.addEventListener("focusin", onFocus);
  observer.observe(document.body, {
    attributeFilter: observedAttributes,
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });
  return cancel;
};
