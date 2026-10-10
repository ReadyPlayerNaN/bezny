import assert from "node:assert/strict";

import { AdminProvider } from "@bezny/admin";
import {
  AdminApplicationProvider,
  createAdminApplication,
} from "@bezny/admin/application";
import {
  AdminBuildingBlocksProvider,
  DefaultAdminLayout,
  DefaultAdminPage,
  DefaultAdminPageHeader,
  useAdminBuildingBlocks,
} from "@bezny/admin/building-blocks";
import {
  useAdminEntityCommands,
  useAdminEntityNavigate,
  useAdminPageCommands,
} from "@bezny/admin/commands";
import {
  useAdminEntityContext,
  useAdminEntityRegistry,
} from "@bezny/admin/context";
import { createAdminEntityRegistry } from "@bezny/admin/entities";
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
  AdminApplicationProvider,
  createAdminApplication,
  createAdminEntityRegistry,
  useAdminEntityCommands,
  useAdminEntityNavigate,
  useAdminPageCommands,
  useAdminEntityContext,
  useAdminEntityRegistry,
]) {
  assert.equal(typeof component, "function");
}
