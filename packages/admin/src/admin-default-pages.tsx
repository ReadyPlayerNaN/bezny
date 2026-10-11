import { Button, EntityRowList, TextField, Submit } from "@bezny/base";
import { Link } from "@tanstack/react-router";
import { useStore } from "jotai";
import { useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  useAdminEntityCommands,
  useAdminEntityNavigate,
  useAdminPageCommands,
} from "./admin-entity-commands.js";
import {
  useAdminEntityContext,
  useAdminDataSession,
} from "./admin-entity-context.js";
import type { AdminFormValues } from "./admin-entity-fields.js";
import { readAdminFormValues } from "./admin-entity-fields.js";
import { adminSelectionAtom } from "./admin-entity-model.js";
import type { AdminCommand } from "./admin-entity-model.js";
import { useAdminListControls } from "./admin-list-controls.js";
import { AdminPage } from "./admin-page.js";
import { AdminRegisteredField } from "./admin-registered-field.js";
import { useAdminRouteBindings } from "./admin-route-bindings.js";

export const AdminDefaultLoadingPage = () => {
  const { t } = useTranslation("beznyAdmin");
  return <output aria-label={t("loading")}>{t("loading")}</output>;
};

const CommandButton = ({ command }: { command: AdminCommand }) => {
  const { t } = useTranslation("beznyAdmin");
  const [failed, setFailed] = useState(false);
  return (
    <>
      <Button
        variant={command.destructive ? "critical" : "secondary"}
        onClick={async () => {
          setFailed(false);
          try {
            await command.execute();
          } catch {
            setFailed(true);
          }
        }}
      >
        {command.label}
      </Button>
      {failed && <p role="alert">{t("error")}</p>}
    </>
  );
};
const ListInput = ({ command }: { command: AdminCommand }) => {
  const { input } = command;
  const { t } = useTranslation("beznyAdmin");
  const form = useForm<{ value: string }>({
    values: { value: input?.value ?? "" },
  });
  if (!input) {
    return null;
  }
  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(async ({ value }) => {
          try {
            await input.execute(value);
          } catch {
            form.setError("value", { message: t("error") });
          }
        })}
      >
        {input.options ? (
          <AdminRegisteredField
            field={{
              key: "value",
              label: input.label,
              options: [
                {
                  label: t("defaults.all", { defaultValue: "All" }),
                  value: "",
                },
                ...input.options,
              ],
              type: "select",
            }}
          />
        ) : (
          <TextField
            name="value"
            label={input.label}
            type={input.type === "number" ? "number" : "text"}
            min={input.min}
            max={input.max}
            maxLength={input.maxLength}
          />
        )}
        <Submit>{t("defaults.apply", { defaultValue: "Apply" })}</Submit>
      </form>
    </FormProvider>
  );
};
const DefaultListControls = () => {
  const controls = useAdminListControls();
  const { t } = useTranslation("beznyAdmin");
  return (
    <section aria-label={t("defaults.controls")}>
      {[...controls.filterCommands, ...controls.paginationCommands].map(
        (command) =>
          command.input ? (
            <ListInput key={command.id} command={command} />
          ) : (
            <CommandButton key={command.id} command={command} />
          )
      )}
      {controls.clear && <CommandButton command={controls.clear} />}
    </section>
  );
};
export const AdminDefaultListPage = () => {
  const { entity, data, kind, selectedIds } = useAdminEntityContext();
  const bindings = useAdminRouteBindings();
  const commands = useAdminEntityCommands();
  const store = useStore();
  const { t } = useTranslation("beznyAdmin");
  if (!entity) {
    return null;
  }
  return (
    <AdminPage
      heading={entity.label}
      actions={
        <>
          {commands.create && <CommandButton command={commands.create} />}
          {commands.refresh && <CommandButton command={commands.refresh} />}
        </>
      }
    >
      <DefaultListControls />
      {kind === "loading" && (
        <output aria-label={t("loading")}>{t("loading")}</output>
      )}
      {kind === "error" && <p role="alert">{t("error")}</p>}
      {commands.selectionCommands.map((command) => (
        <CommandButton key={command.id} command={command} />
      ))}
      {data?.status === "ready" &&
        (data.items.length === 0 ? (
          <p>{t("defaults.empty", { defaultValue: "No records found." })}</p>
        ) : (
          <EntityRowList
            selectable
            selectedIds={selectedIds}
            onSelectedIdsChange={(ids) =>
              store.set(adminSelectionAtom, { entity: entity.key, ids })
            }
            selectLabel={(row) => commands.forSelection(row.id).label}
            selectionActions={commands.selectionCommands.map((command) => ({
              key: command.id,
              label: command.label,
              onSelect: command.execute,
              tone: command.destructive ? "critical" : "secondary",
            }))}
            rows={data.items.map((record) => ({
              actions: commands.forRecord(record.id).map((command) => ({
                bulkable: false,
                key: command.id,
                label: command.label,
                onSelect: command.execute,
                tone: command.destructive ? "critical" : "secondary",
              })),
              description: (
                <dl>
                  {entity.columns?.map((column) => (
                    <div key={column.key}>
                      <dt>
                        {t(column.labelKey ?? column.label, {
                          defaultValue: column.label,
                        })}
                      </dt>
                      <dd>{column.render(record.data)}</dd>
                    </div>
                  ))}
                </dl>
              ),
              id: record.id,
              title: (
                <Link
                  to={bindings.detail.path}
                  params={{ entity: entity.key, recordId: record.id }}
                >
                  {record.label}
                </Link>
              ),
            }))}
          />
        ))}
    </AdminPage>
  );
};
export const AdminDefaultDetailPage = () => {
  const { entity, data, recordId } = useAdminEntityContext();
  const commands = useAdminEntityCommands();
  const { t } = useTranslation("beznyAdmin");
  const record = data?.items.find((item) => item.id === recordId);
  if (!entity || !record) {
    return null;
  }
  const values = entity.form
    ? readAdminFormValues(entity.form, record.data)
    : undefined;
  return (
    <AdminPage
      heading={record.label}
      actions={
        <>
          {[
            commands.list,
            ...commands
              .forRecord(record.id)
              .filter((command) => command.location?.view !== "detail"),
          ].map((command) => (
            <CommandButton key={command.id} command={command} />
          ))}
        </>
      }
    >
      <dl>
        {entity.columns
          ? entity.columns.map((column) => (
              <div key={column.key}>
                <dt>
                  {t(column.labelKey ?? column.label, {
                    defaultValue: column.label,
                  })}
                </dt>
                <dd>{column.render(record.data)}</dd>
              </div>
            ))
          : entity.form?.fields.map((field) => (
              <div key={field.key}>
                <dt>
                  {t(field.labelKey ?? field.label, {
                    defaultValue: field.label,
                  })}
                </dt>
                <dd>{String(values?.[field.key] ?? "")}</dd>
              </div>
            ))}
      </dl>
    </AdminPage>
  );
};
const DefaultEntityForm = () => {
  const { entity, data, recordId, view } = useAdminEntityContext();
  const session = useAdminDataSession();
  const navigate = useAdminEntityNavigate();
  const { t } = useTranslation("beznyAdmin");
  const record = data?.items.find((item) => item.id === recordId);
  const configured = entity?.form;
  const form = useForm<AdminFormValues>({
    defaultValues: configured
      ? readAdminFormValues(configured, record?.data)
      : {},
  });
  const [saving, setSaving] = useState(false);
  const save = useMemo(
    () => async (values: AdminFormValues) => {
      if (!entity || saving) {
        return;
      }
      setSaving(true);
      const parsedValues = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          entity.form?.fields.some(
            (field) => field.key === key && field.type === "number"
          ) && value !== ""
            ? Number(value)
            : value,
        ])
      );
      try {
        const result =
          view === "update" && recordId
            ? await session.update(entity.key, recordId, parsedValues)
            : await session.create(entity.key, parsedValues);
        await navigate({
          entity: entity.key,
          recordId: result.id,
          view: "detail",
        });
      } catch {
        form.setError("root", {
          message: t("defaults.saveError", {
            defaultValue: "Could not save. Check the values and try again.",
          }),
        });
      }
      setSaving(false);
    },
    [entity, form, navigate, recordId, saving, session, t, view]
  );
  const pageCommands = useMemo<AdminCommand[]>(
    () =>
      entity
        ? [
            {
              execute: async () => {
                await form.handleSubmit(save)();
              },
              id: `${entity.key}.save`,
              label: t("defaults.save", { defaultValue: "Save" }),
            },
            {
              execute: () => navigate({ entity: entity.key, view: "list" }),
              id: `${entity.key}.cancel`,
              label: t("defaults.cancel", { defaultValue: "Cancel" }),
            },
          ]
        : [],
    [entity, form, navigate, save, t]
  );
  useAdminPageCommands(pageCommands);
  if (!entity || !configured) {
    return null;
  }
  return (
    <AdminPage
      heading={t(view === "update" ? "edit" : "create", {
        entity: entity.singularLabel,
        record: record?.label,
      })}
    >
      <FormProvider {...form}>
        <form noValidate onSubmit={form.handleSubmit(save)}>
          <fieldset
            disabled={form.formState.isSubmitting}
            aria-label={entity.singularLabel}
          >
            {configured.fields.map((field) => (
              <AdminRegisteredField key={field.key} field={field} />
            ))}
          </fieldset>
          {form.formState.errors.root && (
            <p role="alert">{form.formState.errors.root.message}</p>
          )}
          <Submit disabled={form.formState.isSubmitting}>
            {t("defaults.save", { defaultValue: "Save" })}
          </Submit>
          {pageCommands[1] && <CommandButton command={pageCommands[1]} />}
        </form>
      </FormProvider>
    </AdminPage>
  );
};
export const AdminDefaultFormPage = () => {
  const { scope } = useAdminEntityContext();
  return <DefaultEntityForm key={scope} />;
};
