/// <reference types="vite/client" />
import {
  defineAdminEntity,
  decodeAdminFilterSelection,
} from "@bezny/admin/adapters";
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

const theme =
  new URLSearchParams(location.search).get("theme") === "dark"
    ? "dark"
    : "light";
document.documentElement.className = `bezny-${theme}`;

const records = [
  { category: "news", id: "1", label: "Alpha" },
  { category: "guides", id: "2", label: "Beta" },
  { category: "notes", id: "3", label: "Gamma" },
];
const translations = createAdminI18n({
  lng: new URLSearchParams(location.search).get("language") ?? "en",
});
const entities = [
  defineAdminEntity({
    adapter: {
      get: (id) =>
        Promise.resolve(records.find((record) => record.id === id) ?? null),
      list: (query, { signal }) => {
        signal.throwIfAborted();
        const selected = new Set(
          decodeAdminFilterSelection(query.filters.category ?? "")
        );
        const filtered = records.filter(
          (record) => !selected.size || selected.has(record.category)
        );
        return Promise.resolve({
          items: filtered.slice(
            (query.page - 1) * query.pageSize,
            query.page * query.pageSize
          ),
          total: filtered.length,
        });
      },
    },
    filters: [
      {
        key: "category",
        label: "Category",
        multiple: true,
        options: [
          { label: "News", value: "news" },
          { label: "Guides", value: "guides" },
          { label: "Notes", value: "notes" },
          { label: "Complete collection", value: "all" },
        ],
      },
    ],
    key: "articles",
    label: "Articles",
    pageSize: 2,
    parseValues: (value: unknown) => value,
    reference: (record) => record,
    singularLabel: "Article",
  }),
];
const Root = () => (
  <AdminLayout header={<AdminHeader title="Editorial" />}>
    <Outlet />
  </AdminLayout>
);
const application = createAdminApplication({
  Root,
  entities,
  i18n: translations,
});
const container = document.querySelector("#root");
if (!container) {
  throw new Error("Missing fixture root");
}
const root = createRoot(container);
root.render(<AdminApplicationProvider application={application} />);
Object.assign(window, {
  collectionLabels: {
    apply: translations.t("beznyAdmin:chrome.applyCommand"),
    category: translations.t("beznyAdmin:filter", { label: "Category" }),
    clear: translations.t("beznyAdmin:clearFilters"),
    palette: translations.t("beznyAdmin:chrome.palette"),
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
