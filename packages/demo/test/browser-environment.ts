import { vi } from "vitest";

// jsdom has no layout engine; Radix observes control sizes for hidden form inputs.
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
);
