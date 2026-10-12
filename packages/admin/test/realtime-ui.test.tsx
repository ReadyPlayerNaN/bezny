import { createMemoryHistory, Outlet } from "@tanstack/react-router";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type { AdminSubscriptionObserver } from "../src/admin-data-adapter.js";
import {
  AdminApplicationProvider,
  createAdminApplication,
} from "../src/admin-entity-routing.js";

const applications: ReturnType<typeof createAdminApplication>[] = [];
describe("realtime provider integration", () => {
  afterEach(() => {
    cleanup();
    for (const application of applications.splice(0)) {
      application.dispose();
    }
  });

  it("updates the default list from backend notifications and releases the stream on provider unmount", async () => {
    const record = { id: "1", label: "Original record" };
    let observer: AdminSubscriptionObserver | undefined;
    let signal: AbortSignal | undefined;
    const unsubscribe = vi.fn<() => void>();
    const entity = defineAdminEntity({
      adapter: {
        get: () => Promise.resolve(record),
        list: () => Promise.resolve({ items: [record], total: 1 }),
        subscribe: (nextObserver, request) => {
          observer = nextObserver;
          ({ signal } = request);
          return unsubscribe;
        },
      },
      key: "examples",
      label: "Examples",
      parseValues: String,
      reference: (value: typeof record) => value,
      singularLabel: "Example",
    });
    const application = createAdminApplication({
      Root: () => <Outlet />,
      entities: [entity],
      history: createMemoryHistory({ initialEntries: ["/examples"] }),
    });
    applications.push(application);
    const view = render(<AdminApplicationProvider application={application} />);
    await expect(
      screen.findByRole("link", { name: "Original record" })
    ).resolves.toBeDefined();
    if (!observer) {
      throw new Error("Expected an active stream");
    }
    record.label = "Changed on the backend";
    act(() => observer?.onChange());
    await expect(
      screen.findByRole("link", { name: "Changed on the backend" })
    ).resolves.toBeDefined();
    view.unmount();
    act(() => observer?.onChange());
    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(signal?.aborted).toBeTruthy();
    expect(application.session.diagnostics()).toMatchObject({
      activeRecords: 0,
      realtimeRefreshScheduled: false,
      realtimeSubscriptions: 0,
    });
  });
});
