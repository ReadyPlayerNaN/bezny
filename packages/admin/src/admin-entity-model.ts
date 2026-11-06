import type { TFunction } from "i18next";
import { atom } from "jotai";
import type { Atom, PrimitiveAtom, createStore } from "jotai";

import type {
  AdminEntityDefinition,
  AdminAdapterRequest,
} from "./admin-data-adapter.js";
import type { AdminDataSession } from "./admin-data-session.js";
import { resolveAdminEntityDefinition } from "./admin-default-registration.js";
import type {
  AdminEntityForm,
  AdminEntityField,
  AdminFormValues,
} from "./admin-entity-fields.js";
import type { AdminReferenceFilterInput } from "./admin-reference-filter-model.js";
import { validateAdminReferenceRegistration } from "./admin-reference-filter-model.js";
import { validateAdminSorting } from "./admin-sort-model.js";
import type { AdminSortingDefinition } from "./admin-sort-model.js";
import { validateAdminTypedFilters } from "./admin-typed-filter.js";

export type AdminEntityView = "list" | "create" | "detail" | "update";
export interface AdminRecordReference {
  id: string;
  label: string;
}
export type AdminEntityLocation =
  | { entity: string; view: "list" | "create" }
  | { entity: string; view: "detail" | "update"; recordId: string };
export type AdminEntityNavigate = (
  location: AdminEntityLocation
) => Promise<void>;
export type AdminStore = ReturnType<typeof createStore>;

export interface AdminCommand {
  id: string;
  label: string;
  /** Concise contextual-menu label; the palette keeps the full label. */
  menuLabel?: string;
  execute: () => void | Promise<void>;
  destructive?: boolean;
  input?: {
    label: string;
    value: string;
    allowEmpty?: boolean;
    type?: "text" | "number" | "textarea" | "date";
    minDate?: string;
    maxDate?: string;
    validate?: (value: string) => boolean;
    min?: number;
    max?: number;
    step?: number | "any";
    maxLength?: number;
    options?: readonly { value: string; label: string }[];
    multiple?: boolean;
    reference?: AdminReferenceFilterInput;
    sorting?: AdminSortingDefinition;
    execute: (value: string) => void | Promise<void>;
  };
  location?: AdminEntityLocation;
}

export interface AdminActionScope {
  entity: AdminEntity;
  view: AdminEntityView;
  records: readonly AdminRecordReference[];
  ids: readonly string[];
  store: AdminStore;
  session: AdminDataSession;
  navigate: AdminEntityNavigate;
  translate?: TFunction;
}
export interface AdminActionResult {
  /** Host-localized operator feedback; never raw transport diagnostics. */
  message?: string;
  /** A subset of the captured targets; retry executes only these IDs. */
  failedIds?: readonly string[];
}
export interface AdminActionInput extends Pick<
  AdminEntityForm,
  "defaultValues" | "resolver" | "errors"
> {
  fields: readonly Omit<AdminEntityField, "deriveValues">[];
}
export interface AdminManagedAction {
  confirm?: (scope: AdminActionScope) => string;
  input?: AdminActionInput;
  affected?: readonly string[];
  execute: (
    scope: AdminActionScope,
    values: AdminFormValues,
    request: AdminAdapterRequest
  ) => Promise<AdminActionResult>;
}
export interface AdminEntityAction {
  id: string;
  target: "record" | "selection";
  label: (scope: AdminActionScope) => string;
  /** Optional contextual-menu label, falling back to label. */
  menuLabel?: (scope: AdminActionScope) => string;
  /** Legacy host-owned execution. Mutually exclusive with operation. */
  execute?: (scope: AdminActionScope) => void | Promise<void>;
  operation?: AdminManagedAction;
  destructive?: boolean;
  enabled?: Atom<boolean>;
  isAvailable?: (scope: AdminActionScope) => boolean;
}
/** Runtime metadata; references are only the active bounded page/detail, never an entire dataset. */
export interface AdminEntity extends Omit<AdminEntityDefinition, "screens"> {
  screens: ReturnType<typeof resolveAdminEntityDefinition>["screens"];
  records: PrimitiveAtom<readonly AdminRecordReference[]>;
}
export interface AdminEntityRegistry {
  entities: readonly AdminEntity[];
  get: (key: string) => AdminEntity | undefined;
}
const entityKeyPattern = /^[a-z][a-z0-9-]*$/u;
const validateListDefinition = (entity: AdminEntityDefinition) => {
  validateAdminSorting(entity.sorting);
  validateAdminTypedFilters(entity.filters ?? []);
  if (
    entity.pageSize !== undefined &&
    (!Number.isSafeInteger(entity.pageSize) || entity.pageSize < 1)
  ) {
    throw new Error(`Invalid page size for ${entity.key}`);
  }
  const filterKeys = new Set<string>();
  for (const filter of entity.filters ?? []) {
    if (!entityKeyPattern.test(filter.key) || filterKeys.has(filter.key)) {
      throw new Error(
        `Invalid or duplicate filter ${filter.key} for ${entity.key}`
      );
    }
    filterKeys.add(filter.key);
    if (filter.multiple !== undefined && typeof filter.multiple !== "boolean") {
      throw new Error(
        `Invalid multiple filter flag for ${entity.key}/${filter.key}`
      );
    }
    validateAdminReferenceRegistration(filter);
    if (filter.multiple && !filter.options && !filter.reference) {
      throw new Error(
        `Multi-choice filter requires options: ${entity.key}/${filter.key}`
      );
    }
    const values = new Set<string>();
    for (const option of filter.options ?? []) {
      if (
        !option.value ||
        values.has(option.value) ||
        (filter.multiple && option.value.length > 200)
      ) {
        throw new Error(
          `Invalid or duplicate option for ${entity.key}/${filter.key}`
        );
      }
      values.add(option.value);
    }
  }
};
export const createAdminEntityRegistry = (
  entities: readonly AdminEntityDefinition[]
): AdminEntityRegistry => {
  if (entities.length === 0) {
    throw new Error("An admin application requires at least one entity.");
  }
  const byKey = new Map<string, AdminEntity>();
  for (const definition of entities) {
    const entity = resolveAdminEntityDefinition(definition);
    if (!entityKeyPattern.test(entity.key)) {
      throw new Error(`Invalid admin entity key: ${entity.key}`);
    }
    if (byKey.has(entity.key)) {
      throw new Error(`Duplicate admin entity key: ${entity.key}`);
    }
    validateListDefinition(entity);
    const actionIds = new Set<string>();
    for (const action of entity.actions ?? []) {
      if (actionIds.has(action.id)) {
        throw new Error(`Duplicate action ${action.id} for ${entity.key}`);
      }
      actionIds.add(action.id);
      if (Boolean(action.execute) === Boolean(action.operation)) {
        throw new Error(
          `Action requires exactly one execution contract: ${entity.key}/${action.id}`
        );
      }
    }
    if (entity.screens.create && !entity.adapter.create) {
      throw new Error(`Create screen requires a create adapter: ${entity.key}`);
    }
    if (entity.screens.update && !entity.adapter.update) {
      throw new Error(
        `Update screen requires an update adapter: ${entity.key}`
      );
    }
    byKey.set(entity.key, {
      ...entity,
      records: atom<readonly AdminRecordReference[]>([]),
    });
  }
  return { entities: [...byKey.values()], get: (key) => byKey.get(key) };
};

export interface AdminSelection {
  entity: string;
  ids: readonly string[];
}
export const adminSelectionAtom = atom<AdminSelection | null>(null);
export interface AdminPageCommandRegistration {
  owner: string;
  scope: string;
  commands: readonly AdminCommand[];
}
export const adminPageCommandsAtom = atom<AdminPageCommandRegistration | null>(
  null
);
