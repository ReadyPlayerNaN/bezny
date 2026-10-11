import { createFileRoute } from "@tanstack/react-router";

import { EntityRouteScreen } from "../file-route-screens.js";

export const Route = createFileRoute("/_admin/$entity_/create")({
  component: EntityRouteScreen,
  loader: (args) => args.context.admin.loader("create")(args),
});
