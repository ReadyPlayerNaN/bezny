import {
  AdminApplicationProvider,
  createAdminApplication,
} from "@bezny/admin/application";
import type { RouterHistory } from "@tanstack/react-router";

import { editorialEntities } from "./editorial-entities.js";
import { editorialComponents, EditorialShell } from "./editorial-layout.js";
import { MissingEntityPage } from "./editorial-pages.js";

export const createDemoApplication = (history?: RouterHistory) =>
  createAdminApplication({
    NotFound: MissingEntityPage,
    Root: EditorialShell,
    entities: editorialEntities,
    ...(history ? { history } : {}),
  });
export type DemoApplication = ReturnType<typeof createDemoApplication>;
export const DemoApp = ({ application }: { application: DemoApplication }) => (
  <AdminApplicationProvider
    application={application}
    components={editorialComponents}
  />
);
