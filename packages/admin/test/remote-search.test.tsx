import { createMemoryHistory, Outlet } from "@tanstack/react-router";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminCommandPalette } from "../src/admin-command-palette.js";
import { defineAdminEntity } from "../src/admin-data-adapter.js";
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "../src/admin-entity-routing.js";
import type { AdminApplication } from "../src/admin-entity-routing.js";
import type {
  AdminSearchSource,
  AdminSearchResult,
} from "../src/admin-remote-search.js";

const Root = () => (
  <>
    <AdminCommandPalette />
    <Outlet />
  </>
);
const apps: AdminApplication[] = [];
const search = vi.fn<AdminSearchSource["search"]>();
const selected = vi.fn<() => void>();
const setup = async (
  sources: readonly AdminSearchSource[] = [
    { id: "directory", label: "Directory", search },
  ]
) => {
  const app = createAdminApplication({
    Root,
    entities: [
      defineAdminEntity({
        adapter: { list: () => Promise.resolve({ items: [], total: 0 }) },
        key: "documents",
        label: "Documents",
        parseValues: (value: unknown) => value,
        reference: (record: { id: string; label: string }) => record,
        singularLabel: "Document",
      }),
    ],
    history: createMemoryHistory({ initialEntries: ["/documents"] }),
    searchSources: sources,
  });
  apps.push(app);
  await app.router.load();
  render(<AdminApplicationProvider application={app} />);
  await userEvent.click(
    await screen.findByRole("button", { name: "Command palette" })
  );
  return app;
};
const result = (id = "remote"): AdminSearchResult => ({
  execute: selected,
  id,
  label: "Unloaded record",
});
const query = (value: string) =>
  fireEvent.change(screen.getByRole("combobox", { name: "Search commands" }), {
    target: { value },
  });
describe("connected remote command search", () => {
  beforeEach(() => {
    search.mockResolvedValue([result()]);
    vi.spyOn(window, "scrollTo").mockReturnValue();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn<() => void>();
        unobserve = vi.fn<() => void>();
        disconnect = vi.fn<() => void>();
      }
    );
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: () => {},
    });
  });
  afterEach(() => {
    cleanup();
    for (const app of apps.splice(0)) {
      app.dispose();
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    search.mockReset();
    selected.mockReset();
  });

  it("does not preload, debounces query changes and keeps server-ranked results", async () => {
    await setup();
    expect(search).not.toHaveBeenCalled();
    query("a");
    query("ab");
    query("different match");
    const option = await screen.findByRole("option", {
      name: "Unloaded record",
    });
    expect(search).toHaveBeenCalledOnce();
    expect(search.mock.calls[0]?.[0]).toMatchObject({
      limit: 20,
      locale: "en",
      query: "different match",
    });
    await userEvent.click(option);
    await waitFor(() => expect(selected).toHaveBeenCalledOnce());
  });

  it("aborts superseded queries and ignores non-cooperative late responses", async () => {
    const first = Promise.withResolvers<readonly AdminSearchResult[]>();
    search.mockReturnValueOnce(first.promise);
    await setup();
    query("first");
    await waitFor(() => expect(search).toHaveBeenCalledOnce());
    const signal = search.mock.calls[0]?.[0].signal;
    query("second");
    expect(signal?.aborted).toBeTruthy();
    await screen.findByRole("option", { name: "Unloaded record" });
    await act(async () => {
      first.resolve([{ ...result("late"), label: "Stale result" }]);
      await first.promise;
    });
    expect(screen.queryByText("Stale result")).toBeNull();
  });

  it("retries only the failed source without exposing raw errors", async () => {
    search.mockRejectedValueOnce(new Error("private transport failure"));
    const other = vi.fn<AdminSearchSource["search"]>().mockResolvedValue([]);
    await setup([
      { id: "directory", label: "Directory", search },
      { id: "archive", label: "Archive", search: other },
    ]);
    query("entry");
    await userEvent.click(
      await screen.findByRole("button", { name: "Retry Directory" })
    );
    await screen.findByRole("option", { name: "Unloaded record" });
    expect(search).toHaveBeenCalledTimes(2);
    expect(other).toHaveBeenCalledOnce();
    expect(screen.queryByText("private transport failure")).toBeNull();
  });

  it("aborts and removes remote results on route changes and pause", async () => {
    const app = await setup();
    query("entry");
    await screen.findByRole("option", { name: "Unloaded record" });
    const signal = search.mock.calls[0]?.[0].signal;
    await act(async () => {
      await app.router.navigate({ search: { view: "other" }, to: "/" });
    });
    expect(signal?.aborted).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Command palette" })
    );
    query("entry");
    await screen.findByRole("option", { name: "Unloaded record" });
    const next = search.mock.calls.at(-1)?.[0].signal;
    act(() => app.pause());
    expect(next?.aborted).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(selected).not.toHaveBeenCalled();
  });

  it("treats duplicate or oversized provider results as retryable errors", async () => {
    search.mockResolvedValueOnce([result(), result()]);
    await setup();
    query("entry");
    await screen.findByRole("button", { name: "Retry Directory" });
    expect(
      screen.queryByRole("option", { name: "Unloaded record" })
    ).toBeNull();
  });
});
