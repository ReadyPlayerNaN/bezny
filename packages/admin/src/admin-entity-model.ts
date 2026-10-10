import { atom } from "jotai";
import type { Atom, PrimitiveAtom, createStore } from "jotai";

import type { AdminEntityDefinition } from "./admin-data-adapter.js";
import type { AdminDataSession } from "./admin-data-session.js";

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
  execute: () => void | Promise<void>;
  destructive?: boolean;
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
}
export interface AdminEntityAction {
  id: string;
  target: "record" | "selection";
  label: (scope: AdminActionScope) => string;
  execute: (scope: AdminActionScope) => void | Promise<void>;
  destructive?: boolean;
  enabled?: Atom<boolean>;
  isAvailable?: (scope: AdminActionScope) => boolean;
}
/** Runtime metadata; references are only the active bounded page/detail, never an entire dataset. */
export interface AdminEntity extends AdminEntityDefinition {
  records: PrimitiveAtom<readonly AdminRecordReference[]>;
}
export interface AdminEntityRegistry {
  entities: readonly AdminEntity[];
  get: (key: string) => AdminEntity | undefined;
}
const entityKeyPattern = /^[a-z][a-z0-9-]*$/u;
export const createAdminEntityRegistry = (
  entities: readonly AdminEntityDefinition[]
): AdminEntityRegistry => {
  if (entities.length === 0) {
    throw new Error("An admin application requires at least one entity.");
  }
  const byKey = new Map<string, AdminEntity>();
  for (const entity of entities) {
    if (!entityKeyPattern.test(entity.key)) {
      throw new Error(`Invalid admin entity key: ${entity.key}`);
    }
    if (byKey.has(entity.key)) {
      throw new Error(`Duplicate admin entity key: ${entity.key}`);
    }
    const actionIds = new Set<string>();
    for (const action of entity.actions ?? []) {
      if (actionIds.has(action.id)) {
        throw new Error(`Duplicate action ${action.id} for ${entity.key}`);
      }
      actionIds.add(action.id);
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
