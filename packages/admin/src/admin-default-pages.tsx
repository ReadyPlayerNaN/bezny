import { Button, EntityRowList, Submit } from "@bezny/base";
import { Link } from "@tanstack/react-router";
import { useStore } from "jotai";
import { useCallback, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  AdminCollectionFilters,
  AdminCollectionPagination,
} from "./admin-collection-controls.js";
import {
  useAdminEntityCommands,
  useAdminEntityNavigate,
  useAdminPageCommands,
} from "./admin-entity-commands.js";
import {
  useAdminEntityContext,
  useAdminDataSession,
} from "./admin-entity-context.js";
import type {
  AdminFormValues,
  AdminEntityField,
} from "./admin-entity-fields.js";
import { readAdminFormValues } from "./admin-entity-fields.js";
import { adminSelectionAtom } from "./admin-entity-model.js";
import type { AdminCommand } from "./admin-entity-model.js";
import { createAdminFormFieldCommands } from "./admin-form-field-commands.js";
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
export const AdminDefaultUnavailablePage = () => {
  const { list } = useAdminEntityCommands();
  const { t } = useTranslation("beznyAdmin");
  return (
    <AdminPage
      heading={t("unavailable")}
      actions={<CommandButton command={list} />}
    />
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
      <AdminCollectionFilters />
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
            groupLabel={(row) => t("defaults.item", { id: row.id })}
            menuLabel={(row) =>
              t("defaults.actions", {
                record:
                  data.items.find((item) => item.id === row.id)?.label ??
                  row.id,
              })
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
      <AdminCollectionPagination />
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
  const watchedValues = useWatch({ control: form.control });
  const [deriving, setDeriving] = useState(0);
  const deriveValues = useCallback(
    async (field: AdminEntityField) => {
      if (!field.deriveValues) {
        return;
      }
      const previous = form.getValues();
      setDeriving((count) => count + 1);
      try {
        const patch = await field.deriveValues(previous, record?.data);
        if (form.getValues(field.key) === previous[field.key]) {
          for (const [key, value] of Object.entries(patch)) {
            if (
              value !== undefined &&
              configured?.fields.some(
                (configuredField) => configuredField.key === key
              ) &&
              form.getValues(key) === previous[key]
            ) {
              form.setValue(key, value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }
          }
        }
      } catch {
        form.setError("root", { message: t("error") });
      }
      setDeriving((count) => count - 1);
    },
    [configured, form, record, t]
  );
  const [saving, setSaving] = useState(false);
  const save = useMemo(
    () => async (values: AdminFormValues) => {
      if (!entity || saving || deriving > 0) {
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
    [deriving, entity, form, navigate, recordId, saving, session, t, view]
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
            ...createAdminFormFieldCommands({
              deriveValues,
              entityKey: entity.key,
              fields: configured?.fields ?? [],
              form,
              translate: t,
              values: watchedValues,
            }),
          ]
        : [],
    [configured, deriveValues, entity, form, navigate, save, t, watchedValues]
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
            disabled={form.formState.isSubmitting || deriving > 0}
            aria-label={entity.singularLabel}
          >
            {configured.fields.map((field) => (
              <AdminRegisteredField
                key={field.key}
                field={field}
                onValueChange={() => deriveValues(field)}
              />
            ))}
          </fieldset>
          {form.formState.errors.root && (
            <p role="alert">{form.formState.errors.root.message}</p>
          )}
          {deriving > 0 && <AdminDefaultLoadingPage />}
          <Submit disabled={form.formState.isSubmitting || deriving > 0}>
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
