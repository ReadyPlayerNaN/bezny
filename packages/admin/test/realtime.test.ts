import type {
  AdminDataAdapter,
  AdminAdapterRequest,
  AdminEntitySubscription,
  AdminSubscriptionObserver,
  AdminListResult,
} from "@bezny/admin/adapters";
import { createMemoryHistory } from "@tanstack/react-router";
import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAdminRuntime } from "../src/admin-application-runtime.js";
import { defineAdminEntity } from "../src/admin-data-adapter.js";
import { createAdminDataSession } from "../src/admin-data-session.js";
import type {
  AdminDataRequest,
  AdminDataSession,
} from "../src/admin-data-session.js";
import { createAdminEntityRegistry } from "../src/admin-entity-model.js";
import { createAdminApplication } from "../src/admin-entity-routing.js";

interface RecordData {
  id: string;
  label: string;
}
const Screen = () => null;
const sessions: AdminDataSession[] = [];
const request = (
  entity = "examples",
  page = 1,
  locale = "en"
): AdminDataRequest => ({
  entity,
  query: { filters: {}, locale, page, pageSize: 2 },
  view: "list",
});
const fixture = (
  options: {
    list?: AdminDataAdapter<RecordData, string>["list"];
    subscribe?: AdminEntitySubscription | false;
    realtime?: boolean;
  } = {}
) => {
  const record = { id: "1", label: "Original" };
  const leases: {
    observer: AdminSubscriptionObserver;
    request: AdminAdapterRequest;
    cleanup: ReturnType<typeof vi.fn<() => void>>;
  }[] = [];
  const subscribe = vi.fn<AdminEntitySubscription>(
    options.subscribe ||
      ((observer, subscriptionRequest) => {
        const cleanup = vi.fn<() => void>();
        leases.push({ cleanup, observer, request: subscriptionRequest });
        return cleanup;
      })
  );
  const list = vi.fn<AdminDataAdapter<RecordData, string>["list"]>(
    options.list ?? (() => Promise.resolve({ items: [record], total: 4 }))
  );
  const get = vi.fn<AdminDataAdapter<RecordData, string>["get"]>(() =>
    Promise.resolve(record)
  );
  const definitions = ["examples", "others"].map((key) =>
    defineAdminEntity({
      adapter: {
        create: (label: string) => Promise.resolve({ id: "new", label }),
        get,
        list,
        ...(options.subscribe === false ? {} : { subscribe }),
        update: (id: string, label: string) => Promise.resolve({ id, label }),
      },
      key,
      label: key,
      parseValues: (value: unknown) => {
        if (typeof value !== "string") {
          throw new TypeError("Expected text");
        }
        return value;
      },
      reference: (value: RecordData) => value,
      screens: { create: Screen, detail: Screen, list: Screen, update: Screen },
      singularLabel: key,
    })
  );
  const store = createStore();
  const session = createAdminDataSession(
    createAdminEntityRegistry(definitions),
    store,
    {},
    { realtime: options.realtime ?? true }
  );
  sessions.push(session);
  return { definitions, get, leases, list, record, session, store, subscribe };
};
const leaseAt = (leases: ReturnType<typeof fixture>["leases"], index = 0) => {
  const lease = leases[index];
  if (!lease) {
    throw new Error("Missing subscription lease");
  }
  return lease;
};
const flush = async () => {
  await vi.advanceTimersByTimeAsync(1);
};

describe("optional realtime entity subscriptions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    for (const session of sessions.splice(0)) {
      session.dispose();
    }
    vi.useRealTimers();
  });

  it("keeps existing adapters unchanged and supports explicit opt-out", async () => {
    const old = fixture({ subscribe: false });
    const disabled = fixture({ realtime: false });
    await old.session.activate(request());
    await disabled.session.activate(request());
    expect(old.store.get(old.session.realtimeAtom).status).toBe("inactive");
    expect(disabled.subscribe).not.toHaveBeenCalled();
    expect(disabled.session.diagnostics().realtimeSubscriptions).toBe(0);
  });

  it("propagates opt-out through both application factories", async () => {
    const { definitions, subscribe } = fixture();
    const runtime = createAdminRuntime({
      entities: definitions,
      realtime: false,
    });
    const application = createAdminApplication({
      Root: Screen,
      entities: definitions,
      history: createMemoryHistory(),
      realtime: false,
    });
    sessions.push(runtime.session, application.session);
    await runtime.session.activate(request());
    await application.session.activate(request());
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("coalesces notifications and invalidates other cached pages/details", async () => {
    const { session, store, leases, list, get, record, subscribe } = fixture();
    await session.activate({ ...request(), recordId: "1", view: "detail" });
    await session.activate(request("examples", 2));
    await session.activate(request());
    record.label = "Realtime change";
    for (let event = 0; event < 100; event += 1) {
      leaseAt(leases).observer.onChange();
    }
    await flush();
    expect(list).toHaveBeenCalledTimes(3);
    expect(store.get(session.snapshotAtom).items[0]?.label).toBe(
      "Realtime change"
    );
    await session.activate({ ...request(), recordId: "1", view: "detail" });
    expect(get).toHaveBeenCalledTimes(2);
    expect(subscribe).toHaveBeenCalledOnce();
  });

  it("does not publish an initial response made stale by an event during loading", async () => {
    const gate = Promise.withResolvers<AdminListResult<RecordData>>();
    let reads = 0;
    const { session, store, leases, list } = fixture({
      list: async () => {
        reads += 1;
        if (reads === 1) {
          return await gate.promise;
        }
        return { items: [{ id: "1", label: "Fresh" }], total: 1 };
      },
    });
    const published: string[] = [];
    const unsubscribe = store.sub(session.snapshotAtom, () => {
      for (const item of store.get(session.snapshotAtom).items) {
        published.push(item.label);
      }
    });
    const loading = session.activate(request());
    leaseAt(leases).observer.onChange();
    gate.resolve({ items: [{ id: "1", label: "Stale" }], total: 1 });
    await loading;
    await flush();
    unsubscribe();
    expect(published).not.toContain("Stale");
    expect(store.get(session.snapshotAtom).items[0]?.label).toBe("Fresh");
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("queues one follow-up for events during refetch without repeatedly aborting the read", async () => {
    const gate = Promise.withResolvers<AdminListResult<RecordData>>();
    let reads = 0;
    let signal: AbortSignal | undefined;
    const { session, store, leases, list } = fixture({
      list: async (_, incoming) => {
        reads += 1;
        if (reads === 2) {
          ({ signal } = incoming);
          return await gate.promise;
        }
        return {
          items: [{ id: "1", label: reads === 1 ? "Initial" : "Latest" }],
          total: 1,
        };
      },
    });
    await session.activate(request());
    leaseAt(leases).observer.onChange();
    await flush();
    for (let event = 0; event < 20; event += 1) {
      leaseAt(leases).observer.onChange();
    }
    expect(store.get(session.snapshotAtom)).toMatchObject({
      items: [{ label: "Initial" }],
      status: "ready",
    });
    expect(signal?.aborted).toBeFalsy();
    gate.resolve({ items: [{ id: "1", label: "Intermediate" }], total: 1 });
    await flush();
    expect(list).toHaveBeenCalledTimes(3);
    expect(store.get(session.snapshotAtom).items[0]?.label).toBe("Latest");
    expect(session.diagnostics().realtimeRefreshScheduled).toBeFalsy();
  });

  it("reuses leases across queries, but releases them on entity/locale changes and ignores late callbacks", async () => {
    const { session, store, leases, subscribe, list } = fixture();
    await session.activate(request());
    await session.activate(request("examples", 2));
    expect(subscribe).toHaveBeenCalledOnce();
    const first = leaseAt(leases);
    await session.activate(request("others"));
    expect({
      aborted: first.request.signal.aborted,
      cleanups: first.cleanup.mock.calls.length,
    }).toStrictEqual({ aborted: true, cleanups: 1 });
    first.observer.onChange();
    first.observer.onError(new Error("Late"));
    await flush();
    expect(list).toHaveBeenCalledTimes(3);
    expect(store.get(session.realtimeAtom)).toMatchObject({
      entity: "others",
      status: "active",
    });
    await session.activate(request("others", 1, "cs"));
    expect({
      aborted: leaseAt(leases, 1).request.signal.aborted,
      locale: leaseAt(leases, 2).request.locale,
    }).toStrictEqual({ aborted: true, locale: "cs" });
  });

  it("clears queued events on pause, unmount-style deactivation and disposal; remount starts a fresh lease", async () => {
    const { session, leases, list } = fixture();
    await session.activate(request());
    leaseAt(leases).observer.onChange();
    session.pause();
    await flush();
    expect(list).toHaveBeenCalledOnce();
    expect(session.diagnostics()).toMatchObject({
      realtimeRefreshScheduled: false,
      realtimeSubscriptions: 0,
    });
    await session.activate(request());
    await session.activate(null);
    expect(leaseAt(leases, 1).cleanup).toHaveBeenCalledOnce();
    await session.activate(request());
    session.dispose();
    session.dispose();
    leaseAt(leases, 2).observer.onChange();
    await flush();
    expect(leaseAt(leases, 2).cleanup).toHaveBeenCalledOnce();
    expect(session.diagnostics().realtimeSubscriptions).toBe(0);
  });

  it("preserves ready data on stream failure, exposes the error and retries on explicit refresh", async () => {
    const { session, store, leases, subscribe } = fixture();
    await session.activate(request());
    leaseAt(leases).observer.onError(new Error("Disconnected"));
    expect(store.get(session.snapshotAtom).status).toBe("ready");
    expect(store.get(session.realtimeAtom)).toMatchObject({
      error: "Disconnected",
      status: "error",
    });
    expect(leaseAt(leases).cleanup).toHaveBeenCalledOnce();
    await session.refresh();
    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(store.get(session.realtimeAtom).status).toBe("active");
  });

  it("still completes an invalidated initial read if the stream subsequently fails", async () => {
    const gate = Promise.withResolvers<AdminListResult<RecordData>>();
    let reads = 0;
    const { session, store, leases, subscribe } = fixture({
      list: async () => {
        reads += 1;
        if (reads === 1) {
          return await gate.promise;
        }
        return { items: [{ id: "1", label: "Recovered" }], total: 1 };
      },
    });
    const loading = session.activate(request());
    leaseAt(leases).observer.onChange();
    leaseAt(leases).observer.onError(new Error("Offline"));
    gate.resolve({ items: [{ id: "1", label: "Stale" }], total: 1 });
    await loading;
    await flush();
    expect(store.get(session.snapshotAtom).items[0]?.label).toBe("Recovered");
    expect(store.get(session.realtimeAtom).status).toBe("error");
    expect(subscribe).toHaveBeenCalledOnce();
  });

  it("handles thrown and synchronous reported setup failures without breaking ordinary loading", async () => {
    const thrown = fixture({
      subscribe: () => {
        throw new Error("Setup failed");
      },
    });
    const cleanup = vi.fn<() => void>();
    const reported = fixture({
      subscribe: (observer) => {
        observer.onError(new Error("Rejected"));
        return cleanup;
      },
    });
    await thrown.session.activate(request());
    await reported.session.activate(request());
    expect(thrown.store.get(thrown.session.snapshotAtom).status).toBe("ready");
    expect(thrown.store.get(thrown.session.realtimeAtom).error).toBe(
      "Setup failed"
    );
    expect(cleanup).toHaveBeenCalledOnce();
    expect(reported.session.diagnostics().realtimeSubscriptions).toBe(0);
  });

  it("processes synchronous setup notifications and keeps the subscription bound to its adapter", async () => {
    const adapter: AdminDataAdapter<RecordData, string> = {
      get: () => Promise.resolve(null),
      list: () => Promise.resolve({ items: [], total: 0 }),
      subscribe(observer) {
        expect(this).toBe(adapter);
        observer.onChange();
        return () => {};
      },
    };
    const entity = defineAdminEntity({
      adapter,
      key: "examples",
      label: "Examples",
      parseValues: String,
      reference: (record) => record,
      singularLabel: "Example",
    });
    const store = createStore();
    const session = createAdminDataSession(
      createAdminEntityRegistry([entity]),
      store
    );
    sessions.push(session);
    await session.activate(request());
    await flush();
    expect(store.get(session.snapshotAtom).status).toBe("ready");
    expect(session.diagnostics().realtimeSubscriptions).toBe(1);
  });

  it("invalidates without refetching displayed edit/create forms so drafts are not replaced", async () => {
    const { session, leases, get, list } = fixture();
    await session.activate({ ...request(), recordId: "1", view: "update" });
    leaseAt(leases).observer.onChange();
    await flush();
    expect(get).toHaveBeenCalledOnce();
    await session.activate({ ...request(), view: "create" });
    leaseAt(leases).observer.onChange();
    await flush();
    expect(list).not.toHaveBeenCalled();
    await session.activate(request());
    await flush();
    expect(list).toHaveBeenCalledOnce();
  });

  it("refreshes active details and handles remote deletion through normal missing-record state", async () => {
    const { session, store, leases, get, record } = fixture();
    await session.activate({ ...request(), recordId: "1", view: "detail" });
    record.label = "Remote edit";
    leaseAt(leases).observer.onChange();
    await flush();
    expect(store.get(session.snapshotAtom).items[0]?.label).toBe("Remote edit");
    get.mockResolvedValueOnce(null);
    leaseAt(leases).observer.onChange();
    await flush();
    expect(store.get(session.snapshotAtom)).toMatchObject({
      items: [],
      status: "ready",
      total: 0,
    });
  });

  it("finishes the latest initial edit read before displaying a draft", async () => {
    const gate = Promise.withResolvers<RecordData | null>();
    const { session, store, leases, get, record } = fixture();
    get.mockReturnValueOnce(gate.promise);
    const loading = session.activate({
      ...request(),
      recordId: "1",
      view: "update",
    });
    record.label = "Latest before editing";
    leaseAt(leases).observer.onChange();
    gate.resolve({ id: "1", label: "Stale" });
    await loading;
    await flush();
    expect(store.get(session.snapshotAtom).items[0]?.label).toBe(
      "Latest before editing"
    );
    expect(get).toHaveBeenCalledTimes(2);
    leaseAt(leases).observer.onChange();
    await flush();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("contains teardown failures without preventing adapter disposal or subsequent loading", async () => {
    const cleanup = vi.fn<() => void>(() => {
      throw new Error("Unsubscribe failed");
    });
    const { session, store } = fixture({ subscribe: () => cleanup });
    await session.activate(request());
    session.pause();
    expect(store.get(session.realtimeAtom)).toMatchObject({
      error: "Unsubscribe failed",
      status: "error",
    });
    expect(session.diagnostics().realtimeSubscriptions).toBe(0);
    await session.activate(request());
    expect(store.get(session.snapshotAtom).status).toBe("ready");
    session.dispose();
    expect(cleanup).toHaveBeenCalledTimes(2);
    expect(session.diagnostics().disposed).toBeTruthy();
  });

  it("uses the normal validated and bounded loading path for realtime refreshes", async () => {
    let poisoned = false;
    const { session, store, leases } = fixture({
      list: () =>
        Promise.resolve({
          items: poisoned
            ? [
                { id: "1", label: "First" },
                { id: "1", label: "Duplicate" },
              ]
            : [{ id: "1", label: "Valid" }],
          total: 2,
        }),
    });
    await session.activate(request());
    poisoned = true;
    leaseAt(leases).observer.onChange();
    await flush();
    expect(store.get(session.snapshotAtom)).toMatchObject({
      items: [],
      status: "error",
    });
    expect(session.diagnostics().cacheEntries).toBe(0);
  });
});
