import type { AdminEntity } from "./admin-entity-model.js";

export interface AdminRealtimeSnapshot {
  entity: string | null;
  status: "inactive" | "active" | "error";
  error: string | null;
}
interface SubscriptionLease {
  entity: AdminEntity;
  locale: string;
  controller: AbortController;
  unsubscribe?: () => void;
  timer?: ReturnType<typeof setTimeout>;
  dirty: boolean;
  refreshing: boolean;
  failed: boolean;
}
interface RealtimeSessionCallbacks {
  invalidate: (entity: string) => void;
  refresh: () => Promise<void>;
  isReading: () => boolean;
  canRefresh: () => boolean;
  publish: (snapshot: AdminRealtimeSnapshot) => void;
}

/** One active entity/locale lease; notifications never retain backend payloads. */
export const createAdminRealtimeSubscription = (
  callbacks: RealtimeSessionCallbacks
) => {
  let current: SubscriptionLease | null = null;
  let revision = 0;
  const publishError = (entity: string, error: unknown) =>
    callbacks.publish({
      entity,
      error:
        error instanceof Error
          ? error.message
          : "Realtime subscription failed.",
      status: "error",
    });
  const detachTransport = (lease: SubscriptionLease) => {
    lease.failed = true;
    const errors: unknown[] = [];
    for (const cleanup of [() => lease.controller.abort(), lease.unsubscribe]) {
      try {
        cleanup?.();
      } catch (error) {
        errors.push(error);
      }
    }
    delete lease.unsubscribe;
    if (errors.length) {
      publishError(lease.entity.key, errors[0]);
    }
  };
  const release = (lease: SubscriptionLease) => {
    if (current === lease) {
      current = null;
    }
    clearTimeout(lease.timer);
    lease.dirty = false;
    detachTransport(lease);
  };
  const fail = (lease: SubscriptionLease, error: unknown) => {
    if (current !== lease || lease.failed) {
      return;
    }
    callbacks.invalidate(lease.entity.key);
    detachTransport(lease);
    publishError(lease.entity.key, error);
  };
  const schedule = (lease: SubscriptionLease) => {
    if (
      current !== lease ||
      !lease.dirty ||
      lease.timer !== undefined ||
      lease.refreshing ||
      callbacks.isReading() ||
      !callbacks.canRefresh()
    ) {
      return;
    }
    lease.timer = setTimeout(async () => {
      delete lease.timer;
      if (
        current !== lease ||
        callbacks.isReading() ||
        !callbacks.canRefresh()
      ) {
        return;
      }
      lease.dirty = false;
      lease.refreshing = true;
      try {
        await callbacks.refresh();
      } catch (error) {
        fail(lease, error);
      } finally {
        lease.refreshing = false;
        schedule(lease);
      }
    }, 0);
  };
  const stop = () => {
    const lease = current;
    current = null;
    callbacks.publish({ entity: null, error: null, status: "inactive" });
    if (lease) {
      release(lease);
    }
  };
  const activate = (entity: AdminEntity | undefined, locale: string) => {
    if (current?.entity === entity && current?.locale === locale) {
      return;
    }
    stop();
    if (!entity?.adapter.subscribe) {
      return;
    }
    const lease: SubscriptionLease = {
      controller: new AbortController(),
      dirty: false,
      entity,
      failed: false,
      locale,
      refreshing: false,
    };
    current = lease;
    callbacks.invalidate(entity.key);
    callbacks.publish({ entity: entity.key, error: null, status: "active" });
    if (current !== lease) {
      return;
    }
    try {
      const unsubscribe = entity.adapter.subscribe(
        {
          onChange: () => {
            if (current !== lease || lease.failed) {
              return;
            }
            revision += 1;
            lease.dirty = true;
            callbacks.invalidate(entity.key);
            schedule(lease);
          },
          onError: (error) => fail(lease, error),
        },
        { locale, signal: lease.controller.signal }
      );
      if (typeof unsubscribe !== "function") {
        throw new TypeError(
          "A realtime subscription must return an unsubscribe function."
        );
      }
      // onError may run synchronously during setup; still release the returned lease.
      if (current === lease && !lease.failed) {
        lease.unsubscribe = unsubscribe;
      } else {
        unsubscribe();
      }
    } catch (error) {
      fail(lease, error);
    }
  };
  return {
    activate,
    diagnostics: () => ({
      realtimeRefreshScheduled: current?.timer !== undefined,
      realtimeSubscriptions: Number(current !== null && !current.failed),
    }),
    reading: () => {
      if (current) {
        current.dirty = false;
        clearTimeout(current.timer);
        delete current.timer;
      }
    },
    retry: () => {
      if (current?.failed) {
        stop();
      }
    },
    revision: () => revision,
    settled: () => {
      if (current) {
        schedule(current);
      }
    },
    stop,
  };
};
