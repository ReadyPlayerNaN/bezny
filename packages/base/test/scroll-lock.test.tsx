// @vitest-environment jsdom
/* oxlint-disable vitest/prefer-to-be-truthy, vitest/prefer-to-be-falsy -- Assert literal lock-state and event-prevention booleans. */
import { cleanup, render, screen } from "@testing-library/react";
import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  acquireDocumentScrollLock,
  RemoveScroll,
} from "../src/layout/scroll-lock.js";

const releases: (() => void)[] = [];
const acquire = () => {
  const release = acquireDocumentScrollLock(document);
  releases.push(release);
  return release;
};
describe(RemoveScroll, () => {
  afterEach(() => {
    cleanup();
    for (const release of releases.splice(0)) {
      release();
    }
    delete document.documentElement.dataset.beznyScrollLocked;
    delete document.documentElement.dataset.beznyScrollbarGutter;
    vi.restoreAllMocks();
  });

  it("keeps nested locks until their final release, including out-of-order and duplicate cleanup", () => {
    const outer = acquire();
    const inner = acquire();
    outer();
    outer();
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollLocked")
    ).toBe(true);
    inner();
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollLocked")
    ).toBe(false);
  });

  it("restores pre-existing lock attributes without mutating inline styles", () => {
    const root = document.documentElement;
    root.dataset.beznyScrollLocked = "host-lock";
    root.dataset.beznyScrollbarGutter = "host-gutter";
    const rootClasses = [...root.classList];
    const rootStyle = root.getAttribute("style");
    const bodyStyle = document.body.getAttribute("style");
    const styles = [...document.querySelectorAll("style")];
    const release = acquire();
    release();
    expect({
      bodyStyle: document.body.getAttribute("style"),
      classes: [...root.classList],
      gutter: root.dataset.beznyScrollbarGutter,
      lock: root.dataset.beznyScrollLocked,
      rootStyle: root.getAttribute("style"),
      styles: [...document.querySelectorAll("style")],
    }).toStrictEqual({
      bodyStyle,
      classes: rootClasses,
      gutter: "host-gutter",
      lock: "host-lock",
      rootStyle,
      styles,
    });
  });

  it("reserves only existing classic scrollbar space", () => {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      window.innerWidth
    );
    const first = acquire();
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollbarGutter")
    ).toBe(false);
    first();
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      window.innerWidth - 15
    );
    const second = acquire();
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollbarGutter")
    ).toBe(true);
    second();
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollbarGutter")
    ).toBe(false);
  });

  it("handles enabled transitions, forwards refs and leaves caller styling untouched", () => {
    const ref = createRef<HTMLElement>();
    const { rerender, unmount } = render(
      <RemoveScroll ref={ref} enabled={false}>
        <div>Inside</div>
      </RemoveScroll>
    );
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollLocked")
    ).toBe(false);
    expect(ref.current?.textContent).toBe("Inside");
    rerender(
      <RemoveScroll ref={ref}>
        <div>Inside</div>
      </RemoveScroll>
    );
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollLocked")
    ).toBe(true);
    rerender(
      <RemoveScroll ref={ref} enabled={false}>
        <div>Inside</div>
      </RemoveScroll>
    );
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollLocked")
    ).toBe(false);
    unmount();
    expect(ref.current).toBeNull();
  });

  it("keeps scroll isolation without injecting CSS when scrollbar removal is disabled", () => {
    const styles = [...document.querySelectorAll("style")];
    render(
      <RemoveScroll removeScrollBar={false}>
        <div>Inside</div>
      </RemoveScroll>
    );
    expect(screen.getByText("Inside")).toBeTruthy();
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollLocked")
    ).toBe(false);
    const wheel = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: 100,
    });
    document.body.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(true);
    expect([...document.querySelectorAll("style")]).toStrictEqual(styles);
  });

  it("balances lock lifetime under React StrictMode and unmount", () => {
    const styles = [...document.querySelectorAll("style")];
    const { unmount } = render(
      <StrictMode>
        <RemoveScroll>
          <div>Inside</div>
        </RemoveScroll>
      </StrictMode>
    );
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollLocked")
    ).toBe(true);
    expect([...document.querySelectorAll("style")]).toStrictEqual(styles);
    unmount();
    expect(
      Object.hasOwn(document.documentElement.dataset, "beznyScrollLocked")
    ).toBe(false);
  });
});
