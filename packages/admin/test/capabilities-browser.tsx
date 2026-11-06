/// <reference types="vite/client" />
import { defineAdminEntity } from "@bezny/admin/adapters";
import {
  createAdminApplication,
  AdminApplicationProvider,
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
const writes: unknown[] = [];
let fail = true;
let failure = false;
const records = [{ email: "alpha@example.test", id: "1", label: "Alpha" }];
const entity = defineAdminEntity({
  actions: [
    {
      id: "archive",
      label: () => "Archive",
      operation: {
        confirm: () => "Archive this document?",
        execute: (scope, values) => {
          writes.push({ ids: scope.ids, values });
          if (fail) {
            fail = false;
            return Promise.reject(new Error("transport failure"));
          }
          return Promise.resolve({ message: "Archived successfully" });
        },
        input: { fields: [{ key: "reason", label: "Reason", required: true }] },
      },
      target: "record",
    },
  ],
  adapter: {
    create: (values) => {
      writes.push(values);
      return Promise.resolve({
        email: "created@example.test",
        id: "2",
        label: "Created",
      });
    },
    list: () =>
      failure
        ? Promise.reject(new Error("private failure"))
        : Promise.resolve({ items: records, total: records.length }),
  },
  filters: [
    { before: "until", key: "from", label: "From", type: "date" },
    { key: "until", label: "Until", type: "date" },
    { key: "minimum", label: "Minimum", min: 0, step: 0.5, type: "number" },
  ],
  form: {
    fields: [
      { key: "label", label: "Title", required: true },
      { key: "email", label: "Email", required: true, type: "email" },
      { key: "password", label: "Password", minLength: 8, type: "password" },
    ],
    resolver: (values) =>
      Promise.resolve(
        String(values.email).includes("@")
          ? { errors: {}, values }
          : {
              errors: {
                email: { message: "Enter an email address", type: "validate" },
              },
              values: {},
            }
      ),
  },
  key: "documents",
  label: "Documents",
  parseValues: (value: unknown) => value,
  reference: (record: { id: string; label: string; email: string }) => record,
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
  searchSources: [
    {
      id: "directory",
      label: "Directory",
      search: ({ query, signal }) => {
        signal.throwIfAborted();
        return Promise.resolve(
          query
            ? [
                {
                  execute: () => {
                    writes.push("remote");
                  },
                  id: "remote",
                  label: "Remote profile",
                },
              ]
            : []
        );
      },
    },
  ],
});
const container = document.querySelector("#root");
if (!container) {
  throw new Error("Missing root");
}
const root = createRoot(container);
root.render(<AdminApplicationProvider application={application} />);
Object.assign(window, {
  capabilities: {
    application,
    fail: () => {
      failure = true;
      void application.session.refresh();
    },
    labels: {
      apply: translations.t("beznyAdmin:chrome.applyCommand"),
      cancel: translations.t("beznyAdmin:chrome.cancel"),
      create: translations.t("beznyAdmin:create", { entity: "document" }),
      palette: translations.t("beznyAdmin:chrome.palette"),
      retry: translations.t("beznyAdmin:retry"),
      save: translations.t("beznyAdmin:defaults.save"),
      search: translations.t("beznyAdmin:chrome.searchCommands"),
    },
    recover: () => {
      failure = false;
    },
    writes,
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
