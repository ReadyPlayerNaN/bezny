import { useAdminBuildingBlocks } from "./admin-building-blocks.js";
import type { AdminLayoutProps } from "./admin-building-blocks.js";

/** Composes the configured application shell around route content. */
export const AdminLayout = (props: AdminLayoutProps) => {
  const { Layout } = useAdminBuildingBlocks();
  return <Layout {...props} />;
};
