import { createFileRoute } from "@tanstack/react-router";

import { EntityRouteScreen } from "../file-route-screens.js";

export const Route = createFileRoute("/_admin/$entity_/$recordId")({
  component: EntityRouteScreen,
  loader: (args) => args.context.admin.loader("detail")(args),
});
