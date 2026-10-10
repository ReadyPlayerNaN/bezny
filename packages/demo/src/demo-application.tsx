import {
  AdminApplicationProvider,
  createAdminApplication,
} from "@bezny/admin/application";
import type { RouterHistory } from "@tanstack/react-router";
import { useEffect } from "react";

import { createEditorialEntities } from "./editorial-entities.js";
import { editorialComponents, EditorialShell } from "./editorial-layout.js";
import { MissingEntityPage } from "./editorial-pages.js";
import {
  createEditorialRepository,
  deletionRequestAtom,
  noticeAtom,
} from "./editorial-records.js";

export const createDemoApplication = (history?: RouterHistory) => {
  const repository = createEditorialRepository();
  const application = createAdminApplication({
    NotFound: MissingEntityPage,
    Root: EditorialShell,
    entities: createEditorialEntities(repository),
    ...(history ? { history } : {}),
  });
  const clearPresentation = () => {
    application.store.set(deletionRequestAtom, null);
    application.store.set(noticeAtom, "");
  };
  application.session.onDispose(clearPresentation);
  return { ...application, repository };
};
export type DemoApplication = ReturnType<typeof createDemoApplication>;
export const DemoApp = ({ application }: { application: DemoApplication }) => {
  useEffect(
    () => () => {
      application.store.set(deletionRequestAtom, null);
      application.store.set(noticeAtom, "");
    },
    [application]
  );
  return (
    <AdminApplicationProvider
      application={application}
      components={editorialComponents}
    />
  );
};
