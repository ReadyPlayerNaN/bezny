/// <reference types="vite/client" />
import { defineAdminEntity } from "@bezny/admin/adapters";
import type { AdminEntityForm } from "@bezny/admin/adapters";
import {
  AdminApplicationProvider,
  createAdminApplication,
} from "@bezny/admin/application";
import { AdminHeader } from "@bezny/admin/header";
import { createAdminI18n } from "@bezny/admin/i18n";
import { AdminLayout } from "@bezny/admin/layout";
import { Outlet } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import "@bezny/base/style.css";
import "@bezny/admin/style.css";

const parameters = new URLSearchParams(location.search);
document.documentElement.className =
  parameters.get("theme") === "dark" ? "bezny-dark" : "bezny-light";
const translations = createAdminI18n({
  lng: parameters.get("language") ?? "en",
});
let pending:
  | ReturnType<typeof Promise.withResolvers<{ id: string; label: string }>>
  | undefined;
let writes = 0;
const mutate = () => {
  writes += 1;
  pending = Promise.withResolvers<{ id: string; label: string }>();
  return pending.promise;
};
const form: AdminEntityForm = {
  defaultValues: { notes: "", title: "" },
  errors: () => ({
    locked: "Cannot edit",
    notes: "Review notes",
    title: "Already used",
  }),
  fields: [
    { disabled: true, key: "locked", label: "Locked" },
    { key: "title", label: "Title", required: true },
    { key: "notes", label: "Notes" },
  ],
};
const entity = defineAdminEntity({
  actions: [
    {
      id: "revise",
      label: () => "Revise",
      operation: {
        execute: async () => {
          await mutate();
          return {};
        },
        input: form,
      },
      target: "record",
    },
  ],
  adapter: {
    create: mutate,
    get: () => Promise.resolve({ id: "1", label: "Document" }),
    list: () =>
      Promise.resolve({ items: [{ id: "1", label: "Document" }], total: 1 }),
    update: mutate,
  },
  form,
  key: "documents",
  label: "Documents",
  parseValues: (value: unknown) => value,
  reference: (record) => record,
  singularLabel: "Document",
});
const Root = () => (
  <AdminLayout header={<AdminHeader title="Library" />}>
    <Outlet />
  </AdminLayout>
);
const application = createAdminApplication({
  Root,
  entities: [entity],
  i18n: translations,
});
const container = document.querySelector("#root");
if (!container) {
  throw new Error("Missing root");
}
const root = createRoot(container);
root.render(<AdminApplicationProvider application={application} />);
Object.assign(window, {
  formErrorFocus: {
    labels: {
      palette: translations.t("beznyAdmin:chrome.palette"),
      save: translations.t("beznyAdmin:defaults.save"),
    },
    reject: () => pending?.reject(new Error("conflict")),
    resolve: () => pending?.resolve({ id: "1", label: "Document" }),
    writes: () => writes,
  },
});
window.addEventListener(
  "pagehide",
  () => {
    root.unmount();
    application.dispose();
  },
  { once: true }
);
