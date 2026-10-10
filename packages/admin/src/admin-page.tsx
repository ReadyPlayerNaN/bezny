import { useAdminBuildingBlocks } from "./admin-building-blocks.js";
import type { AdminPageProps } from "./admin-building-blocks.js";

/** Composes the configured page, including its heading and action region. */
export const AdminPage = (props: AdminPageProps) => {
  const { Page } = useAdminBuildingBlocks();
  return <Page {...props} />;
};
