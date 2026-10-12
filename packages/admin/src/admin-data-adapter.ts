import type { ComponentType } from "react";

import type {
  AdminEntityForm,
  AdminEntityColumn,
} from "./admin-entity-fields.js";
import type {
  AdminEntityAction,
  AdminRecordReference,
} from "./admin-entity-model.js";

export type {
  AdminEntityField,
  AdminEntityForm,
  AdminEntityColumn,
  AdminFormValues,
} from "./admin-entity-fields.js";

export type AdminFilterValues = Readonly<Record<string, string>>;
export interface AdminListQuery {
  page: number;
  pageSize: number;
  filters: AdminFilterValues;
  locale: string;
}
export interface AdminAdapterRequest {
  signal: AbortSignal;
  locale?: string;
}
export interface AdminListResult<TRecord> {
  items: readonly TRecord[];
  total: number;
}

/** Entity-wide invalidation notifications, not unvalidated record patches. */
export interface AdminSubscriptionObserver {
  onChange: () => void;
  /** Terminal stream/setup failure. Reconnect internally or report failure, not both. */
  onError: (error: unknown) => void;
}
export type AdminEntitySubscription = (
  observer: AdminSubscriptionObserver,
  request: AdminAdapterRequest
) => () => void;

/** Data belongs to an adapter/backend, not a permanently registered collection atom. */
export interface AdminDataAdapter<TRecord, TValues> {
  list: (
    query: AdminListQuery,
    request: AdminAdapterRequest
  ) => Promise<AdminListResult<TRecord>>;
  get: (id: string, request: AdminAdapterRequest) => Promise<TRecord | null>;
  create?: (values: TValues, request: AdminAdapterRequest) => Promise<TRecord>;
  update?: (
    id: string,
    values: TValues,
    request: AdminAdapterRequest
  ) => Promise<TRecord>;
  remove?: (
    ids: readonly string[],
    request: AdminAdapterRequest
  ) => Promise<void>;
  /** Optional entity-wide stream. Return an idempotent synchronous unsubscribe. */
  subscribe?: AdminEntitySubscription;
  dispose?: () => void;
}
export interface AdminRecordEnvelope extends AdminRecordReference {
  data: unknown;
}
export interface AdminEntityAdapter {
  list: (
    query: AdminListQuery,
    request: AdminAdapterRequest
  ) => Promise<AdminListResult<AdminRecordEnvelope>>;
  get: (
    id: string,
    request: AdminAdapterRequest
  ) => Promise<AdminRecordEnvelope | null>;
  create?: (
    values: unknown,
    request: AdminAdapterRequest
  ) => Promise<AdminRecordEnvelope>;
  update?: (
    id: string,
    values: unknown,
    request: AdminAdapterRequest
  ) => Promise<AdminRecordEnvelope>;
  remove?: AdminDataAdapter<unknown, unknown>["remove"];
  subscribe?: AdminEntitySubscription;
  dispose?: () => void;
}
export interface AdminFilterDefinition {
  key: string;
  label: string;
  labelKey?: string;
  options?: readonly { value: string; label: string; labelKey?: string }[];
}
export interface AdminEntityDefinition {
  key: string;
  label: string;
  singularLabel: string;
  labelKey?: string;
  singularLabelKey?: string;
  adapter: AdminEntityAdapter;
  form?: AdminEntityForm;
  columns?: readonly AdminEntityColumn[];
  screens?: {
    list?: ComponentType;
    create?: ComponentType;
    detail?: ComponentType;
    update?: ComponentType;
  };
  actions?: readonly AdminEntityAction[];
  filters?: readonly AdminFilterDefinition[];
  pageSize?: number;
}
export type AdminEntityConfiguration<TRecord, TValues> = Omit<
  AdminEntityDefinition,
  "adapter"
> & {
  adapter: AdminDataAdapter<TRecord, TValues>;
  reference: (record: TRecord) => AdminRecordReference;
  parseValues: (values: unknown) => TValues;
};

/** Preserve adapter type safety at registration; erase payloads only at the UI boundary. */
export const defineAdminEntity = <TRecord, TValues>(
  configuration: AdminEntityConfiguration<TRecord, TValues>
): AdminEntityDefinition => {
  const { adapter, reference, parseValues, ...definition } = configuration;
  const envelope = (data: TRecord): AdminRecordEnvelope => {
    const record = reference(data);
    if (
      typeof record.id !== "string" ||
      !record.id ||
      record.id.toLowerCase() === "create" ||
      typeof record.label !== "string"
    ) {
      throw new Error(
        `Invalid or reserved record ID for ${definition.key}: ${record.id}`
      );
    }
    return { ...record, data };
  };
  const create = adapter.create?.bind(adapter);
  const update = adapter.update?.bind(adapter);
  const remove = adapter.remove?.bind(adapter);
  const dispose = adapter.dispose?.bind(adapter);
  const subscribe = adapter.subscribe?.bind(adapter);
  const normalized: AdminEntityAdapter = {
    get: async (id, request) => {
      const record = await adapter.get(id, request);
      if (record === null) {
        return null;
      }
      const result = envelope(record);
      if (result.id !== id) {
        throw new Error(
          `Adapter returned the wrong record for ${definition.key}/${id}`
        );
      }
      return result;
    },
    list: async (query, request) => {
      const result = await adapter.list(query, request);
      if (
        !Number.isSafeInteger(result.total) ||
        result.total < 0 ||
        result.items.length > query.pageSize ||
        result.items.length > result.total
      ) {
        throw new Error(`Invalid list result from ${definition.key} adapter`);
      }
      const items = result.items.map(envelope);
      if (new Set(items.map((item) => item.id)).size !== items.length) {
        throw new Error(`Duplicate record ID for ${definition.key}`);
      }
      return { items, total: result.total };
    },
    ...(create
      ? {
          create: async (values: unknown, request: AdminAdapterRequest) =>
            envelope(await create(parseValues(values), request)),
        }
      : {}),
    ...(update
      ? {
          update: async (
            id: string,
            values: unknown,
            request: AdminAdapterRequest
          ) => {
            const result = envelope(
              await update(id, parseValues(values), request)
            );
            if (result.id !== id) {
              throw new Error(
                `Adapter updated the wrong record for ${definition.key}/${id}`
              );
            }
            return result;
          },
        }
      : {}),
    ...(remove ? { remove } : {}),
    ...(subscribe ? { subscribe } : {}),
    ...(dispose ? { dispose } : {}),
  };
  if (definition.screens?.create && !normalized.create) {
    throw new Error(
      `Create screen requires a create adapter: ${definition.key}`
    );
  }
  if (definition.screens?.update && !normalized.update) {
    throw new Error(
      `Update screen requires an update adapter: ${definition.key}`
    );
  }
  return { ...definition, adapter: normalized };
};
