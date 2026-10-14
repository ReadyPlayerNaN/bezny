import type {
  AdminEntityDefinition,
  AdminMutationScope,
  AdminRecordEnvelope,
} from "./admin-data-adapter.js";
import type { AdminDataSnapshot } from "./admin-data-session.js";

/** Consumer hints only: the backend must authorize every mutation. */
export const isAdminMutationAvailable = (
  entity: AdminEntityDefinition,
  view: AdminMutationScope["view"],
  record?: AdminRecordEnvelope
): boolean =>
  (view !== "update" || !!record) &&
  (!entity.isMutationAvailable ||
    entity.isMutationAvailable({ view, ...(record ? { record } : {}) }) ===
      true);

/** Read the current detached data, not a captured permission or record reference. */
export const isAdminFormMutationCurrent = (
  entity: AdminEntityDefinition,
  view: AdminMutationScope["view"],
  recordId: string | null,
  presented: AdminDataSnapshot | null,
  current: AdminDataSnapshot
): boolean =>
  presented === current &&
  current.key !== "" &&
  current.entity === entity.key &&
  (view === "create"
    ? current.status === "idle" && isAdminMutationAvailable(entity, view)
    : current.status === "ready" &&
      isAdminMutationAvailable(
        entity,
        view,
        current.items.find((item) => item.id === recordId)
      ));
