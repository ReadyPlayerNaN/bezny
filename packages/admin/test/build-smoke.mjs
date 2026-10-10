import assert from "node:assert/strict";

import { AdminProvider } from "@bezny/admin";
import {
  AdminBuildingBlocksProvider,
  DefaultAdminLayout,
  DefaultAdminPage,
  DefaultAdminPageHeader,
  useAdminBuildingBlocks,
} from "@bezny/admin/building-blocks";
import { AdminLayout } from "@bezny/admin/layout";
import { AdminPage } from "@bezny/admin/page";

// Verify the public export without Vitest's module resolution or transforms.
for (const component of [
  AdminProvider,
  AdminLayout,
  AdminPage,
  AdminBuildingBlocksProvider,
  DefaultAdminLayout,
  DefaultAdminPage,
  DefaultAdminPageHeader,
  useAdminBuildingBlocks,
]) {
  assert.equal(typeof component, "function");
}
