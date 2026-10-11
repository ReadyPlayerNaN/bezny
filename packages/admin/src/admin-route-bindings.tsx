import { createContext, useContext } from "react";

import type {
  AdminEntityLocation,
  AdminEntityView,
} from "./admin-entity-model.js";
import { adminEntityPaths } from "./admin-entity-paths.js";

export interface AdminRouteBinding {
  /** TanStack's full route ID, including pathless layout IDs. */
  id: string;
  /** Navigation pattern, without pathless layout IDs. */
  path: string;
}
export type AdminRouteBindings = Readonly<
  Record<AdminEntityView, AdminRouteBinding>
>;
export const defaultAdminRouteBindings: AdminRouteBindings = {
  create: { id: adminEntityPaths.create, path: adminEntityPaths.create },
  detail: { id: adminEntityPaths.detail, path: adminEntityPaths.detail },
  list: { id: adminEntityPaths.list, path: adminEntityPaths.list },
  update: { id: adminEntityPaths.update, path: adminEntityPaths.update },
};
export const AdminRouteBindingsContext = createContext(
  defaultAdminRouteBindings
);
export const useAdminRouteBindings = () =>
  useContext(AdminRouteBindingsContext);

export const adminRouteLocation = (
  bindings: AdminRouteBindings,
  match:
    | { routeId: string; params: { entity?: unknown; recordId?: unknown } }
    | undefined
): AdminEntityLocation | null => {
  if (!match || typeof match.params.entity !== "string") {
    return null;
  }
  for (const view of ["list", "create", "detail", "update"] as const) {
    if (bindings[view].id !== match.routeId) {
      continue;
    }
    if (view === "list" || view === "create") {
      return { entity: match.params.entity, view };
    }
    if (typeof match.params.recordId === "string") {
      return {
        entity: match.params.entity,
        recordId: match.params.recordId,
        view,
      };
    }
  }
  return null;
};
