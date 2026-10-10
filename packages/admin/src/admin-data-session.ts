import { atom } from "jotai";
import type { Atom } from "jotai";

import type {
  AdminListQuery,
  AdminRecordEnvelope,
} from "./admin-data-adapter.js";
import type {
  AdminEntity,
  AdminEntityRegistry,
  AdminEntityView,
  AdminRecordReference,
  AdminStore,
} from "./admin-entity-model.js";
import {
  adminPageCommandsAtom,
  adminSelectionAtom,
} from "./admin-entity-model.js";
import { adminListQueriesAtom } from "./admin-list-state.js";
import { serializeAdminRecords } from "./admin-record-serialization.js";

export interface AdminCachePolicy {
  maxEntries: number;
  maxBytes: number;
  ttlMs: number;
  maxPageSize: number;
}
export const defaultAdminCachePolicy: AdminCachePolicy = {
  maxBytes: 2_000_000,
  maxEntries: 8,
  maxPageSize: 100,
  ttlMs: 30_000,
};
export interface AdminDataRequest {
  entity: string;
  view: AdminEntityView;
  recordId?: string;
  query: AdminListQuery;
}
export interface AdminDataSnapshot {
  key: string;
  entity: string | null;
  status: "idle" | "loading" | "ready" | "error" | "disposed";
  items: readonly AdminRecordEnvelope[];
  references: readonly AdminRecordReference[];
  total: number;
  error: string | null;
  query: AdminListQuery;
}
export const defaultAdminListQuery: AdminListQuery = {
  filters: {},
  locale: "en",
  page: 1,
  pageSize: 25,
};
const maxTimerDelayMs = 2_147_483_647;
const disposeResources = (listeners: readonly (() => void)[]) => {
  const errors: unknown[] = [];
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) {
    throw new AggregateError(errors, "Failed to dispose some admin resources.");
  }
};
const emptySnapshot = (): AdminDataSnapshot => ({
  entity: null,
  error: null,
  items: [],
  key: "",
  query: defaultAdminListQuery,
  references: [],
  status: "idle",
  total: 0,
});
export const adminDataRequestKey = (request: AdminDataRequest) =>
  JSON.stringify([
    request.entity,
    request.view,
    request.recordId,
    request.query.page,
    request.query.pageSize,
    request.query.locale,
    Object.entries(request.query.filters).toSorted(([first], [second]) =>
      first.localeCompare(second)
    ),
  ]);

/** Race cancellation even for an adapter that forgets to honor its signal. */
const abortable = async <T>(
  operation: Promise<T>,
  signal: AbortSignal
): Promise<T> => {
  const { promise, reject } = Promise.withResolvers<never>();
  const abort = () =>
    reject(new DOMException("Request cancelled", "AbortError"));
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) {
    abort();
  }
  try {
    return await Promise.race([operation, promise]);
  } finally {
    signal.removeEventListener("abort", abort);
  }
};

const validListQuery = (query: AdminListQuery, policy: AdminCachePolicy) =>
  Number.isSafeInteger(query.page) &&
  query.page >= 1 &&
  Number.isSafeInteger(query.pageSize) &&
  query.pageSize >= 1 &&
  query.pageSize <= policy.maxPageSize;
const loadAdapterData = async (
  entity: AdminEntity,
  request: AdminDataRequest,
  signal: AbortSignal
) => {
  if (request.view === "list") {
    return await abortable(
      entity.adapter.list(request.query, {
        locale: request.query.locale,
        signal,
      }),
      signal
    );
  }
  const record = await abortable(
    entity.adapter.get(request.recordId ?? "", {
      locale: request.query.locale,
      signal,
    }),
    signal
  );
  return { items: record ? [record] : [], total: record ? 1 : 0 };
};

/** One application-owned Jotai snapshot and a size/TTL-bounded server-data cache. */
export const createAdminDataSession = (
  registry: AdminEntityRegistry,
  store: AdminStore,
  configuration: Partial<AdminCachePolicy> = {}
) => {
  const policy = { ...defaultAdminCachePolicy, ...configuration };
  for (const [name, value] of Object.entries(policy)) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error(`Invalid cache policy ${name}`);
    }
  }
  if (policy.ttlMs > maxTimerDelayMs) {
    throw new Error("Invalid cache policy ttlMs");
  }
  const snapshotAtom = atom<AdminDataSnapshot>(emptySnapshot());
  const cache = new Map<
    string,
    { snapshot: AdminDataSnapshot; expires: number; bytes: number }
  >();
  const mutationControllers = new Set<AbortController>();
  const disposalCallbacks = new Set<() => void>();
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | null = null;
  let active: AdminDataRequest | null = null;
  let generation = 0;
  let disposed = false;
  const publish = (snapshot: AdminDataSnapshot) => {
    const previous = store.get(snapshotAtom);
    if (previous.entity && previous.entity !== snapshot.entity) {
      const entity = registry.get(previous.entity);
      if (entity) {
        store.set(entity.records, []);
      }
    }
    const entity = snapshot.entity ? registry.get(snapshot.entity) : undefined;
    if (entity) {
      store.set(entity.records, snapshot.references);
    }
    store.set(snapshotAtom, snapshot);
  };
  const scheduleExpiry = () => {
    clearTimeout(expiryTimer);
    expiryTimer = undefined;
    if (cache.size === 0) {
      return;
    }
    let nextExpiry = Number.POSITIVE_INFINITY;
    for (const entry of cache.values()) {
      nextExpiry = Math.min(nextExpiry, entry.expires);
    }
    expiryTimer = setTimeout(
      () => {
        for (const [key, entry] of cache) {
          if (entry.expires <= Date.now()) {
            cache.delete(key);
          }
        }
        scheduleExpiry();
      },
      Math.min(maxTimerDelayMs, Math.max(1, nextExpiry - Date.now()))
    );
  };
  const cacheBytes = () =>
    [...cache.values()].reduce((total, entry) => total + entry.bytes, 0);
  const putCache = (snapshot: AdminDataSnapshot) => {
    const keyBytes = snapshot.key.length * 2;
    const serialized = serializeAdminRecords(
      snapshot.items,
      policy.maxBytes - keyBytes
    );
    const bytes = serialized.bytes + keyBytes;
    const canonical = Object.freeze({
      ...snapshot,
      items: serialized.items,
      references: Object.freeze(
        serialized.items.map(({ id, label }) => Object.freeze({ id, label }))
      ),
    });
    cache.delete(snapshot.key);
    cache.set(snapshot.key, {
      bytes,
      expires: Date.now() + policy.ttlMs,
      snapshot: canonical,
    });
    while (cache.size > policy.maxEntries || cacheBytes() > policy.maxBytes) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      cache.delete(oldest);
    }
    scheduleExpiry();
    return canonical;
  };
  const cancelRead = () => {
    generation += 1;
    controller?.abort();
    controller = null;
  };
  const invalidate = (entity: string) => {
    for (const [key, entry] of cache) {
      if (entry.snapshot.entity === entity) {
        cache.delete(key);
      }
    }
    scheduleExpiry();
  };
  const isCurrent = (pending: AbortController, requestGeneration: number) =>
    !disposed && !pending.signal.aborted && generation === requestGeneration;
  const fetchSnapshot = async (
    entity: AdminEntity,
    request: AdminDataRequest,
    key: string
  ) => {
    const { query } = request;
    publish({
      ...emptySnapshot(),
      entity: entity.key,
      key,
      query,
      status: "loading",
    });
    const requestGeneration = generation;
    const pending = new AbortController();
    controller = pending;
    try {
      const { items, total } = await loadAdapterData(
        entity,
        request,
        pending.signal
      );
      if (!isCurrent(pending, requestGeneration)) {
        return;
      }
      const snapshot: AdminDataSnapshot = {
        entity: entity.key,
        error: null,
        items,
        key,
        query,
        references: items.map(({ id, label }) => ({ id, label })),
        status: "ready",
        total,
      };
      publish(putCache(snapshot));
    } catch (error) {
      if (!isCurrent(pending, requestGeneration)) {
        return;
      }
      publish({
        ...emptySnapshot(),
        entity: entity.key,
        error:
          error instanceof Error ? error.message : "Unable to load records.",
        key,
        query,
        status: "error",
      });
    } finally {
      if (controller === pending) {
        controller = null;
      }
    }
  };
  const cachedSnapshot = (key: string, force: boolean) => {
    const cached = cache.get(key);
    if (force || !cached || cached.expires <= Date.now()) {
      return null;
    }
    cache.delete(key);
    cache.set(key, cached);
    return cached.snapshot;
  };
  const activate = async (
    request: AdminDataRequest | null,
    force = false
  ): Promise<void> => {
    if (disposed) {
      return;
    }
    const key = request ? adminDataRequestKey(request) : "";
    if (!force && active && key === adminDataRequestKey(active)) {
      return;
    }
    cancelRead();
    if (active && adminDataRequestKey(active) !== key) {
      store.set(adminSelectionAtom, null);
    }
    active = request;
    const entity = request ? registry.get(request.entity) : undefined;
    if (
      !request ||
      !entity ||
      !entity.screens[request.view] ||
      request.view === "create"
    ) {
      publish({
        ...emptySnapshot(),
        entity: entity?.key ?? null,
        key,
        ...(request ? { query: request.query } : {}),
      });
      return;
    }
    const { query } = request;
    if (!validListQuery(query, policy)) {
      publish({
        ...emptySnapshot(),
        entity: entity.key,
        error: "Invalid pagination query.",
        key,
        query,
        status: "error",
      });
      return;
    }
    const cached = cachedSnapshot(key, force);
    if (cached) {
      publish(cached);
      return;
    }
    cache.delete(key);
    await fetchSnapshot(entity, request, key);
  };
  const mutate = async <T>(
    entity: AdminEntity,
    operation: (signal: AbortSignal) => Promise<T>
  ): Promise<T> => {
    if (disposed) {
      throw new Error("The admin application has been disposed.");
    }
    if (mutationControllers.size >= policy.maxEntries) {
      throw new Error("Too many concurrent mutations.");
    }
    const pending = new AbortController();
    mutationControllers.add(pending);
    try {
      const result = await abortable(operation(pending.signal), pending.signal);
      if (disposed || pending.signal.aborted) {
        throw new DOMException("Request cancelled", "AbortError");
      }
      invalidate(entity.key);
      if (active?.entity === entity.key) {
        await activate(active, true);
      }
      if (disposed || pending.signal.aborted) {
        throw new DOMException("Request cancelled", "AbortError");
      }
      return result;
    } finally {
      mutationControllers.delete(pending);
    }
  };
  const findEntity = (key: string) => {
    const entity = registry.get(key);
    if (!entity) {
      throw new Error(`Unknown entity: ${key}`);
    }
    return entity;
  };
  const pause = () => {
    cancelRead();
    for (const pending of mutationControllers) {
      pending.abort();
    }
    mutationControllers.clear();
    clearTimeout(expiryTimer);
    expiryTimer = undefined;
    cache.clear();
    active = null;
    publish({ ...emptySnapshot(), status: disposed ? "disposed" : "idle" });
    store.set(adminSelectionAtom, null);
    store.set(adminPageCommandsAtom, null);
    store.set(adminListQueriesAtom, {});
  };
  const boundedMutationRecord = (record: AdminRecordEnvelope) => {
    const [canonical] = serializeAdminRecords([record], policy.maxBytes).items;
    if (!canonical) {
      throw new Error("Adapter did not return a mutation record.");
    }
    return canonical;
  };
  const snapshotReader: Atom<AdminDataSnapshot> = snapshotAtom;
  return {
    activate,
    create: async (key: string, values: unknown) => {
      const entity = findEntity(key);
      const { create } = entity.adapter;
      if (!create) {
        throw new Error(`Creation unavailable: ${key}`);
      }
      return boundedMutationRecord(
        await mutate(entity, (signal) => create(values, { signal }))
      );
    },
    diagnostics: () => ({
      activeRecords: store.get(snapshotAtom).items.length,
      cacheBytes: cacheBytes(),
      cacheEntries: cache.size,
      cachedRecords: [...cache.values()].reduce(
        (total, entry) => total + entry.snapshot.items.length,
        0
      ),
      disposed,
      expiryScheduled: expiryTimer !== undefined,
      pendingRequests: Number(controller !== null) + mutationControllers.size,
      subscriptions: disposalCallbacks.size,
    }),
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      pause();
      const listeners = [
        ...disposalCallbacks,
        ...registry.entities.map((entity) => () => {
          entity.adapter.dispose?.();
        }),
      ];
      disposalCallbacks.clear();
      disposeResources(listeners);
    },
    invalidate,
    onDispose: (listener: () => void) => {
      disposalCallbacks.add(listener);
      return () => {
        disposalCallbacks.delete(listener);
      };
    },
    pause,
    policy,
    refresh: async () => {
      if (active) {
        await activate(active, true);
      }
    },
    remove: async (key: string, ids: readonly string[]) => {
      const entity = findEntity(key);
      const { remove } = entity.adapter;
      if (!remove) {
        throw new Error(`Deletion unavailable: ${key}`);
      }
      await mutate(entity, (signal) => remove(ids, { signal }));
    },
    snapshotAtom: snapshotReader,
    update: async (key: string, id: string, values: unknown) => {
      const entity = findEntity(key);
      const { update } = entity.adapter;
      if (!update) {
        throw new Error(`Updates unavailable: ${key}`);
      }
      return boundedMutationRecord(
        await mutate(entity, (signal) => update(id, values, { signal }))
      );
    },
  };
};
export type AdminDataSession = ReturnType<typeof createAdminDataSession>;
