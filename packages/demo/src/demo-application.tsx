import {
  AdminApplicationProvider,
  createAdminApplication,
} from "@bezny/admin/application";
import { createAdminI18n } from "@bezny/admin/i18n";
import type { RouterHistory } from "@tanstack/react-router";
import { createStore } from "jotai";
import { useEffect } from "react";

import { editorialAccountTranslations } from "./editorial-account-translations.js";
import { createEditorialAuthentication } from "./editorial-auth-session.js";
import { editorialAuthenticationAtom } from "./editorial-auth-state.js";
import { createEditorialEntities } from "./editorial-entities.js";
import { editorialComponents, EditorialShell } from "./editorial-layout.js";
import { createEditorialRepository, noticeAtom } from "./editorial-records.js";
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
  const store = createStore();
  const repository = createEditorialRepository((notice) =>
    store.set(noticeAtom, notice)
  );
  const application = createAdminApplication({
    Root: EditorialShell,
    entities: createEditorialEntities(repository, i18n),
    i18n,
    store,
    ...(history ? { history } : {}),
  });
  const clearPresentation = () => {
    application.store.set(noticeAtom, null);
  };
  application.session.onDispose(clearPresentation);
  const authentication = createEditorialAuthentication(application.store);
  application.store.set(editorialAuthenticationAtom, authentication);
  const authenticationReady = authentication.restore();
  application.session.onDispose(authentication.dispose);
  return { ...application, authentication, authenticationReady, repository };
};
export type DemoApplication = ReturnType<typeof createDemoApplication>;
export const DemoApp = ({ application }: { application: DemoApplication }) => {
  useEffect(
    () => () => {
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
