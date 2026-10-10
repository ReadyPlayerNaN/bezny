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
import { useAdminEntityCommands } from "@bezny/admin/commands";
import { useAdminEntityContext } from "@bezny/admin/context";
import { AdminLayout } from "@bezny/admin/layout";
import { Outlet } from "@tanstack/react-router";
import { useAtomValue } from "jotai";

import {
  EditorialCommandPalette,
  EditorialDeleteDialog,
} from "./editorial-dialogs.js";
import { AdminCommandButton } from "./editorial-pages.js";
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

export const EditorialShell = () => {
  const commands = useAdminEntityCommands();
  const context = useAdminEntityContext();
  let contextLabel = `No available ${context.entity?.singularLabel.toLocaleLowerCase() ?? "entity"}`;
  if (context.kind === "collection") {
    contextLabel = context.entity?.label ?? "";
  } else if (context.kind === "entity") {
    contextLabel = `${context.entity?.singularLabel} ${context.recordId}`;
  } else if (context.kind === "selection") {
    contextLabel = `Selected ${context.entity?.label.toLocaleLowerCase()}: ${context.selectedIds.join(", ")}`;
  }
  const notice = useAtomValue(noticeAtom);
  return (
    <>
      <AdminLayout
        header={
          <div className={styles.header}>
            <strong>Bezny editorial</strong>
            <output aria-label="Current context">
              Context: {contextLabel}
            </output>
            <EditorialCommandPalette />
          </div>
        }
        navigation={
          <div className={styles.actions}>
            {commands.navigationCommands.map((command) => (
              <AdminCommandButton key={command.id} command={command} />
            ))}
          </div>
        }
        navigationLabel="Editorial navigation"
        footer="Demo workspace · Changes are kept in memory and reset on reload."
      >
        <output aria-label="Notifications">{notice}</output>
        <Outlet />
      </AdminLayout>
      <EditorialDeleteDialog />
    </>
  );
};
