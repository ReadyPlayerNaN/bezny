const targetSelector = [
  "a[href]",
  "button",
  'input:not([type="hidden"])',
  "select",
  "textarea",
  "summary",
  '[contenteditable="true"]',
  '[contenteditable=""]',
  '[contenteditable="plaintext-only"]',
  "[data-bezny-hint]",
  ...[
    "button",
    "link",
    "tab",
    "checkbox",
    "radio",
    "switch",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "textbox",
    "combobox",
    "option",
  ].map((role) => `[role="${role}"]`),
].join(",");
const controlsSeparator = /\s+/u;
const closedLayerSelector =
  'dialog[data-state="closed"], [role="dialog"][data-state="closed"], [role="alertdialog"][data-state="closed"], [role="menu"][data-state="closed"], [role="listbox"][data-state="closed"]';
const excludedSelector =
  '[hidden], [inert], [aria-hidden="true"], [aria-disabled="true"], [data-disabled]:not([data-disabled="false"]), [data-bezny-hints="off"], [data-bezny-hint="off"]';
const layerSelector =
  'dialog[open], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [popover]';

export interface NavigationTarget {
  element: HTMLElement;
  anchor: HTMLElement;
  x: number;
  y: number;
}

export const navigationEventElement = (event: Event): HTMLElement | undefined =>
  event
    .composedPath()
    .find((node): node is HTMLElement => node instanceof HTMLElement);

export const excludedNavigationTarget = (element: HTMLElement): boolean =>
  element.matches(":disabled") ||
  element.closest(excludedSelector) !== null ||
  element.closest(closedLayerSelector) !== null;

export const navigationEditor = (element: HTMLElement): boolean => {
  if (
    element.closest(
      'input, textarea, select, [role="textbox"], [role="searchbox"], [role="spinbutton"]'
    )
  ) {
    return true;
  }
  const editable = element.closest("[contenteditable]");
  if (
    element.isContentEditable ||
    (editable && editable.getAttribute("contenteditable") !== "false")
  ) {
    return true;
  }
  // A select-only Radix combobox is a button, not a text editor.
  const combobox = element.closest('[role="combobox"]');
  return (
    combobox !== null &&
    !(combobox instanceof HTMLButtonElement) &&
    combobox.getAttribute("aria-autocomplete") !== "none"
  );
};

const visibleNavigationStyle = (element: HTMLElement): boolean => {
  if (typeof element.checkVisibility === "function") {
    return element.checkVisibility({
      opacityProperty: true,
      visibilityProperty: true,
    });
  }
  // Visibility only: never use computed styles to inspect animations/transitions.
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  return (
    style?.visibility !== "hidden" &&
    style?.visibility !== "collapse" &&
    style?.opacity !== "0"
  );
};

const exposedNavigationPoint = (
  element: HTMLElement,
  points: [number, number][]
): boolean => {
  const document = element.ownerDocument;
  return points.some(([x, y]) => {
    const hit =
      typeof document.elementFromPoint === "function"
        ? document.elementFromPoint(x, y)
        : element;
    return hit !== null && element.contains(hit);
  });
};

/** Clip each client rect to the viewport, then sample exposed points (including wrapped links). */
export const navigationPosition = (
  element: HTMLElement
): { x: number; y: number } | undefined => {
  const view = element.ownerDocument.defaultView;
  if (!view || !element.isConnected || !visibleNavigationStyle(element)) {
    return;
  }
  for (const rect of element.getClientRects()) {
    const left = Math.max(0, rect.left);
    const top = Math.max(0, rect.top);
    const right = Math.min(view.innerWidth, rect.right);
    const bottom = Math.min(view.innerHeight, rect.bottom);
    if (right <= left || bottom <= top) {
      continue;
    }
    const insetX = Math.min(2, (right - left) / 2);
    const insetY = Math.min(2, (bottom - top) / 2);
    if (
      exposedNavigationPoint(element, [
        [(left + right) / 2, (top + bottom) / 2],
        [left + insetX, top + insetY],
        [right - insetX, bottom - insetY],
      ])
    ) {
      return { x: left, y: top };
    }
  }
};

const openNavigationLayer = (element: HTMLElement): boolean => {
  if (excludedNavigationTarget(element) || element.dataset.state === "closed") {
    return false;
  }
  if (element.hasAttribute("popover")) {
    try {
      if (!element.matches(":popover-open")) {
        return false;
      }
    } catch {
      // Without native popovers, actual layout decides visibility.
    }
  }
  return navigationPosition(element) !== undefined;
};

/** Radix dialogs do not require aria-modal; menus/listboxes may live in separate portals. */
export const navigationScope = (root: HTMLElement): HTMLElement | undefined => {
  const document = root.ownerDocument;
  const layers = [
    ...document.querySelectorAll<HTMLElement>(layerSelector),
  ].filter(openNavigationLayer);
  const layer =
    layers.findLast((candidate) =>
      candidate.contains(document.activeElement)
    ) ?? layers.at(-1);
  if (!layer) {
    return root;
  }
  if (root.contains(layer)) {
    return layer;
  }
  if (layer.contains(root)) {
    return root;
  }
  // Include portalled layers whose triggers are owned by a configured root.
  const owned =
    layer.id &&
    [...root.querySelectorAll("[aria-controls]")].some((trigger) =>
      trigger
        .getAttribute("aria-controls")
        ?.split(controlsSeparator)
        .includes(layer.id)
    );
  return owned ? layer : undefined;
};

export const navigationTargets = (root: HTMLElement): NavigationTarget[] => {
  const candidates = [...root.querySelectorAll<HTMLElement>(targetSelector)];
  if (root.matches(targetSelector)) {
    candidates.unshift(root);
  }
  const targets: NavigationTarget[] = [];
  const seen = new Set<HTMLElement>();
  for (const candidate of candidates) {
    const element =
      candidate instanceof HTMLLabelElement && candidate.control
        ? candidate.control
        : candidate;
    if (
      seen.has(element) ||
      excludedNavigationTarget(candidate) ||
      excludedNavigationTarget(element)
    ) {
      continue;
    }
    let anchor = candidate;
    if (
      element instanceof HTMLInputElement &&
      ["checkbox", "radio"].includes(element.type)
    ) {
      anchor =
        [...(element.labels ?? [])].find(
          (label) =>
            !excludedNavigationTarget(label) && navigationPosition(label)
        ) ?? candidate;
    }
    const position = navigationPosition(anchor);
    if (position) {
      seen.add(element);
      targets.push({ anchor, element, ...position });
    }
  }
  return targets;
};

const keyboardNavigationTarget = (element: HTMLElement): boolean =>
  element.getAttribute("aria-haspopup") === "menu" ||
  element.getAttribute("role") === "combobox" ||
  (element.getAttribute("role") === "option" &&
    !element.hasAttribute("cmdk-item"));

const focusNavigationTarget = (element: HTMLElement): boolean => {
  if (element instanceof HTMLInputElement) {
    return ![
      "button",
      "submit",
      "reset",
      "checkbox",
      "radio",
      "file",
      "image",
      "color",
    ].includes(element.type);
  }
  return navigationEditor(element);
};

export const activateNavigationTarget = ({
  element,
  anchor,
}: NavigationTarget): void => {
  if (
    !element.isConnected ||
    excludedNavigationTarget(element) ||
    excludedNavigationTarget(anchor) ||
    !navigationPosition(anchor)
  ) {
    return;
  }
  element.focus({ preventScroll: true });
  const action = element.dataset.beznyHintAction;
  if (action === "focus" || (!action && focusNavigationTarget(element))) {
    return;
  }
  if (action === "enter" || (!action && keyboardNavigationTarget(element))) {
    // Delegate to the primitive's documented keyboard contract; never manipulate its state.
    const KeyboardEvent = element.ownerDocument.defaultView?.KeyboardEvent;
    if (KeyboardEvent) {
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          code: "Enter",
          key: "Enter",
        })
      );
    }
    return;
  }
  // Includes cmdk options: their click handler selects that exact command, not the active option.
  element.click();
};
