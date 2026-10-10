import type { AdminEntityView } from "./admin-entity-model.js";

/** This route contract is used by router construction, context, and commands. */
export const adminEntityPaths = {
  create: "/$entity/create",
  detail: "/$entity/$recordId",
  list: "/$entity",
  update: "/$entity/$recordId/edit",
} as const;

export const adminEntityViewForRoute = (
  routeId: string | undefined
): AdminEntityView | null => {
  for (const view of ["list", "create", "detail", "update"] as const) {
    if (adminEntityPaths[view] === routeId) {
      return view;
    }
  }
  return null;
};
