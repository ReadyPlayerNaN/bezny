import {
  createMemoryHistory,
  defaultStringifySearch,
  Outlet,
} from "@tanstack/react-router";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type { AdminListQuery } from "../src/admin-data-adapter.js";
import { createAdminEntityRegistry } from "../src/admin-entity-model.js";
import type { AdminCommand } from "../src/admin-entity-model.js";
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "../src/admin-entity-routing.js";
import type { AdminApplication } from "../src/admin-entity-routing.js";
import { useAdminListControls } from "../src/admin-list-controls.js";

let commands: readonly AdminCommand[] = [];
const Root = () => {
  const controls = useAdminListControls();
  useEffect(() => {
    commands = controls.filterCommands;
  });
  return <Outlet />;
};
const apps: AdminApplication[] = [];
const list =
  vi.fn<
    (query: AdminListQuery) => Promise<{ items: never[]; total: number }>
  >();
const definition = () =>
  defineAdminEntity({
    adapter: { list },
    filters: [
      { before: "until", key: "from", label: "From", type: "date" },
      { key: "until", label: "Until", type: "date" },
      {
        before: "maximum",
        key: "minimum",
        label: "Minimum",
        max: 100,
        min: 0,
        step: 0.5,
        type: "number",
      },
      { key: "maximum", label: "Maximum", max: 100, min: 0, type: "number" },
    ],
    key: "documents",
    label: "Documents",
    parseValues: (v: unknown) => v,
    reference: (r: { id: string; label: string }) => r,
    singularLabel: "Document",
  });
const setup = async (filters: Record<string, string> = {}) => {
  const app = createAdminApplication({
    Root,
    entities: [definition()],
    history: createMemoryHistory({
      initialEntries: [`/documents${defaultStringifySearch({ filters })}`],
    }),
  });
  apps.push(app);
  await app.router.load();
  render(<AdminApplicationProvider application={app} />);
  await screen.findByText("No records found.");
  return app;
};
const input = (key: string) => {
  const command = commands.find((c) => c.id.endsWith(`.${key}`));
  if (!command?.input) {
    throw new Error("Missing command");
  }
  return command.input;
};
describe("typed registered filters", () => {
  beforeEach(() => {
    list.mockResolvedValue({ items: [], total: 0 });
    vi.spyOn(window, "scrollTo").mockReturnValue();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn<() => void>();
        unobserve = vi.fn<() => void>();
        disconnect = vi.fn<() => void>();
      }
    );
  });
  afterEach(() => {
    cleanup();
    for (const app of apps.splice(0)) {
      app.dispose();
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    list.mockReset();
    commands = [];
  });

  it("drops invalid dates, numeric values and reversed ranges from URL hydration", async () => {
    const app = await setup({
      from: "2026-02-30",
      maximum: "10",
      minimum: "90",
      until: "bad",
    });
    expect(app.store.get(app.session.snapshotAtom).query.filters).toStrictEqual(
      {}
    );
    expect(list.mock.calls[0]?.[0].filters).toStrictEqual({});
  });

  it("rejects invalid shared commands without mutating the active URL", async () => {
    const app = await setup({ from: "2026-01-01", until: "2026-01-31" });
    expect(() => input("from").execute("2026-02-01")).toThrow(/range/u);
    expect(() => input("minimum").execute("0.3")).toThrow(/value/u);
    expect(() => input("maximum").execute("Infinity")).toThrow(/value/u);
    expect(app.store.get(app.session.snapshotAtom).query.filters).toStrictEqual(
      { from: "2026-01-01", until: "2026-01-31" }
    );
  });

  it("uses the shared RHF editor in the collection and supports clearing", async () => {
    const app = await setup();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Minimum: All" }));
    await user.type(
      await screen.findByRole("spinbutton", { name: "Minimum" }),
      "10.5"
    );
    await user.click(screen.getByRole("button", { name: "Apply command" }));
    await waitFor(() =>
      expect(
        app.store.get(app.session.snapshotAtom).query.filters.minimum
      ).toBe("10.5")
    );
    expect(list.mock.calls.at(-1)?.[0].page).toBe(1);
    await act(async () => {
      await input("minimum").execute("");
    });
    expect(app.store.get(app.session.snapshotAtom).query.filters).toStrictEqual(
      {}
    );
  });

  it("fences stale commands and reconstructs typed filters through history", async () => {
    const app = await setup();
    const stale = input("minimum");
    await act(async () => {
      await input("from").execute("2026-01-01");
    });
    await act(async () => {
      await stale.execute("5");
    });
    expect(app.store.get(app.session.snapshotAtom).query.filters).toStrictEqual(
      { from: "2026-01-01" }
    );
    act(() => {
      app.router.history.back();
    });
    await waitFor(() =>
      expect(
        app.store.get(app.session.snapshotAtom).query.filters
      ).toStrictEqual({})
    );
  });

  it("rejects invalid registration and mismatched paired bounds", () => {
    const entity = definition();
    expect(() =>
      createAdminEntityRegistry([
        {
          ...entity,
          filters: [
            { key: "amount", label: "Amount", step: 0, type: "number" },
          ],
        },
      ])
    ).toThrow(/step/u);
    expect(() =>
      createAdminEntityRegistry([
        {
          ...entity,
          filters: [
            { before: "missing", key: "start", label: "Start", type: "date" },
          ],
        },
      ])
    ).toThrow(/range/u);
    expect(() =>
      createAdminEntityRegistry([
        {
          ...entity,
          filters: [
            { key: "date", label: "Date", minDate: "2026-02-30", type: "date" },
          ],
        },
      ])
    ).toThrow(/date/u);
  });
});
