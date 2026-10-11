import { createRouter } from "@tanstack/react-router";
import type { FunctionComponent } from "react";

import type { AdminRuntime } from "../src/admin-application-runtime.js";
import type { AdminApplicationOptions } from "../src/admin-entity-routing.js";
import { routeTree } from "./file-route-tree.gen.js";

export const fileRouteBindings = {
  create: { id: "/_admin/$entity_/create", path: "/$entity/create" },
  detail: { id: "/_admin/$entity_/$recordId", path: "/$entity/$recordId" },
  list: { id: "/_admin/$entity", path: "/$entity" },
  update: {
    id: "/_admin/$entity_/$recordId_/edit",
    path: "/$entity/$recordId/edit",
  },
};

export const attachFileRoutes = (
  admin: AdminRuntime,
  { Root, NotFound, history }: AdminApplicationOptions,
  Screen: FunctionComponent
) =>
  admin.attach(
    createRouter({
      context: { NotFound: NotFound ?? admin.NotFound, Root, Screen, admin },
      routeTree,
      ...(history ? { history } : {}),
    })
  );
