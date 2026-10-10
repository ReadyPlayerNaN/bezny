import {
  useAdminEntityCommands,
  useAdminEntityNavigate,
  useAdminPageCommands,
} from "@bezny/admin/commands";
import {
  useAdminEntityContext,
  useAdminDataSession,
} from "@bezny/admin/context";
import { adminSelectionAtom } from "@bezny/admin/entities";
import type { AdminCommand } from "@bezny/admin/entities";
import { AdminPage } from "@bezny/admin/page";
import {
  Badge,
  Button,
  CheckboxField,
  EntityRowList,
  Submit,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  TextField,
  TextareaField,
} from "@bezny/base";
import type { EntityRowData } from "@bezny/base";
import { Link } from "@tanstack/react-router";
import { useStore } from "jotai";
import { useCallback, useMemo } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  readEditorialContent,
  editorialContentLocales,
  isEditorialContentLocale,
} from "./editorial-content.js";
import { EditorialListControls } from "./editorial-list-controls.js";
import { EditorialPageActions } from "./editorial-page-actions.js";
import {
  editorialResources,
  noticeAtom,
  parseEditorialRecord,
  editorialTextLimits,
} from "./editorial-records.js";
import type { EditorialRecord, EditorialValues } from "./editorial-records.js";
import { EditorialSelectionBar } from "./editorial-selection-bar.js";

import styles from "./editorial-admin.module.scss";

export const AdminCommandButton = ({ command }: { command: AdminCommand }) => (
  <Button
    variant={command.destructive ? "critical" : "secondary"}
    onClick={async () => {
      await command.execute();
    }}
  >
    {command.label}
  </Button>
);

const useEditorialResource = () => {
  const { entity } = useAdminEntityContext();
  const configured = editorialResources.find(
    (item) => item.key === entity?.key
  );
  const resource = useMemo(
    () =>
      configured && entity
        ? {
            ...configured,
            label: entity.label,
            singularLabel: entity.singularLabel,
          }
        : null,
    [configured, entity]
  );
  if (!resource) {
    throw new Error("No editorial data source for the matched entity.");
  }
  return resource;
};

export const EditorialListPage = () => {
  const { t } = useTranslation("editorial");
  const { t: adminT } = useTranslation("beznyAdmin");
  const resource = useEditorialResource();
  const { selectedIds, data } = useAdminEntityContext();
  const records = (data?.items ?? []).map((item) =>
    parseEditorialRecord(item.data)
  );
  const store = useStore();
  const commands = useAdminEntityCommands();
  return (
    <AdminPage
      heading={resource.label}
      description={t("listDescription", {
        entity: resource.label.toLocaleLowerCase(),
      })}
      actions={
        commands.create && <AdminCommandButton command={commands.create} />
      }
    >
      <EditorialListControls />
      {data?.status === "error" && (
        <>
          <p role="alert">{adminT("error")}</p>
          {commands.refresh && (
            <AdminCommandButton command={commands.refresh} />
          )}
        </>
      )}
      {data?.status !== "ready" && data?.status !== "error" && (
        <output aria-label={adminT("loading")}>{adminT("loading")}</output>
      )}
      <EditorialSelectionBar />
      {data?.status === "ready" &&
        (records.length === 0 ? (
          <p>
            {t("empty", {
              entity: resource.label.toLocaleLowerCase(),
              singular: resource.singularLabel.toLocaleLowerCase(),
            })}
          </p>
        ) : (
          <section
            aria-label={t("workspace", { entity: resource.label })}
            data-admin-entity={resource.key}
          >
            <EntityRowList
              groupLabel={(row) => t("item", { id: row.id })}
              menuLabel={(row) =>
                t("actions", {
                  title:
                    records.find((record) => record.id === row.id)?.title ??
                    row.id,
                })
              }
              actionErrorLabel={t("saveError")}
              menuSummary={() =>
                t("selected", {
                  entity: resource.label.toLocaleLowerCase(),
                  ids: selectedIds.join(", "),
                })
              }
              selectedIds={selectedIds}
              onSelectedIdsChange={(ids) =>
                store.set(adminSelectionAtom, { entity: resource.key, ids })
              }
              selectable
              selectionActions={commands.selectionCommands.map((command) => ({
                key: command.id,
                label: command.label,
                onSelect: command.execute,
                tone: command.destructive ? "critical" : "secondary",
              }))}
              selectLabel={(row) => commands.forSelection(row.id).label}
              rows={records.map<EntityRowData>((record) => {
                const actions = commands.forRecord(record.id);
                return {
                  actions: actions.map((command) => ({
                    bulkable: false,
                    key: command.id,
                    label: command.label,
                    onSelect: command.execute,
                    tone: command.destructive ? "critical" : "secondary",
                  })),
                  badge: (
                    <Badge type={record.published ? "success" : "neutral"}>
                      {t(record.published ? "published" : "draft")}
                    </Badge>
                  ),
                  id: record.id,
                  title: (
                    <Link
                      to="/$entity/$recordId"
                      params={{ entity: resource.key, recordId: record.id }}
                    >
                      {record.title}
                    </Link>
                  ),
                };
              })}
            />
          </section>
        ))}
    </AdminPage>
  );
};

export const MissingEntityPage = () => {
  const { t, i18n } = useTranslation("editorial");
  const { entity } = useAdminEntityContext();
  const { list } = useAdminEntityCommands();
  return (
    <AdminPage
      heading={t("unavailable", {
        entity: entity?.singularLabel ?? i18n.t("beznyAdmin:entity"),
      })}
      description={t("unavailableDescription")}
      actions={<AdminCommandButton command={list} />}
    />
  );
};

const useCurrentRecord = () => {
  const { recordId, data } = useAdminEntityContext();
  const record = data?.items.find((item) => item.id === recordId);
  return record ? parseEditorialRecord(record.data) : undefined;
};
export const EditorialDetailPage = () => {
  const { t } = useTranslation("editorial");
  const record = useCurrentRecord();
  const commands = useAdminEntityCommands();
  if (!record) {
    return <MissingEntityPage />;
  }
  return (
    <AdminPage
      heading={record.title}
      actions={
        <EditorialPageActions
          title={record.title}
          commands={[
            commands.list,
            ...commands
              .forRecord(record.id)
              .filter((command) => command.location?.view !== "detail"),
          ]}
        />
      }
    >
      <p>
        <Badge type={record.published ? "success" : "neutral"}>
          {t(record.published ? "published" : "draft")}
        </Badge>
      </p>
      <p className={styles.recordBody}>{record.body}</p>
    </AdminPage>
  );
};

const EditorialForm = ({ record }: { record?: EditorialRecord }) => {
  const { t, i18n } = useTranslation("editorial");
  const resource = useEditorialResource();
  const store = useStore();
  const navigate = useAdminEntityNavigate();
  const session = useAdminDataSession();
  const form = useForm<EditorialValues>({
    defaultValues: {
      body: record?.body ?? "",
      contentLocale: isEditorialContentLocale(i18n.resolvedLanguage)
        ? i18n.resolvedLanguage
        : "en",
      published: record?.published ?? false,
      title: record?.title ?? "",
    },
  });
  const contentLocale =
    useWatch({ control: form.control, name: "contentLocale" }) ?? "en";
  const titleValue = useWatch({ control: form.control, name: "title" });
  const bodyValue = useWatch({ control: form.control, name: "body" });
  const changeContentLocale = useCallback(
    async (locale: string) => {
      if (!isEditorialContentLocale(locale)) {
        return;
      }
      if (record) {
        const content = await readEditorialContent(record, locale);
        form.setValue("title", content.title, { shouldDirty: false });
        form.setValue("body", content.body, { shouldDirty: false });
      }
      form.setValue("contentLocale", locale, { shouldDirty: true });
    },
    [record, form]
  );
  const save = useCallback(
    async (values: EditorialValues) => {
      try {
        const saved = record
          ? await session.update(resource.key, record.id, values)
          : await session.create(resource.key, values);
        store.set(noticeAtom, {
          count: 1,
          entity: resource.key,
          key: record ? "updated" : "created",
        });
        await navigate({
          entity: resource.key,
          recordId: saved.id,
          view: "detail",
        });
      } catch {
        form.setError("root", { message: t("saveError") });
      }
    },
    [form, navigate, record, resource, session, store, t]
  );
  const pageCommands = useMemo<AdminCommand[]>(
    () => [
      {
        execute: async () => {
          await form.handleSubmit(save)();
        },
        id: `${resource.key}.form.save`,
        label: t("save", {
          entity: resource.singularLabel.toLocaleLowerCase(),
        }),
      },
      {
        execute: () => navigate({ entity: resource.key, view: "list" }),
        id: `${resource.key}.form.cancel`,
        label: t("cancelEditing"),
      },
      {
        execute: () => changeContentLocale(contentLocale),
        id: `${resource.key}.form.content-language`,
        input: {
          execute: changeContentLocale,
          label: t("contentLanguage"),
          options: editorialContentLocales.map((locale) => ({
            label: i18n.t(`beznyAdmin:languages.${locale}`),
            value: locale,
          })),
          value: contentLocale,
        },
        label: t("contentLanguage"),
      },
      {
        execute: () => form.setFocus("title"),
        id: `${resource.key}.form.title`,
        input: {
          execute: (value) =>
            form.setValue("title", value, {
              shouldDirty: true,
              shouldValidate: true,
            }),
          label: t("title"),
          maxLength: editorialTextLimits.title,
          value: titleValue,
        },
        label: t("title"),
      },
      {
        execute: () => form.setFocus("body"),
        id: `${resource.key}.form.body`,
        input: {
          execute: (value) =>
            form.setValue("body", value, {
              shouldDirty: true,
              shouldValidate: true,
            }),
          label: t("body"),
          maxLength: editorialTextLimits.body,
          type: "textarea",
          value: bodyValue,
        },
        label: t("body"),
      },
      {
        execute: () =>
          form.setValue("published", !form.getValues("published"), {
            shouldDirty: true,
          }),
        id: `${resource.key}.form.published`,
        label: t("published"),
      },
    ],
    [
      form,
      navigate,
      resource,
      save,
      t,
      i18n,
      contentLocale,
      titleValue,
      bodyValue,
      changeContentLocale,
    ]
  );
  useAdminPageCommands(pageCommands);
  const [, cancel] = pageCommands;
  return (
    <FormProvider {...form}>
      <form
        className={styles.form}
        noValidate
        onSubmit={form.handleSubmit(save)}
      >
        {form.formState.errors.root?.message && (
          <p role="alert">{form.formState.errors.root.message}</p>
        )}
        <Controller
          name="contentLocale"
          control={form.control}
          render={({ field }) => (
            <Select
              name={field.name}
              value={field.value ?? "en"}
              onValueChange={(locale) => {
                void changeContentLocale(locale);
              }}
            >
              <SelectTrigger
                ref={field.ref}
                onBlur={() => field.onBlur()}
                aria-label={t("contentLanguage")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {editorialContentLocales.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {i18n.t(`beznyAdmin:languages.${locale}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p>{t("contentFallback")}</p>
        <TextField<EditorialValues>
          name="title"
          label={t("title")}
          maxLength={editorialTextLimits.title}
          rules={{
            maxLength: {
              message: t("titleLimit", { count: editorialTextLimits.title }),
              value: editorialTextLimits.title,
            },
            required: t("titleRequired"),
            validate: (value) =>
              (typeof value === "string" && value.trim().length > 0) ||
              t("titleRequired"),
          }}
        />
        <TextareaField<EditorialValues>
          name="body"
          label={t("body")}
          maxLength={editorialTextLimits.body}
          rows={8}
          rules={{
            maxLength: {
              message: t("bodyLimit", { count: editorialTextLimits.body }),
              value: editorialTextLimits.body,
            },
            required: t("bodyRequired", {
              entity: resource.singularLabel.toLocaleLowerCase(),
            }),
            validate: (value) =>
              (typeof value === "string" && value.trim().length > 0) ||
              t("bodyRequired", {
                entity: resource.singularLabel.toLocaleLowerCase(),
              }),
          }}
        />
        <CheckboxField<EditorialValues>
          name="published"
          label={t("published")}
        />
        <div className={styles.actions}>
          <Submit>
            {t("save", { entity: resource.singularLabel.toLocaleLowerCase() })}
          </Submit>
          {cancel && <AdminCommandButton command={cancel} />}
        </div>
      </form>
    </FormProvider>
  );
};
export const EditorialCreatePage = () => {
  const { t } = useTranslation("beznyAdmin");
  const resource = useEditorialResource();
  return (
    <AdminPage
      heading={t("create", {
        entity: resource.singularLabel.toLocaleLowerCase(),
      })}
    >
      <EditorialForm key={resource.key} />
    </AdminPage>
  );
};
export const EditorialUpdatePage = () => {
  const { t } = useTranslation("beznyAdmin");
  const record = useCurrentRecord();
  const { entity } = useAdminEntityContext();
  if (!record) {
    return <MissingEntityPage />;
  }
  return (
    <AdminPage heading={t("edit", { record: record.title })}>
      <EditorialForm key={`${entity?.key}:${record.id}`} record={record} />
    </AdminPage>
  );
};
