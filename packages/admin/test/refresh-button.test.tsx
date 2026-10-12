import "../../base/test/dom-observers.js";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminCommand } from "../src/admin-entity-model.js";
import { createAdminI18n } from "../src/admin-i18n.js";
import { AdminRefreshButton } from "../src/admin-refresh-button.js";

const mount = (execute: AdminCommand["execute"]) =>
  render(
    <I18nextProvider i18n={createAdminI18n()}>
      <AdminRefreshButton
        command={{ execute, id: "refresh", label: "Refresh records" }}
      />
    </I18nextProvider>
  );
const feedbackState = (button: HTMLElement) => ({
  busy: button.getAttribute("aria-busy"),
  disabled: button.hasAttribute("disabled"),
  spinner: button.querySelector('[class*="spinner"]') !== null,
});
const activeFeedback = { busy: "true", disabled: true, spinner: true };
const idleFeedback = { busy: null, disabled: false, spinner: false };
const clickRefresh = async (button: HTMLElement) => {
  await act(async () => {
    fireEvent.click(button);
    await Promise.resolve();
  });
};
const advanceTime = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

describe("refresh loading feedback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps the animated loading state and blocks re-clicks for at least 666 ms after a fast reload", async () => {
    const execute = vi.fn<() => Promise<void>>().mockResolvedValue();
    mount(execute);
    const button = screen.getByRole("button", { name: "Refresh records" });
    await clickRefresh(button);
    expect(feedbackState(button)).toStrictEqual(activeFeedback);
    await advanceTime(665);
    expect(feedbackState(button)).toStrictEqual(activeFeedback);
    fireEvent.click(button);
    expect(execute).toHaveBeenCalledOnce();
    await advanceTime(1);
    expect(feedbackState(button)).toStrictEqual(idleFeedback);
    await clickRefresh(button);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("continues animating and blocking clicks until a slow reload settles", async () => {
    const gate = Promise.withResolvers<null>();
    const execute = vi.fn<() => Promise<void>>(async () => {
      await gate.promise;
    });
    mount(execute);
    const button = screen.getByRole("button", { name: "Refresh records" });
    fireEvent.click(button);
    await advanceTime(1000);
    expect(feedbackState(button)).toStrictEqual(activeFeedback);
    fireEvent.click(button);
    expect(execute).toHaveBeenCalledOnce();
    await act(async () => {
      gate.resolve(null);
      await gate.promise;
    });
    expect(feedbackState(button)).toStrictEqual(idleFeedback);
  });

  it("announces failure but keeps feedback and retry locked until the minimum period ends", async () => {
    const execute = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error("offline"));
    mount(execute);
    const button = screen.getByRole("button", { name: "Refresh records" });
    await clickRefresh(button);
    expect(screen.getByRole("alert")).toBeTruthy();
    await advanceTime(665);
    expect(feedbackState(button)).toStrictEqual(activeFeedback);
    fireEvent.click(button);
    expect(execute).toHaveBeenCalledOnce();
    await advanceTime(1);
    expect(feedbackState(button)).toStrictEqual(idleFeedback);
  });

  it("clears the feedback timer when the refresh control unmounts", async () => {
    const execute = vi.fn<() => Promise<void>>().mockResolvedValue();
    const view = mount(execute);
    await clickRefresh(screen.getByRole("button", { name: "Refresh records" }));
    expect(vi.getTimerCount()).toBe(1);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    await advanceTime(666);
    expect(execute).toHaveBeenCalledOnce();
  });
});
