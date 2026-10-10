import { beforeEach, vi } from "vitest";

import { createEditorialAuthBackend } from "../server/editorial-auth-backend.js";

beforeEach(() => {
  window.sessionStorage.clear();
  const backend = createEditorialAuthBackend();
  vi.stubGlobal(
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      return await backend(
        new Request(new URL(url, "http://localhost"), { ...init, signal: null })
      );
    }
  );
});

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
