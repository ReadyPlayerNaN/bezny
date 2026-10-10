import { createStore } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type {
  AdminAdapterRequest,
  AdminListQuery,
  AdminListResult,
} from "../src/admin-data-adapter.js";
import { createAdminDataSession } from "../src/admin-data-session.js";
import type {
  AdminCachePolicy,
  AdminDataRequest,
  AdminDataSession,
} from "../src/admin-data-session.js";
import { createAdminEntityRegistry } from "../src/admin-entity-model.js";

interface ExampleRecord {
  id: string;
  label: string;
  payload: string;
}
const Screen = () => null;
const sessions: AdminDataSession[] = [];
const query = (page = 1): AdminListQuery => ({
  filters: {},
  locale: "en",
  page,
  pageSize: 2,
});
const request = (page = 1): AdminDataRequest => ({
  entity: "examples",
  query: query(page),
  view: "list",
});
const fixture = (
  policy: Partial<AdminCachePolicy> = {},
  overrideList?: (
    query: AdminListQuery,
    request: AdminAdapterRequest
  ) => Promise<AdminListResult<ExampleRecord>>
) => {
  const records = new Map(
    Array.from({ length: 20 }, (_, index) => [
      String(index + 1),
      {
        id: String(index + 1),
        label: `Record ${index + 1}`,
        payload: "Example content",
      },
    ])
  );
  const list = vi.fn<
    (
      query: AdminListQuery,
      request: AdminAdapterRequest
    ) => Promise<AdminListResult<ExampleRecord>>
  >(
    overrideList ??
      (async (parameters, { signal }) => {
        await Promise.resolve();
        signal.throwIfAborted();
        return {
          items: [...records.values()].slice(
            (parameters.page - 1) * parameters.pageSize,
            parameters.page * parameters.pageSize
          ),
          total: records.size,
        };
      })
  );
  const dispose = vi.fn<() => void>(() => {
    records.clear();
  });
  const entity = defineAdminEntity({
    adapter: {
      create: async (label) => {
        await Promise.resolve();
        const record = { id: "new", label, payload: "Created" };
        records.set(record.id, record);
        return record;
      },
      dispose,
      get: async (id) => {
        await Promise.resolve();
        return records.get(id) ?? null;
      },
      list,
      remove: async (ids) => {
        await Promise.resolve();
        for (const id of ids) {
          records.delete(id);
        }
      },
      update: async (id, label) => {
        await Promise.resolve();
        const record = { id, label, payload: "Updated" };
        records.set(id, record);
        return record;
      },
    },
    key: "examples",
    label: "Examples",
    parseValues: (value: unknown) => {
      if (typeof value !== "string") {
        throw new TypeError("Expected text.");
      }
      return value;
    },
    reference: (record: ExampleRecord) => ({
      id: record.id,
      label: record.label,
    }),
    screens: { create: Screen, detail: Screen, list: Screen, update: Screen },
    singularLabel: "Example",
  });
  const registry = createAdminEntityRegistry([entity]);
  const store = createStore();
  const session = createAdminDataSession(registry, store, policy);
  sessions.push(session);
  return { dispose, list, records, registry, session, store };
};

describe("bounded adapter data sessions", () => {
  afterEach(() => {
    for (const session of sessions.splice(0)) {
      session.dispose();
    }
    vi.useRealTimers();
  });

  it("bounds cached pages and active Jotai payloads across repeated navigation", async () => {
    const { session, store, registry } = fixture({ maxEntries: 2 });
    for (let cycle = 0; cycle < 50; cycle += 1) {
      // oxlint-disable-next-line no-await-in-loop -- Exercise sequential navigation and eviction, not parallel request cancellation.
      await session.activate(request((cycle % 10) + 1));
    }
    expect(session.diagnostics()).toMatchObject({
      activeRecords: 2,
      cacheEntries: 2,
      cachedRecords: 4,
      pendingRequests: 0,
    });
    expect(session.diagnostics().cacheBytes).toBeLessThanOrEqual(
      session.policy.maxBytes
    );
    session.pause();
    expect(store.get(session.snapshotAtom).items).toStrictEqual([]);
    expect(
      registry.entities.every(
        (entity) => store.get(entity.records).length === 0
      )
    ).toBeTruthy();
    expect(session.diagnostics()).toMatchObject({
      activeRecords: 0,
      cacheEntries: 0,
      expiryScheduled: false,
    });
  });

  it("reuses cached pages and evicts least recently used pages", async () => {
    const { session, list } = fixture({ maxEntries: 2 });
    await session.activate(request(1));
    await session.activate(request(2));
    await session.activate(request(1));
    expect(list).toHaveBeenCalledTimes(2);
    await session.activate(request(3));
    await session.activate(request(2));
    expect(list).toHaveBeenCalledTimes(4);
    expect(session.diagnostics().cacheEntries).toBe(2);
  });

  it("automatically expires inactive cached data and releases timers", async () => {
    vi.useFakeTimers();
    const { session, list } = fixture({ ttlMs: 20 });
    await session.activate(request(1));
    await session.activate(request(2));
    await vi.advanceTimersByTimeAsync(21);
    expect(session.diagnostics()).toMatchObject({
      activeRecords: 2,
      cacheEntries: 0,
      expiryScheduled: false,
    });
    await session.activate(request(1));
    expect(list).toHaveBeenCalledTimes(3);
    session.pause();
    expect(session.diagnostics().activeRecords).toBe(0);
  });

  it("cancels stale requests even when the adapter ignores its signal", async () => {
    const gate = Promise.withResolvers<AdminListResult<ExampleRecord>>();
    let firstSignal: AbortSignal | undefined;
    const { session, store } = fixture({}, async (parameters, { signal }) => {
      if (parameters.page === 1) {
        firstSignal = signal;
        return await gate.promise;
      }
      await Promise.resolve();
      return {
        items: [{ id: "2", label: "Latest", payload: "Latest" }],
        total: 2,
      };
    });
    const pending = session.activate(request(1));
    await session.activate(request(2));
    expect(firstSignal?.aborted).toBeTruthy();
    gate.resolve({
      items: [{ id: "1", label: "Stale", payload: "Stale" }],
      total: 2,
    });
    await pending;
    expect(
      store.get(session.snapshotAtom).items.map((record) => record.label)
    ).toStrictEqual(["Latest"]);
    expect(session.diagnostics().pendingRequests).toBe(0);
  });

  it("does not repopulate disposed stores from late responses and disposes adapters once", async () => {
    const gate = Promise.withResolvers<AdminListResult<ExampleRecord>>();
    const { session, store, dispose, records } = fixture(
      {},
      () => gate.promise
    );
    const pending = session.activate(request());
    session.dispose();
    session.dispose();
    gate.resolve({
      items: [{ id: "1", label: "Late", payload: "Late" }],
      total: 1,
    });
    await pending;
    expect(store.get(session.snapshotAtom)).toMatchObject({
      items: [],
      references: [],
      status: "disposed",
    });
    expect(session.diagnostics()).toMatchObject({
      activeRecords: 0,
      cacheEntries: 0,
      expiryScheduled: false,
      pendingRequests: 0,
      subscriptions: 0,
    });
    expect(dispose).toHaveBeenCalledOnce();
    expect(records.size).toBe(0);
  });

  it("still disposes adapters and clears resources if a disposal listener fails", async () => {
    const { session, store, dispose } = fixture();
    await session.activate(request());
    session.onDispose(() => {
      throw new Error("Broken listener");
    });
    expect(() => session.dispose()).toThrow(
      "Failed to dispose some admin resources"
    );
    expect(dispose).toHaveBeenCalledOnce();
    expect(store.get(session.snapshotAtom)).toMatchObject({
      items: [],
      status: "disposed",
    });
    expect(session.diagnostics()).toMatchObject({
      cacheEntries: 0,
      expiryScheduled: false,
      pendingRequests: 0,
      subscriptions: 0,
    });
  });

  it("rejects oversized payloads rather than retaining them in the store or cache", async () => {
    const { session, store } = fixture({ maxBytes: 100 });
    await session.activate(request());
    expect(store.get(session.snapshotAtom)).toMatchObject({
      error: "Adapter payload exceeds the configured data budget.",
      items: [],
      status: "error",
    });
    expect(session.diagnostics()).toMatchObject({
      activeRecords: 0,
      cacheBytes: 0,
      cacheEntries: 0,
    });
  });

  it("invalidates cached list/detail results after create, update, and delete", async () => {
    const { session, store } = fixture();
    await session.activate(request());
    await session.create("examples", "New record");
    expect(store.get(session.snapshotAtom).total).toBe(21);
    await session.update("examples", "1", "Changed");
    expect(store.get(session.snapshotAtom).items[0]?.label).toBe("Changed");
    await session.remove("examples", ["1"]);
    expect(
      store.get(session.snapshotAtom).items.some((record) => record.id === "1")
    ).toBeFalsy();
    await session.activate({
      entity: "examples",
      query: query(),
      recordId: "new",
      view: "detail",
    });
    expect(store.get(session.snapshotAtom).items[0]?.label).toBe("New record");
  });

  it("detaches and freezes cached data rather than retaining mutable backend objects", async () => {
    const { session, store, records } = fixture();
    await session.activate(request());
    const cached = store.get(session.snapshotAtom).items[0]?.data;
    const backend = records.get("1");
    if (!backend) {
      throw new Error("Expected backend fixture record.");
    }
    backend.payload = "Changed outside the cache";
    expect(cached).toMatchObject({ payload: "Example content" });
    expect(Object.isFrozen(cached)).toBeTruthy();
    await session.refresh();
    expect(store.get(session.snapshotAtom).items[0]?.data).toMatchObject({
      payload: "Changed outside the cache",
    });
  });

  it("rejects non-JSON payloads that could retain hidden backend collections", async () => {
    const poisoned = {
      hidden: new Map([["retained", "dataset"]]),
      id: "1",
      label: "Poisoned",
      payload: "Plain text",
    };
    const { session, store } = fixture({}, async () => {
      await Promise.resolve();
      return { items: [poisoned], total: 1 };
    });
    await session.activate(request());
    expect(store.get(session.snapshotAtom)).toMatchObject({
      error: "Record data must be plain JSON data.",
      items: [],
      status: "error",
    });
    expect(session.diagnostics()).toMatchObject({
      activeRecords: 0,
      cacheEntries: 0,
    });
  });

  it("rejects duplicate record IDs from adapters", async () => {
    const record = { id: "1", label: "Duplicate", payload: "Example" };
    const { session, store } = fixture({}, async () => {
      await Promise.resolve();
      return { items: [record, record], total: 2 };
    });
    await session.activate(request());
    expect(store.get(session.snapshotAtom)).toMatchObject({
      error: "Duplicate record ID for examples",
      items: [],
      status: "error",
    });
  });

  it("rejects invalid queries before calling the adapter", async () => {
    const { session, store, list } = fixture();
    await session.activate({
      ...request(),
      query: { ...query(), pageSize: 101 },
    });
    expect(list).not.toHaveBeenCalled();
    expect(store.get(session.snapshotAtom).status).toBe("error");
    expect(() => fixture({ maxEntries: 0 })).toThrow("Invalid cache policy");
  });

  it.each(["create", "CREATE", ""])(
    "rejects reserved or empty adapter record ID %s",
    async (id) => {
      const { session, store } = fixture({}, async () => {
        await Promise.resolve();
        return {
          items: [{ id, label: "Invalid", payload: "Invalid" }],
          total: 1,
        };
      });
      await session.activate(request());
      expect(store.get(session.snapshotAtom).status).toBe("error");
      expect(store.get(session.snapshotAtom).items).toStrictEqual([]);
    }
  );
});
