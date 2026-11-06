import { createMemoryHistory, Outlet } from "@tanstack/react-router";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import { createAdminEntityRegistry } from "../src/admin-entity-model.js";
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "../src/admin-entity-routing.js";
import type { AdminApplication } from "../src/admin-entity-routing.js";
import { AdminHeader } from "../src/admin-header.js";

const Root = () => (
  <>
    <AdminHeader title="Catalog" />
    <Outlet />
  </>
);
const applications: AdminApplication[] = [];
const definition = () =>
  defineAdminEntity({
    adapter: {
      create: (values: { label: string }) =>
        Promise.resolve({ id: "2", ...values }),
      list: () =>
        Promise.resolve({
          items: [{ id: "1", label: "Observed event" }],
          total: 1,
        }),
    },
    form: { fields: [{ key: "label", label: "Label", required: true }] },
    key: "events",
    label: "Events",
    parseValues: (values: unknown) => {
      if (
        !values ||
        typeof values !== "object" ||
        !("label" in values) ||
        typeof values.label !== "string"
      ) {
        throw new Error("Invalid label");
      }
      return { label: values.label };
    },
    reference: (record: { id: string; label: string }) => record,
    singularLabel: "Event",
  });
const setup = async (path: string) => {
  const app = createAdminApplication({
    Root,
    entities: [definition()],
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  applications.push(app);
  await app.router.load();
  render(<AdminApplicationProvider application={app} />);
  return app;
};
describe("list-only registrations", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockReturnValue();
  });
  afterEach(() => {
    cleanup();
    for (const app of applications.splice(0)) {
      app.dispose();
    }
    vi.restoreAllMocks();
  });

  it("renders records without dead detail links or view commands", async () => {
    await setup("/events");
    await expect(screen.findByText("Observed event")).resolves.toBeTruthy();
    expect(screen.queryByRole("link", { name: "Observed event" })).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Command palette" })
    );
    expect(
      screen.queryByRole("option", { name: /View Observed event/u })
    ).toBeNull();
  });

  it("rejects direct unsupported detail routes without a fabricated read", async () => {
    const app = await setup("/events/1");
    await expect(
      screen.findByRole("heading", { name: /unavailable/iu })
    ).resolves.toBeTruthy();
    expect(app.store.get(app.session.snapshotAtom).items).toStrictEqual([]);
  });

  it("returns to the collection after creating a list-only record", async () => {
    const app = await setup("/events/create");
    await userEvent.type(
      await screen.findByRole("textbox", { name: "Label" }),
      "New event"
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(app.router.state.location.pathname).toBe("/events")
    );
  });

  it("rejects update and explicit detail screens without detail reads", () => {
    const entity = definition();
    expect(() =>
      createAdminEntityRegistry([{ ...entity, screens: { detail: Root } }])
    ).toThrow(/require a get adapter/u);
    expect(() =>
      createAdminEntityRegistry([
        {
          ...entity,
          adapter: {
            ...entity.adapter,
            update: () =>
              Promise.resolve({ data: {}, id: "1", label: "Event" }),
          },
        },
      ])
    ).toThrow(/require a get adapter/u);
  });
});
