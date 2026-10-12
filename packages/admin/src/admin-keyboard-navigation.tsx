import { useEffect } from "react";
import type { RefObject } from "react";

import {
  defaultNavigationAlphabet,
  navigationAlphabet,
} from "./admin-navigation-hint-codes.js";
import {
  startNavigationSession,
  unavailableNavigationKey,
} from "./admin-navigation-session.js";
import {
  navigationEditor,
  navigationEventElement,
} from "./admin-navigation-targets.js";

const shortcutPattern = /^[a-zA-Z]$/u;

export interface AdminKeyboardNavigationProps {
  /** Distinct ASCII letters; prefix-free codes expand to any necessary length. */
  alphabet?: string;
  /** Mounting is opt-in; expose a host setting to disable global character shortcuts. */
  enabled?: boolean;
  /** Default discovery includes the whole document and its portals. */
  rootRef?: RefObject<HTMLElement | null>;
  /** One ASCII letter, matched case-insensitively without Ctrl/Alt/Meta. */
  shortcut?: string;
}

/** Mount once in the admin shell. Idle mode has no observer, polling, or geometry reads. */
export const AdminKeyboardNavigation = ({
  alphabet = defaultNavigationAlphabet,
  enabled = true,
  rootRef,
  shortcut = "f",
}: AdminKeyboardNavigationProps) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const letters = navigationAlphabet(alphabet);
    if (!shortcutPattern.test(shortcut)) {
      throw new TypeError(
        "The navigation shortcut must be a single ASCII letter."
      );
    }
    let endSession: (() => void) | undefined;
    const onEnd = () => {
      endSession = undefined;
    };
    const onShortcut = (event: KeyboardEvent) => {
      if (
        endSession ||
        unavailableNavigationKey(event) ||
        event.repeat ||
        event.key.toLowerCase() !== shortcut.toLowerCase()
      ) {
        return;
      }
      const element = navigationEventElement(event);
      if (
        element &&
        (navigationEditor(element) ||
          element.closest('[data-bezny-hints="off"]'))
      ) {
        return;
      }
      const root = rootRef ? rootRef.current : document.body;
      if (!root?.isConnected) {
        return;
      }
      endSession = startNavigationSession(root, alphabet, letters, onEnd);
      if (endSession) {
        event.preventDefault();
      }
    };
    // Descendant React handlers and document listeners get the first chance to reject F.
    globalThis.addEventListener("keydown", onShortcut);
    return () => {
      endSession?.();
      globalThis.removeEventListener("keydown", onShortcut);
    };
  }, [alphabet, enabled, rootRef, shortcut]);
  return null;
};
