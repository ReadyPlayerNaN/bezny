/// <reference types="vite/client" />
import { defineAdminEntity } from "@bezny/admin/adapters";
import type { AdminFormValues } from "@bezny/admin/adapters";
import {
  AdminApplicationProvider,
  createAdminApplication,
} from "@bezny/admin/application";
import { useAdminEntityCommands } from "@bezny/admin/commands";
import type { AdminActionResult } from "@bezny/admin/entities";
import { adminSelectionAtom } from "@bezny/admin/entities";
import { AdminHeader } from "@bezny/admin/header";
import { createAdminI18n } from "@bezny/admin/i18n";
import { AdminLayout } from "@bezny/admin/layout";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bezny/base";
import { Outlet } from "@tanstack/react-router";
import { useRef } from "react";
import { createRoot } from "react-dom/client";

import "@bezny/base/style.css";
import "@bezny/admin/style.css";

const parameters = new URLSearchParams(location.search);
document.documentElement.className =
  parameters.get("theme") === "dark" ? "bezny-dark" : "bezny-light";
const translations = createAdminI18n({
  lng: parameters.get("language") ?? "en",
});
const writes: {
  ids: readonly string[];
  values: AdminFormValues;
  signal: AbortSignal;
}[] = [];
let pending:
  | ReturnType<typeof Promise.withResolvers<AdminActionResult>>
  | undefined;
const entity = defineAdminEntity({
  actions: [
    {
      id: "archive",
      label: () => "Archive group",
      operation: {
        confirm: (scope) =>
          `Archive exactly: ${scope.records.map((record) => record.label).join(", ")}`,
        execute: (scope, values, { signal }) => {
          writes.push({ ids: scope.ids, signal, values });
          pending = Promise.withResolvers<AdminActionResult>();
          // Deliberately ignore abort: the framework must fence late completion.
          return pending.promise;
        },
        input: {
          errors: () => ({ reason: "Choose another reason" }),
          fields: [{ key: "reason", label: "Reason", required: true }],
        },
      },
      target: "selection",
    },
  ],
  adapter: {
    list: () =>
      Promise.resolve({
        items: [
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
          { id: "other", label: "Unrelated" },
        ],
        total: 3,
      }),
  },
  key: "documents",
  label: "Documents",
  parseValues: (value: unknown) => value,
  reference: (record: { id: string; label: string }) => record,
  singularLabel: "Document",
});
const GroupControls = () => {
  const commands = useAdminEntityCommands();
  const menu = useRef<HTMLButtonElement>(null);
  return (
    <section aria-label="Explicit group controls">
      <Button
        onClick={(event) => {
          void commands
            .forRecords(["a", "b"], { returnFocus: event.currentTarget })[0]
            ?.execute();
        }}
      >
        Group action
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={menu}>Group menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={() => {
              void commands
                .forRecords(["a", "b"], { returnFocus: menu.current })[0]
                ?.execute();
            }}
          >
            Archive this group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
};
const Root = () => (
  <AdminLayout header={<AdminHeader title="Library" />}>
    <GroupControls />
    <Outlet />
  </AdminLayout>
);
const application = createAdminApplication({
  Root,
  entities: [entity, { ...entity, key: "others" }],
  i18n: translations,
});
const container = document.querySelector("#root");
if (!container) {
  throw new Error("Missing root");
}
createRoot(container).render(
  <AdminApplicationProvider application={application} />
);
Object.assign(window, {
  explicitActions: {
    cancel: translations.t("beznyAdmin:chrome.cancel"),
    navigate: () => application.router.navigate({ to: "/others" }),
    reject: () => pending?.reject(new Error("private diagnostics")),
    resolve: (result: AdminActionResult) => pending?.resolve(result),
    select: (ids: string[]) =>
      application.store.set(adminSelectionAtom, { entity: "documents", ids }),
    selection: () => application.store.get(adminSelectionAtom)?.ids,
    writes: () =>
      writes.map(({ ids, values, signal }) => ({
        aborted: signal.aborted,
        ids,
        values,
      })),
  },
});
