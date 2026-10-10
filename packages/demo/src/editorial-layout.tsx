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
import { AdminLayout } from "@bezny/admin/layout";
import { Outlet } from "@tanstack/react-router";
import { useAtomValue } from "jotai";

import { useArticleCommands, useArticleContext } from "./article-actions.js";
import {
  ArticleCommandPalette,
  ArticleDeleteDialog,
} from "./article-dialogs.js";
import { ArticleCommandButton } from "./article-pages.js";
import { describeArticleContext, noticeAtom } from "./article-state.js";

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

export const EditorialShell = () => {
  const commands = useArticleCommands();
  const context = useArticleContext();
  const notice = useAtomValue(noticeAtom);
  return (
    <>
      <AdminLayout
        header={
          <div className={styles.header}>
            <strong>Bezny editorial</strong>
            <output aria-label="Current context">
              Context: {describeArticleContext(context)}
            </output>
            <ArticleCommandPalette />
          </div>
        }
        navigation={
          <div className={styles.actions}>
            <ArticleCommandButton command={commands.list} />
            <ArticleCommandButton command={commands.create} />
          </div>
        }
        navigationLabel="Editorial navigation"
        footer="Demo workspace · Changes are kept in memory and reset on reload."
      >
        <output aria-label="Notifications">{notice}</output>
        <Outlet />
      </AdminLayout>
      <ArticleDeleteDialog />
    </>
  );
};
