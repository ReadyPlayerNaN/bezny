import type { AnyRouter } from "@tanstack/react-router";

import { createAdminRuntime } from "../../admin/dist/admin-application-runtime.js";
import type { AdminRuntime } from "../../admin/dist/admin-application-runtime.js";
import { AdminEntityScreen } from "../../admin/dist/admin-entity-routing.js";
import type { AdminApplicationOptions } from "../../admin/dist/admin-entity-routing.js";
import {
  attachFileRoutes,
  fileRouteBindings,
} from "../../admin/test/file-route-application.js";

export {
  AdminApplicationProvider,
  AdminDefaultListPage,
  AdminDefaultDetailPage,
  AdminDefaultFormPage,
} from "../../admin/dist/admin-entity-routing.js";

/** Run the unchanged demo acceptance journeys through genuine file routes. */
export const createAdminApplication = (
  options: AdminApplicationOptions
): AdminRuntime & { router: AnyRouter } =>
  attachFileRoutes(
    createAdminRuntime({ ...options, routes: fileRouteBindings }),
    options,
    AdminEntityScreen
  );
