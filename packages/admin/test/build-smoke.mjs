import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { AdminProvider } from "@bezny/admin";
import { defineAdminEntity } from "@bezny/admin/adapters";
import {
  AdminApplicationProvider,
  AdminEntityScreen,
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
import { createAdminDataSession } from "@bezny/admin/data";
import { createAdminEntityRegistry } from "@bezny/admin/entities";
import {
  AdminHeader,
  AdminAccountMenu,
  AdminCommandPalette,
  AdminLanguageMenuItems,
} from "@bezny/admin/header";
import { createAdminI18n } from "@bezny/admin/i18n";
import { AdminLayout } from "@bezny/admin/layout";
import { useAdminListControls } from "@bezny/admin/list";
import { AdminPage } from "@bezny/admin/page";
import { adminRouteLocation } from "@bezny/admin/routes";
import { createAdminRuntime } from "@bezny/admin/runtime";
import { AdminToastProvider, useAdminToasts } from "@bezny/admin/toasts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";

// Verify the public export without Vitest's module resolution or transforms.
for (const component of [
  AdminProvider,
  AdminHeader,
  AdminAccountMenu,
  AdminCommandPalette,
  AdminLanguageMenuItems,
  AdminToastProvider,
  useAdminToasts,
  AdminLayout,
  AdminPage,
  AdminBuildingBlocksProvider,
  DefaultAdminLayout,
  DefaultAdminPage,
  DefaultAdminPageHeader,
  useAdminBuildingBlocks,
  AdminApplicationProvider,
  createAdminApplication,
  createAdminRuntime,
  AdminEntityScreen,
  adminRouteLocation,
  createAdminEntityRegistry,
  defineAdminEntity,
  createAdminDataSession,
  createAdminI18n,
  useAdminListControls,
  useAdminEntityCommands,
  useAdminEntityNavigate,
  useAdminPageCommands,
  useAdminEntityContext,
  useAdminEntityRegistry,
]) {
  assert.equal(typeof component, "function");
}
const chrome = renderToStaticMarkup(
  createElement(
    I18nextProvider,
    { i18n: createAdminI18n() },
    createElement(AdminHeader, {
      account: { user: { email: "ada@example.test", name: "Ada Lovelace" } },
      commandPalette: false,
      title: "Consumer admin",
    })
  )
);
assert.match(chrome, /Consumer admin/u);
assert.match(chrome, /Account menu/u);
const styles = readFileSync(
  new URL(import.meta.resolve("@bezny/admin/style.css")),
  "utf-8"
);
assert.match(
  styles,
  /--bezny-control-admin-chrome-palette-list-max-height:var\(--bezny-structural-command-list-max-height\)/u
);
