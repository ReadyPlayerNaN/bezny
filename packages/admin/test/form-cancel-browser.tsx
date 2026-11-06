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
  { id: "1", label: "Alpha" },
  { id: "2", label: "Beta" },
];
let writes = 0;
const entity = defineAdminEntity({
  adapter: {
    create: () => {
      writes += 1;
      return Promise.resolve({ id: "3", label: "Created" });
    },
    get: (id) =>
      Promise.resolve(records.find((record) => record.id === id) ?? null),
    list: () => Promise.resolve({ items: records, total: records.length }),
    update: (id) => {
      writes += 1;
      return Promise.resolve({ id, label: "Updated" });
    },
  },
  form: { fields: [{ key: "label", label: "Title", required: true }] },
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
  formCancellation: {
    labels: {
      cancel: translations.t("beznyAdmin:defaults.cancel"),
      palette: translations.t("beznyAdmin:chrome.palette"),
    },
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
