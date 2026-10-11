import { createRootRouteWithContext } from "@tanstack/react-router";

import type { FileRouteContext } from "../file-route-context.js";
import { ApplicationRoot, UnavailableRoute } from "../file-route-screens.js";

export const Route = createRootRouteWithContext<FileRouteContext>()({
  component: ApplicationRoot,
  notFoundComponent: UnavailableRoute,
});
