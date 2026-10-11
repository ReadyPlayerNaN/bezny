import { beforeEach, vi } from "vitest";

beforeEach(() => {
  window.sessionStorage.clear();
});

// CSS modules are mocked: expose the native shell navigation as on desktop.
// Native Popover behavior and responsive CSS are verified in base Chromium tests.
const desktopStyle = document.createElement("style");
desktopStyle.textContent = "nav[popover] { display: block !important; }";
document.head.append(desktopStyle);

window.scrollTo = vi.fn();

// jsdom lacks pointer capture and scrolling used by Radix Select.
Element.prototype.hasPointerCapture = () => false;
Element.prototype.setPointerCapture = () => {
  // No pointer capture in jsdom.
};
Element.prototype.releasePointerCapture = () => {
  // No pointer capture in jsdom.
};
Element.prototype.scrollIntoView = () => {
  // No layout in jsdom.
};

// jsdom has no layout engine; Radix observes control sizes for hidden form inputs.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
);
