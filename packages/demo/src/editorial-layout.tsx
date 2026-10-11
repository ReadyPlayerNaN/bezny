import {
  DefaultAdminLayout,
  DefaultAdminPage,
  DefaultAdminPageHeader,
} from "@bezny/admin/building-blocks";
import type {
  AdminBuildingBlockOverrides,
  AdminLayoutProps,
  AdminPageProps,
  AdminPageHeaderProps,
} from "@bezny/admin/building-blocks";
import {
  useAdminEntityContext,
  useAdminEntityRegistry,
} from "@bezny/admin/context";
import { AdminLayout } from "@bezny/admin/layout";
import { Link, Outlet } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { EditorialAccountMenu } from "./editorial-account-menu.js";
import {
  editorialSessionStatusAtom,
  editorialUserAtom,
} from "./editorial-auth-state.js";
import { EditorialLogin } from "./editorial-authentication.js";
import {
  EditorialCommandPalette,
  EditorialDeleteDialog,
} from "./editorial-dialogs.js";
import { noticeAtom } from "./editorial-records.js";

import styles from "./editorial-admin.module.scss";

const EditorialLayout = ({ className, ...props }: AdminLayoutProps) => (
  <DefaultAdminLayout
    {...props}
    className={[styles.application, className].filter(Boolean).join(" ")}
  />
);
const EditorialPage = ({ className, ...props }: AdminPageProps) => (
  <DefaultAdminPage
    {...props}
    className={[styles.page, className].filter(Boolean).join(" ")}
  />
);
const EditorialPageHeader = (props: AdminPageHeaderProps) => (
  <div className={styles.pageHeader}>
    <DefaultAdminPageHeader {...props} />
  </div>
);

export const editorialComponents = {
  Layout: EditorialLayout,
  Page: EditorialPage,
  PageHeader: EditorialPageHeader,
} satisfies AdminBuildingBlockOverrides;

const EditorialWorkspace = () => {
  const { t, i18n } = useTranslation("editorial");
  const context = useAdminEntityContext();
  let contextLabel = t("noEntity", {
    entity:
      context.entity?.singularLabel.toLocaleLowerCase() ??
      i18n.t("beznyAdmin:entity"),
  });
  if (context.kind === "collection") {
    contextLabel = context.entity?.label ?? "";
  } else if (context.kind === "entity") {
    contextLabel = `${context.entity?.singularLabel} ${context.recordId}`;
  } else if (context.kind === "selection") {
    contextLabel = t("selected", {
      entity: context.entity?.label.toLocaleLowerCase(),
      ids: context.selectedIds.join(", "),
    });
  }
  const notice = useAtomValue(noticeAtom);
  const registry = useAdminEntityRegistry();
  const noticeEntity = notice ? registry.get(notice.entity) : undefined;
  const noticeEntityLabel =
    notice?.count === 1 ? noticeEntity?.singularLabel : noticeEntity?.label;
  const noticeText = notice
    ? t(notice.key, {
        count: notice.count,
        entity:
          notice.key === "deleted"
            ? noticeEntityLabel?.toLocaleLowerCase()
            : noticeEntityLabel,
      })
    : "";
  return (
    <>
      <AdminLayout
        header={
          <div className={styles.header}>
            <strong>{t("shell")}</strong>
            <div className={styles.headerTools}>
              <EditorialCommandPalette />
              <EditorialAccountMenu />
            </div>
          </div>
        }
        navigation={
          <ul>
            {registry.entities.map((entity) => (
              <li key={entity.key}>
                <Link
                  to="/$entity"
                  params={{ entity: entity.key }}
                  activeProps={{ "aria-current": "page" }}
                >
                  {entity.label}
                </Link>
              </li>
            ))}
          </ul>
        }
        navigationLabel={t("navigation")}
        openNavigationLabel={t("openNavigation")}
        closeNavigationLabel={t("closeNavigation")}
        footer={
          <>
            {t("footer")}
            <output
              className={styles.statusBar}
              aria-label={t("currentContext")}
            >
              <span title={t("context", { label: contextLabel })}>
                {t("context", { label: contextLabel })}
              </span>
            </output>
          </>
        }
      >
        <output aria-label={t("notifications")}>{noticeText}</output>
        <Outlet />
      </AdminLayout>
      <EditorialDeleteDialog />
    </>
  );
};

export const EditorialShell = () => {
  const { i18n, t } = useTranslation("authentication");
  const language = i18n.resolvedLanguage ?? "en";
  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    const previousDirection = document.documentElement.dir;
    document.documentElement.lang = language;
    document.documentElement.dir = i18n.dir(language);
    return () => {
      document.documentElement.lang = previousLanguage;
      document.documentElement.dir = previousDirection;
    };
  }, [i18n, language]);
  const user = useAtomValue(editorialUserAtom);
  const sessionStatus = useAtomValue(editorialSessionStatusAtom);
  if (sessionStatus !== "ready") {
    return (
      <main lang={language} dir={i18n.dir(language)}>
        <output>{t("sessionLoading")}</output>
      </main>
    );
  }
  return user ? (
    <EditorialWorkspace />
  ) : (
    <div lang={language} dir={i18n.dir(language)}>
      <EditorialLogin />
    </div>
  );
};
