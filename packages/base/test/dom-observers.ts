import { vi } from "vitest";

// jsdom has no layout engine. Radix's hidden form inputs still need this API;
// interaction tests do not depend on resize measurements.
if (typeof window !== "undefined") {
  Element.prototype.scrollIntoView = vi.fn<() => void>();
  Element.prototype.hasPointerCapture = vi.fn<() => boolean>(() => false);
  Element.prototype.setPointerCapture = vi.fn<() => void>();
  Element.prototype.releasePointerCapture = vi.fn<() => void>();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn<() => void>();
      unobserve = vi.fn<() => void>();
      disconnect = vi.fn<() => void>();
    }
  );
}
