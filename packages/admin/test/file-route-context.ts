import type { FunctionComponent } from "react";

import type { AdminRuntime } from "../src/admin-application-runtime.js";

export interface FileRouteContext {
  admin: AdminRuntime;
  Root: FunctionComponent;
  Screen: FunctionComponent;
  NotFound: FunctionComponent;
}
