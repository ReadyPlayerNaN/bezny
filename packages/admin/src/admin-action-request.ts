import { atom } from "jotai";

import type {
  AdminActionScope,
  AdminEntityAction,
} from "./admin-entity-model.js";
import { adminSelectionAtom } from "./admin-entity-model.js";

export interface AdminActionRequest {
  action: AdminEntityAction;
  scope: AdminActionScope;
  key: string;
  returnFocus: HTMLElement | null;
}
export const adminActionRequestAtom = atom<AdminActionRequest | null>(null);
export const currentAdminActionScope = (
  request: AdminActionRequest,
  ids: readonly string[]
): AdminActionScope | null => {
  const { scope, action } = request;
  const snapshot = scope.store.get(scope.session.snapshotAtom);
  if (
    snapshot.key !== request.key ||
    snapshot.entity !== scope.entity.key ||
    snapshot.status !== "ready"
  ) {
    return null;
  }
  const targets = new Set(ids);
  const records = scope.store
    .get(scope.entity.records)
    .filter((record) => targets.has(record.id));
  if (records.length !== ids.length) {
    return null;
  }
  if (action.target === "selection") {
    const selection = scope.store.get(adminSelectionAtom);
    if (
      selection?.entity !== scope.entity.key ||
      selection.ids.length !== ids.length ||
      !selection.ids.every((id) => targets.has(id))
    ) {
      return null;
    }
  }
  const current = { ...scope, ids, records };
  if (
    (action.enabled && !scope.store.get(action.enabled)) ||
    (action.isAvailable && !action.isAvailable(current))
  ) {
    return null;
  }
  return current;
};
export const requestAdminAction = (
  action: AdminEntityAction,
  scope: AdminActionScope
) => {
  if (scope.store.get(adminActionRequestAtom)) {
    return;
  }
  const active = document.activeElement;
  const row =
    active instanceof HTMLElement && active.closest('[role="menu"]')
      ? [...document.querySelectorAll<HTMLElement>("[data-selection-id]")].find(
          (element) => element.dataset.selectionId === scope.ids[0]
        )
      : null;
  scope.store.set(adminActionRequestAtom, {
    action,
    key: scope.store.get(scope.session.snapshotAtom).key,
    returnFocus: row ?? (active instanceof HTMLElement ? active : null),
    scope,
  });
};
