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
const records = [
  { category: "news", id: "1", label: "Alpha" },
  { category: "news", id: "2", label: "Beta" },
  { category: "guides", id: "3", label: "Gamma" },
  { category: "guides", id: "4", label: "Delta" },
];
const entity = defineAdminEntity({
  adapter: {
    get: (id) =>
      Promise.resolve(records.find((record) => record.id === id) ?? null),
    list: (query, { signal }) => {
      signal.throwIfAborted();
      const sorted = records.toSorted((first, second) => {
        for (const rule of query.sort ?? []) {
          const key = rule.key === "category" ? "category" : "label";
          const compared = first[key].localeCompare(second[key]);
          if (compared) {
            return rule.direction === "asc" ? compared : -compared;
          }
        }
        return 0;
      });
      return Promise.resolve({
        items: sorted.slice(
          (query.page - 1) * query.pageSize,
          query.page * query.pageSize
        ),
        total: sorted.length,
      });
    },
  },
  key: "articles",
  label: "Articles",
  pageSize: 2,
  parseValues: (value: unknown) => value,
  reference: (record) => record,
  singularLabel: "Article",
  sorting: {
    default: [{ direction: "asc", key: "label" }],
    fields: [
      { key: "label", label: "Title" },
      { key: "category", label: "Category" },
    ],
  },
});
const Root = () => (
  <AdminLayout header={<AdminHeader title="Editorial" />}>
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
  throw new Error("Missing fixture root");
}
const root = createRoot(container);
root.render(<AdminApplicationProvider application={application} />);
Object.assign(window, {
  sortingLabels: {
    add: translations.t("beznyAdmin:sorting.add"),
    apply: translations.t("beznyAdmin:chrome.applyCommand"),
    ascending: translations.t("beznyAdmin:sorting.asc"),
    cancel: translations.t("beznyAdmin:chrome.cancel"),
    clear: translations.t("beznyAdmin:sorting.clear"),
    defaults: translations.t("beznyAdmin:sorting.reset"),
    descending: translations.t("beznyAdmin:sorting.desc"),
    direction: translations.t("beznyAdmin:sorting.direction", {
      label: "Title",
    }),
    field: translations.t("beznyAdmin:sorting.field", { priority: 1 }),
    label: translations.t("beznyAdmin:sorting.label"),
    palette: translations.t("beznyAdmin:chrome.palette"),
    removeTitle: translations.t("beznyAdmin:sorting.remove", {
      label: "Title",
    }),
    up: translations.t("beznyAdmin:sorting.upLabel", { label: "Category" }),
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
