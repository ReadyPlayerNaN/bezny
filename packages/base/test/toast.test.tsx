// @vitest-environment jsdom
/* oxlint-disable vitest/max-expects -- Integration tests verify composed keyboard and ref contracts. */
import { setTimeout as delay } from "node:timers/promises";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ToastProvider,
  Toast,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from "../src/index.js";

describe(Toast, () => {
  afterEach(cleanup);

  it("preserves live announcements, F8 focus, Tab navigation and Escape dismissal", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider duration={Infinity}>
        <Toast>
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>Your changes are saved.</ToastDescription>
          <ToastClose>Dismiss</ToastClose>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    const title = await screen.findByText("Saved");
    const toast = title.closest("li");
    expect(toast?.textContent).toContain("Your changes are saved.");
    expect(document.activeElement).not.toBe(toast);
    const announcement = await screen.findByText("Notification", {
      exact: false,
      selector: '[role="status"]',
    });
    expect(announcement.getAttribute("aria-live")).toBe("assertive");
    fireEvent.keyDown(document, { code: "F8", key: "F8" });
    expect(document.activeElement).toBe(screen.getByRole("list"));
    await user.tab();
    expect(document.activeElement).toBe(toast);
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Dismiss" })
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Saved")).toBeNull());
  });

  it("supports asChild actions, refs, custom classes and keyboard activation without form submission", async () => {
    const user = userEvent.setup();
    const rootRef = createRef<HTMLLIElement>();
    const viewportRef = createRef<HTMLOListElement>();
    const actionRef = createRef<HTMLButtonElement>();
    const handleAction = vi.fn<() => void>();
    const handleSubmit = vi.fn<
      (event: React.SubmitEvent<HTMLFormElement>) => void
    >((event) => event.preventDefault());
    render(
      <form onSubmit={handleSubmit}>
        <ToastProvider duration={Infinity}>
          <Toast ref={rootRef} className="custom-toast">
            <ToastDescription>Removed</ToastDescription>
            <ToastAction
              asChild
              ref={actionRef}
              altText="Restore the item from Trash"
              onClick={handleAction}
            >
              <button type="button">Undo</button>
            </ToastAction>
          </Toast>
          <ToastViewport ref={viewportRef} className="custom-viewport" />
        </ToastProvider>
      </form>
    );
    const action = await screen.findByRole("button", { name: "Undo" });
    expect(actionRef.current).toBe(action);
    expect(rootRef.current?.classList.contains("custom-toast")).toBeTruthy();
    expect(viewportRef.current?.contains(rootRef.current)).toBeTruthy();
    expect(
      viewportRef.current?.classList.contains("custom-viewport")
    ).toBeTruthy();
    action.focus();
    await user.keyboard(" ");
    expect(handleAction).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText("Removed")).toBeNull());
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("requests controlled changes without overriding the supplied state", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn<(open: boolean) => void>();
    const { rerender } = render(
      <ToastProvider duration={Infinity}>
        <Toast open onOpenChange={handleOpenChange}>
          <ToastDescription>Controlled</ToastDescription>
          <ToastClose>Dismiss</ToastClose>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    await user.click(await screen.findByRole("button", { name: "Dismiss" }));
    expect(handleOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(screen.getByText("Controlled")).toBeTruthy();
    rerender(
      <ToastProvider duration={Infinity}>
        <Toast open={false} onOpenChange={handleOpenChange}>
          <ToastDescription>Controlled</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );
    await waitFor(() => expect(screen.queryByText("Controlled")).toBeNull());
  });

  it("uses background announcements and pauses automatic dismissal on viewport hover", async () => {
    const handlePause = vi.fn<() => void>();
    const handleResume = vi.fn<() => void>();
    render(
      <ToastProvider duration={200}>
        <Toast type="background" onPause={handlePause} onResume={handleResume}>
          <ToastDescription>Background update</ToastDescription>
        </Toast>
        <ToastViewport data-testid="viewport" />
      </ToastProvider>
    );
    const announcement = await screen.findByText("Notification", {
      exact: false,
      selector: '[role="status"]',
    });
    expect(announcement.getAttribute("aria-live")).toBe("polite");
    fireEvent.pointerMove(screen.getByTestId("viewport"));
    expect(handlePause).toHaveBeenCalledOnce();
    await delay(250);
    expect(screen.getByText("Background update")).toBeTruthy();
    const wrapper = screen.getByTestId("viewport").parentElement;
    if (!wrapper) {
      throw new Error("Toast viewport wrapper is missing");
    }
    fireEvent.pointerLeave(wrapper);
    expect(handleResume).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.queryByText("Background update")).toBeNull()
    );
  });
});
