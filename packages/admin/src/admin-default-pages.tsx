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
import { AdminCollectionSorting } from "./admin-collection-sorting.js";
import { AdminDetailActions } from "./admin-detail-actions.js";
import {
  useAdminEntityCommands,
  useAdminEntityNavigate,
  useAdminPageCommands,
} from "./admin-entity-commands.js";
import {
  useAdminEntityContext,
  useAdminDataSession,
  useAdminEntityPresentation,
} from "./admin-entity-context.js";
import type {
  AdminFormValues,
  AdminEntityField,
} from "./admin-entity-fields.js";
import { readAdminFormValues } from "./admin-entity-fields.js";
import { adminSelectionAtom } from "./admin-entity-model.js";
import type { AdminCommand } from "./admin-entity-model.js";
import { createAdminFormFieldCommands } from "./admin-form-field-commands.js";
import {
  useAdminFormLifetime,
  useAdminFormNavigationLifetime,
} from "./admin-form-lifetime.js";
import { isAdminFormMutationCurrent } from "./admin-mutation-availability.js";
import { AdminPage } from "./admin-page.js";
import { AdminRegisteredField } from "./admin-registered-field.js";
import { useAdminRouteBindings } from "./admin-route-bindings.js";
import { AdminSelectionBar } from "./admin-selection-bar.js";

import collectionStyles from "./admin-collection.module.scss";

export const AdminDefaultLoadingPage = () => {
  const { t } = useTranslation("beznyAdmin");
  return <output aria-label={t("loading")}>{t("loading")}</output>;
};

export const AdminDefaultErrorPage = () => {
  const { t } = useTranslation("beznyAdmin");
  return <p role="alert">{t("error")}</p>;
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
      actions={commands.create && <CommandButton command={commands.create} />}
    >
      <AdminCollectionFilters />
      <AdminCollectionSorting />
      {kind === "loading" && (
        <output aria-label={t("loading")}>{t("loading")}</output>
      )}
      {kind === "error" && <p role="alert">{t("error")}</p>}
      <AdminSelectionBar />
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
              label: command.menuLabel ?? command.label,
              onSelect: command.execute,
              tone: command.destructive ? "critical" : "secondary",
            }))}
            rows={data.items.map((record) => ({
              actions: commands.forRecord(record.id).map((command) => ({
                bulkable: false,
                key: command.id,
                label: command.menuLabel ?? command.label,
                onSelect: command.execute,
                tone: command.destructive ? "critical" : "secondary",
              })),
              description: entity.columns?.length ? (
                <dl className={collectionStyles.recordSummary}>
                  {entity.columns.map((column) => (
                    <div key={column.key}>
                      <dt>
                        {t(column.labelKey ?? column.label, {
                          defaultValue: column.label,
                        })}
                        :
                      </dt>
                      <dd>{column.render(record.data, "list")}</dd>
                    </div>
                  ))}
                </dl>
              ) : undefined,
              id: record.id,
              title: entity.screens.detail ? (
                <Link
                  to={bindings.detail.path}
                  params={{ entity: entity.key, recordId: record.id }}
                >
                  {record.label}
                </Link>
              ) : (
                record.label
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
        <AdminDetailActions
          commands={[
            commands.list,
            ...commands
              .forRecord(record.id)
              .filter((command) => command.location?.view !== "detail"),
          ]}
        />
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
                <dd>{column.render(record.data, "detail")}</dd>
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
  const store = useStore();
  const isAlive = useAdminFormLifetime();
  const isNavigationAlive = useAdminFormNavigationLifetime();
  const canMutate = useCallback(
    () =>
      isAlive() &&
      !!entity &&
      (view === "create" || view === "update") &&
      isAdminFormMutationCurrent(
        entity,
        view,
        recordId,
        data,
        store.get(session.snapshotAtom)
      ),
    [data, entity, isAlive, recordId, session, store, view]
  );
  const navigate = useAdminEntityNavigate();
  const { t } = useTranslation("beznyAdmin");
  const record = data?.items.find((item) => item.id === recordId);
  // Borrow the starting detached detail alongside RHF's initial values, never
  // replace it with newer hints or treat it as current mutation authority.
  // oxlint-disable-next-line react/hook-use-state -- Read-only edit origin, deliberately never replaced by newer hints.
  const [initialRecord] = useState(() => record?.data);
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
      if (!field.deriveValues || !canMutate()) {
        return;
      }
      const previous = form.getValues();
      setDeriving((count) => count + 1);
      try {
        const patch = await field.deriveValues(previous, record?.data);
        if (canMutate() && form.getValues(field.key) === previous[field.key]) {
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
        if (canMutate()) {
          form.setError("root", { message: t("error") });
        }
      }
      if (isAlive()) {
        setDeriving((count) => count - 1);
      }
    },
    [canMutate, configured, form, isAlive, record, t]
  );
  const [saving, setSaving] = useState(false);
  const save = useMemo(
    () => async (values: AdminFormValues) => {
      // RHF may yield during validation: check live scope and current hints now.
      if (!entity || saving || deriving > 0 || !canMutate()) {
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
            ? await session.update(
                entity.key,
                recordId,
                parsedValues,
                initialRecord
              )
            : await session.create(entity.key, parsedValues);
        const current = store.get(session.snapshotAtom);
        if (
          (isNavigationAlive?.() ?? isAlive()) &&
          current.entity === entity.key &&
          current.key === data?.key
        ) {
          await navigate(
            entity.screens.detail
              ? {
                  entity: entity.key,
                  recordId: result.id,
                  view: "detail",
                }
              : { entity: entity.key, view: "list" }
          );
        }
      } catch {
        if (canMutate()) {
          form.setError("root", {
            message: t("defaults.saveError", {
              defaultValue: "Could not save. Check the values and try again.",
            }),
          });
        }
      }
      if (isAlive()) {
        setSaving(false);
      }
    },
    [
      canMutate,
      data,
      deriving,
      entity,
      form,
      initialRecord,
      isAlive,
      isNavigationAlive,
      navigate,
      recordId,
      saving,
      session,
      store,
      t,
      view,
    ]
  );
  const pageCommands = useMemo<AdminCommand[]>(
    () =>
      entity
        ? [
            {
              execute: async () => {
                if (canMutate()) {
                  await form.handleSubmit(save)();
                }
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
            }).map((command) => ({
              ...command,
              execute: () => (canMutate() ? command.execute() : undefined),
              ...(command.input
                ? {
                    input: {
                      ...command.input,
                      execute: (value: string) =>
                        canMutate() ? command.input?.execute(value) : undefined,
                    },
                  }
                : {}),
            })),
          ]
        : [],
    [
      canMutate,
      configured,
      deriveValues,
      entity,
      form,
      navigate,
      save,
      t,
      watchedValues,
    ]
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
  const { scope, kind } = useAdminEntityContext();
  const { NotFound } = useAdminEntityPresentation();
  if (kind === "unavailable") {
    return <NotFound />;
  }
  if (kind === "loading") {
    return <AdminDefaultLoadingPage />;
  }
  if (kind === "error") {
    return <AdminDefaultErrorPage />;
  }
  return <DefaultEntityForm key={scope} />;
};
