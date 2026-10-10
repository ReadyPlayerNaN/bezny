// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Avatar, AvatarImage, AvatarFallback } from "../src/index.js";
import type { AvatarImageLoadingStatus } from "../src/index.js";

// Radix preloads images off-DOM. Model that loader boundary, not Radix hooks.
const NativeImage = window.Image;
const preloadedImages: HTMLImageElement[] = [];
const getPreloadedImage = (index = 0) => {
  const image = preloadedImages[index];
  if (!image) {
    throw new Error(`Missing off-DOM image loader ${index}`);
  }
  return image;
};
const loadPreloadedImage = (image: HTMLImageElement) => {
  Object.defineProperties(image, {
    complete: { value: true },
    naturalWidth: { value: 64 },
  });
  fireEvent.load(image);
};
describe(Avatar, () => {
  beforeEach(() => {
    preloadedImages.length = 0;
    vi.spyOn(window, "Image").mockImplementation(
      class extends NativeImage {
        constructor() {
          super();
          Object.defineProperties(this, {
            complete: { configurable: true, value: false },
            naturalWidth: { configurable: true, value: 0 },
          });
          preloadedImages.push(this);
        }
      }
    );
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders accessible fallback content for absent sources and forwards root/fallback props", () => {
    const rootRef = createRef<HTMLSpanElement>();
    const fallbackRef = createRef<HTMLSpanElement>();
    render(
      <Avatar
        ref={rootRef}
        size="small"
        className="custom-avatar"
        title="Account"
      >
        <AvatarImage alt="Ada Lovelace" />
        {/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Initials form a named text graphic, not an image element. */}
        <AvatarFallback
          ref={fallbackRef}
          role="img"
          aria-label="Ada Lovelace"
          className="custom-fallback"
        >
          AL
        </AvatarFallback>
        {/* oxlint-enable jsx-a11y/prefer-tag-over-role */}
      </Avatar>
    );
    expect(fallbackRef.current).toBe(
      screen.getByRole("img", { name: "Ada Lovelace" })
    );
    expect(rootRef.current?.dataset.size).toBe("small");
    expect(rootRef.current?.classList.contains("custom-avatar")).toBeTruthy();
    expect(
      fallbackRef.current?.classList.contains("custom-fallback")
    ).toBeTruthy();
    expect(preloadedImages).toHaveLength(0);
  });

  it("shows fallback while loading, then image with alt/ref/native load props after success", async () => {
    const imageRef = createRef<HTMLImageElement>();
    const handleLoadingStatusChange =
      vi.fn<(status: AvatarImageLoadingStatus) => void>();
    const handleLoad = vi.fn<() => void>();
    render(
      <Avatar>
        <AvatarImage
          ref={imageRef}
          src="/ada.png"
          alt="Ada Lovelace"
          onLoadingStatusChange={handleLoadingStatusChange}
          onLoad={handleLoad}
        />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText("AL")).toBeTruthy();
    loadPreloadedImage(getPreloadedImage());
    const image = await screen.findByRole("img", { name: "Ada Lovelace" });
    expect(imageRef.current).toBe(image);
    expect(screen.queryByText("AL")).toBeNull();
    fireEvent.load(image);
    expect(handleLoad).toHaveBeenCalledOnce();
    expect(handleLoadingStatusChange.mock.calls).toStrictEqual([
      ["loading"],
      ["loaded"],
    ]);
  });

  it("retains fallback on load error and forwards loader cross-origin/referrer policy", () => {
    const handleLoadingStatusChange =
      vi.fn<(status: AvatarImageLoadingStatus) => void>();
    render(
      <Avatar>
        <AvatarImage
          src="/missing.png"
          alt="Ada"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onLoadingStatusChange={handleLoadingStatusChange}
        />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );
    const image = getPreloadedImage();
    expect(image.crossOrigin).toBe("anonymous");
    expect(image.referrerPolicy).toBe("no-referrer");
    fireEvent.error(image);
    expect(handleLoadingStatusChange).toHaveBeenCalledWith("error");
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("AL")).toBeTruthy();
  });

  it("returns to fallback and ignores obsolete loader events when the source changes", async () => {
    const { rerender } = render(
      <Avatar>
        <AvatarImage src="/ada.png" alt="Ada" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );
    const first = getPreloadedImage();
    loadPreloadedImage(first);
    await screen.findByRole("img", { name: "Ada" });
    rerender(
      <Avatar>
        <AvatarImage src="/grace.png" alt="Grace" />
        <AvatarFallback>GH</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText("GH")).toBeTruthy();
    fireEvent.error(first);
    expect(screen.queryByRole("img")).toBeNull();
    loadPreloadedImage(getPreloadedImage(1));
    await screen.findByRole("img", { name: "Grace" });
    expect(screen.queryByText("GH")).toBeNull();
  });

  it("honours fallback delay and cleans up pending fallback timers on unmount", async () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <Avatar>
        <AvatarFallback delayMs={200}>AL</AvatarFallback>
      </Avatar>
    );
    expect(screen.queryByText("AL")).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(199));
    expect(screen.queryByText("AL")).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByText("AL")).toBeTruthy();
    unmount();
    const delayed = render(
      <Avatar>
        <AvatarFallback delayMs={200}>GH</AvatarFallback>
      </Avatar>
    );
    delayed.unmount();
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(screen.queryByText("GH")).toBeNull();
  });

  it("preserves asChild composition, native button keyboard activation and large sizing", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn<() => void>();
    render(
      <Avatar asChild size="large">
        <button type="button" aria-label="Open profile" onClick={handleClick}>
          <AvatarImage asChild src="/ada.png" alt="Ada">
            <img alt="Ada" className="custom-image" />
          </AvatarImage>
          <AvatarFallback asChild>
            <span>AL</span>
          </AvatarFallback>
        </button>
      </Avatar>
    );
    loadPreloadedImage(getPreloadedImage());
    const image = await screen.findByRole("img", { name: "Ada" });
    expect(image.classList.contains("custom-image")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Open profile" }).dataset.size
    ).toBe("large");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("removes off-DOM image event listeners on unmount", () => {
    const handleLoadingStatusChange =
      vi.fn<(status: AvatarImageLoadingStatus) => void>();
    const { unmount } = render(
      <Avatar>
        <AvatarImage
          src="/ada.png"
          alt="Ada"
          onLoadingStatusChange={handleLoadingStatusChange}
        />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    );
    const image = getPreloadedImage();
    unmount();
    handleLoadingStatusChange.mockClear();
    loadPreloadedImage(image);
    expect(handleLoadingStatusChange).not.toHaveBeenCalled();
  });
});
