/// <reference types="vite/client" />
import { defineAdminEntity } from "@bezny/admin/adapters";
import type { AdminEntityForms, AdminFormValues } from "@bezny/admin/adapters";
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
let record = { id: "1", label: "Document", score: 7, title: "Stored title" };
let pending: ReturnType<typeof Promise.withResolvers<boolean>> | undefined;
const writes: { view: string; values: AdminFormValues }[] = [];
const mutate = async (
  view: string,
  values: AdminFormValues,
  signal: AbortSignal
) => {
  writes.push({ values, view });
  pending = Promise.withResolvers<boolean>();
  await pending.promise;
  signal.throwIfAborted();
  record = {
    ...record,
    score: Number(values.score ?? record.score),
    title: String(values.title),
  };
  return record;
};
const forms: AdminEntityForms = {
  create: {
    defaultValues: { confirmation: "", password: "", title: "Draft" },
    errors: () => ({
      score: "Wrong view error",
      title: "Create title unavailable",
    }),
    fields: [
      { key: "title", label: "Create title" },
      {
        autoComplete: "new-password",
        key: "password",
        label: "Password",
        type: "password",
      },
      {
        autoComplete: "new-password",
        key: "confirmation",
        label: "Confirmation",
        sensitive: true,
        type: "password",
      },
    ],
    resolver: (values) =>
      String(values.password).length < 8 ||
      values.password !== values.confirmation
        ? {
            errors: {
              confirmation: {
                message: "Enter matching credentials",
                type: "validate",
              },
            },
            values: {},
          }
        : {
            errors: {},
            values: { ...values, title: String(values.title).trim() },
          },
  },
  update: {
    defaultValues: { score: 1, title: "" },
    errors: () => ({
      confirmation: "Wrong view error",
      title: "Edit title unavailable",
    }),
    fields: [
      { key: "title", label: "Edit title" },
      { key: "score", label: "Score", type: "number" },
    ],
    readValues: (value) => {
      if (
        !value ||
        typeof value !== "object" ||
        !("title" in value) ||
        !("score" in value)
      ) {
        throw new Error("Invalid document");
      }
      return { score: String(value.score), title: String(value.title) };
    },
    resolver: (values) =>
      String(values.title).trim() === ""
        ? {
            errors: {
              title: { message: "Supply an edit title", type: "required" },
            },
            values: {},
          }
        : {
            errors: {},
            values: { ...values, title: String(values.title).trim() },
          },
  },
};
const entity = defineAdminEntity({
  adapter: {
    create: (values, { signal }) => mutate("create", values, signal),
    get: () => Promise.resolve(record),
    list: () => Promise.resolve({ items: [record], total: 1 }),
    update: (_id, values, { signal }) => mutate("update", values, signal),
  },
  forms,
  key: "documents",
  label: "Documents",
  parseValues: (value: unknown) => {
    if (!value || typeof value !== "object") {
      throw new Error("Invalid values");
    }
    return Object.fromEntries(
      Object.entries(value).filter(
        (entry): entry is [string, string | number | boolean] =>
          ["string", "number", "boolean"].includes(typeof entry[1])
      )
    );
  },
  reference: (value: typeof record) => ({ id: value.id, label: value.label }),
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
  viewForms: {
    labels: {
      cancel: translations.t("beznyAdmin:defaults.cancel"),
      create: translations.t("beznyAdmin:create", { entity: "document" }),
      edit: translations.t("beznyAdmin:edit", { record: "Document" }),
      palette: translations.t("beznyAdmin:chrome.palette"),
      save: translations.t("beznyAdmin:defaults.save"),
    },
    reject: () => pending?.reject(new Error("conflict")),
    resolve: () => pending?.resolve(true),
    snapshot: () => application.store.get(application.session.snapshotAtom),
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
