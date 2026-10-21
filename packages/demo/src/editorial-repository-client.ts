import type { AdminDataAdapter } from "@bezny/admin/adapters";

import type { EditorialBackendClient } from "./editorial-backend-client.js";
import type {
  EditorialNotice,
  EditorialRecord,
  EditorialValues,
} from "./editorial-records.js";

/** RHF/admin-facing adapters hold no datasets; the worker owns all CRUD operations. */
export const createEditorialRepositoryClient = (
  backend: EditorialBackendClient,
  notify: (notice: EditorialNotice) => void
) => {
  const adapter = (
    entity: string
  ): AdminDataAdapter<EditorialRecord, EditorialValues> => ({
    create: async (values, { signal }) => {
      const record = await backend.request(
        "create",
        { entity, values },
        signal
      );
      notify({ count: 1, entity, key: "created" });
      return record;
    },
    get: (id, { signal, locale = "en" }) =>
      backend.request("get", { entity, id, locale }, signal),
    list: (query, { signal }) =>
      backend.request("list", { entity, query }, signal),
    remove: async (ids, { signal }) => {
      await backend.request("remove", { entity, ids }, signal);
      notify({ count: ids.length, entity, key: "deleted" });
    },
    subscribe: (observer, { signal }) => {
      if (signal.aborted) {
        return () => {
          /* Already aborted; no subscription was created. */
        };
      }
      const unsubscribe = backend.subscribe((event) => {
        if (event.type === "changed" && event.entity === entity) {
          observer.onChange();
        }
      });
      const unsubscribeError = backend.onError(observer.onError);
      const cleanup = () => {
        unsubscribe();
        unsubscribeError();
        signal.removeEventListener("abort", cleanup);
      };
      signal.addEventListener("abort", cleanup, { once: true });
      return cleanup;
    },
    update: async (id, values, { signal }) => {
      const record = await backend.request(
        "update",
        { entity, id, values },
        signal
      );
      notify({ count: 1, entity, key: "updated" });
      return record;
    },
  });
  return { adapter };
};
export type EditorialRepositoryClient = ReturnType<
  typeof createEditorialRepositoryClient
>;
