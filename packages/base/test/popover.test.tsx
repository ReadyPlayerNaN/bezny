// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverAnchor,
  PopoverContent,
  PopoverClose,
  PopoverArrow,
} from "../src/index.js";

describe(Popover, () => {
  afterEach(cleanup);

  it("opens with Enter, focuses contents, closes with Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Details</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Details panel">
          <label>
            Note
            <input />
          </label>
          <PopoverClose>Done</PopoverClose>
          <PopoverArrow />
        </PopoverContent>
      </Popover>
    );
    await user.tab();
    await user.keyboard("{Enter}");
    const panel = await screen.findByRole("dialog", { name: "Details panel" });
    expect(panel.dataset.state).toBe("open");
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Note" })
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Details" })
    );
  });

  it("supports uncontrolled defaultOpen and close without submitting an enclosing form", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn<
      (event: React.SubmitEvent<HTMLFormElement>) => void
    >((event) => event.preventDefault());
    render(
      <form onSubmit={handleSubmit}>
        <Popover defaultOpen>
          <PopoverTrigger>Details</PopoverTrigger>
          <PopoverContent aria-label="Panel">
            <PopoverClose>Done</PopoverClose>
          </PopoverContent>
        </Popover>
      </form>
    );
    await user.click(await screen.findByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await user.click(screen.getByRole("button", { name: "Details" }));
    await screen.findByRole("dialog");
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("requests controlled changes without overriding the caller state", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn<(open: boolean) => void>();
    const { rerender } = render(
      <Popover open={false} onOpenChange={handleOpenChange}>
        <PopoverTrigger>Details</PopoverTrigger>
        <PopoverContent aria-label="Panel">Content</PopoverContent>
      </Popover>
    );
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(handleOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <Popover open onOpenChange={handleOpenChange}>
        <PopoverTrigger>Details</PopoverTrigger>
        <PopoverContent aria-label="Panel">Content</PopoverContent>
      </Popover>
    );
    await screen.findByRole("dialog", { name: "Panel" });
  });

  it("supports a custom anchor, themed portal container, refs, and content asChild", async () => {
    const anchorRef = createRef<HTMLDivElement>();
    const contentRef = createRef<HTMLDivElement>();
    const arrowRef = createRef<SVGSVGElement>();
    const boundary = document.createElement("div");
    boundary.className = "bezny-dark";
    document.body.append(boundary);
    render(
      <Popover defaultOpen>
        <PopoverAnchor asChild ref={anchorRef}>
          <div>Anchor</div>
        </PopoverAnchor>
        <PopoverTrigger>Details</PopoverTrigger>
        <PopoverContent
          asChild
          ref={contentRef}
          container={boundary}
          className="custom-panel"
          align="start"
        >
          <div aria-label="Anchored panel">
            <PopoverArrow ref={arrowRef} />
          </div>
        </PopoverContent>
      </Popover>
    );
    const panel = await screen.findByRole("dialog", { name: "Anchored panel" });
    expect(contentRef.current).toBe(panel);
    expect(anchorRef.current?.textContent).toBe("Anchor");
    expect(boundary.contains(panel)).toBeTruthy();
    expect(panel.classList.contains("custom-panel")).toBeTruthy();
    expect(arrowRef.current?.tagName).toBe("svg");
    cleanup();
    boundary.remove();
  });

  it("dismisses on outside interaction unless the caller cancels it", async () => {
    const user = userEvent.setup();
    const handleInteractOutside = vi.fn<(event: Event) => void>((event) =>
      event.preventDefault()
    );
    const { rerender } = render(
      <>
        <button type="button">Outside</button>
        <Popover defaultOpen>
          <PopoverTrigger>Details</PopoverTrigger>
          <PopoverContent
            aria-label="Panel"
            onInteractOutside={handleInteractOutside}
          >
            Content
          </PopoverContent>
        </Popover>
      </>
    );
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(handleInteractOutside).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(screen.getByRole("dialog")).toBeTruthy();
    rerender(
      <>
        <button type="button">Outside</button>
        <Popover defaultOpen>
          <PopoverTrigger>Details</PopoverTrigger>
          <PopoverContent aria-label="Panel">Content</PopoverContent>
        </Popover>
      </>
    );
    await user.click(screen.getByRole("button", { name: "Outside" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Outside" })
    );
  });

  it("preserves modal focus trapping and caller cancellation of auto focus", async () => {
    const user = userEvent.setup();
    const handleOpenAutoFocus = vi.fn<(event: Event) => void>((event) =>
      event.preventDefault()
    );
    render(
      <Popover modal>
        <PopoverTrigger>Details</PopoverTrigger>
        <PopoverContent
          aria-label="Modal panel"
          onOpenAutoFocus={handleOpenAutoFocus}
        >
          <button type="button">First</button>
          <PopoverClose>Last</PopoverClose>
        </PopoverContent>
      </Popover>
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    await user.click(trigger);
    await screen.findByRole("dialog");
    expect(handleOpenAutoFocus).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
    const last = screen.getByRole("button", { name: "Last" });
    last.focus();
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "First" })
    );
  });

  it("preserves force-mounted closed content and disabled triggers", async () => {
    const user = userEvent.setup();
    render(
      <Popover open={false}>
        <PopoverTrigger disabled>Details</PopoverTrigger>
        <PopoverContent forceMount aria-label="Animation target">
          Content
        </PopoverContent>
      </Popover>
    );
    const panel = await screen.findByRole("dialog", {
      name: "Animation target",
    });
    expect(panel.dataset.state).toBe("closed");
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(panel.dataset.state).toBe("closed");
  });
});
