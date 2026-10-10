import {
  AdminApplicationProvider,
  createAdminApplication,
} from "@bezny/admin/application";
import { createAdminI18n } from "@bezny/admin/i18n";
import type { RouterHistory } from "@tanstack/react-router";
import { useEffect } from "react";

import { editorialAccountTranslations } from "./editorial-account-translations.js";
import { editorialUserAtom } from "./editorial-authentication.js";
import { createEditorialEntities } from "./editorial-entities.js";
import { editorialComponents, EditorialShell } from "./editorial-layout.js";
import { MissingEntityPage } from "./editorial-pages.js";
import {
  createEditorialRepository,
  deletionRequestAtom,
  noticeAtom,
} from "./editorial-records.js";
import { editorialTranslations } from "./editorial-translations.js";

export const createDemoApplication = (
  history?: RouterHistory,
  locale = "en"
) => {
  const i18n = createAdminI18n({
    lng: locale,
    resources: structuredClone({
      ar: { ...editorialTranslations.ar, ...editorialAccountTranslations.ar },
      cs: { ...editorialTranslations.cs, ...editorialAccountTranslations.cs },
      en: { ...editorialTranslations.en, ...editorialAccountTranslations.en },
    }),
  });
  const repository = createEditorialRepository();
  const application = createAdminApplication({
    NotFound: MissingEntityPage,
    Root: EditorialShell,
    entities: createEditorialEntities(repository, i18n),
    i18n,
    ...(history ? { history } : {}),
  });
  const clearPresentation = () => {
    application.store.set(deletionRequestAtom, null);
    application.store.set(noticeAtom, null);
  };
  application.session.onDispose(clearPresentation);
  application.session.onDispose(() => {
    application.store.set(editorialUserAtom, null);
  });
  return { ...application, repository };
};
export type DemoApplication = ReturnType<typeof createDemoApplication>;
export const DemoApp = ({ application }: { application: DemoApplication }) => {
  useEffect(
    () => () => {
      application.store.set(deletionRequestAtom, null);
      application.store.set(noticeAtom, null);
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
