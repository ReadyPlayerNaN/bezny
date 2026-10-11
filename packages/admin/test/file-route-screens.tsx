import { useRouter } from "@tanstack/react-router";

import type { FileRouteContext } from "./file-route-context.js";

export const ApplicationRoot = () => {
  const { Root } = useRouter().options.context as FileRouteContext;
  return <Root />;
};
export const EntityRouteScreen = () => {
  const { Screen } = useRouter().options.context as FileRouteContext;
  return <Screen />;
};
export const UnavailableRoute = () => {
  const { NotFound } = useRouter().options.context as FileRouteContext;
  return <NotFound />;
};
