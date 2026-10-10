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
  TextField,
  TextareaField,
} from "@bezny/base";
import type { EntityRowData } from "@bezny/base";
import { useStore } from "jotai";
import { useCallback, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  editorialResources,
  noticeAtom,
  parseEditorialRecord,
  editorialTextLimits,
} from "./editorial-records.js";
import type { EditorialRecord, EditorialValues } from "./editorial-records.js";

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
  const resource = editorialResources.find((item) => item.key === entity?.key);
  if (!resource) {
    throw new Error("No editorial data source for the matched entity.");
  }
  return resource;
};

export const EditorialListPage = () => {
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
      description={`Write, publish, and manage your ${resource.label.toLocaleLowerCase()}.`}
      actions={
        commands.create && <AdminCommandButton command={commands.create} />
      }
    >
      <div className={styles.actions}>
        {commands.selectionCommands.map((command) => (
          <AdminCommandButton key={command.id} command={command} />
        ))}
      </div>
      {records.length === 0 ? (
        <p>
          No {resource.label.toLocaleLowerCase()} yet. Create your first{" "}
          {resource.singularLabel.toLocaleLowerCase()}.
        </p>
      ) : (
        <section
          aria-label={`${resource.label} in this workspace`}
          data-admin-entity={resource.key}
        >
          <EntityRowList
            selectedIds={selectedIds}
            onSelectedIdsChange={(ids) =>
              store.set(adminSelectionAtom, { entity: resource.key, ids })
            }
            selectable
            selectionMenu={false}
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
                    {record.published ? "Published" : "Draft"}
                  </Badge>
                ),
                id: record.id,
                title: record.title,
                trailing: (
                  <div className={styles.actions}>
                    {actions.map((command) => (
                      <AdminCommandButton key={command.id} command={command} />
                    ))}
                  </div>
                ),
              };
            })}
          />
        </section>
      )}
    </AdminPage>
  );
};

export const MissingEntityPage = () => {
  const { entity } = useAdminEntityContext();
  const { list } = useAdminEntityCommands();
  return (
    <AdminPage
      heading={`${entity?.singularLabel ?? "Entity"} not found`}
      description="This record or operation does not exist or is unavailable."
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
  const record = useCurrentRecord();
  const commands = useAdminEntityCommands();
  if (!record) {
    return <MissingEntityPage />;
  }
  return (
    <AdminPage
      heading={record.title}
      actions={
        <div className={styles.actions}>
          <AdminCommandButton command={commands.list} />
          {commands
            .forRecord(record.id)
            .map((command) =>
              command.location?.view === "detail" ? null : (
                <AdminCommandButton key={command.id} command={command} />
              )
            )}
        </div>
      }
    >
      <p>
        <Badge type={record.published ? "success" : "neutral"}>
          {record.published ? "Published" : "Draft"}
        </Badge>
      </p>
      <p className={styles.recordBody}>{record.body}</p>
    </AdminPage>
  );
};

const EditorialForm = ({ record }: { record?: EditorialRecord }) => {
  const resource = useEditorialResource();
  const store = useStore();
  const navigate = useAdminEntityNavigate();
  const session = useAdminDataSession();
  const form = useForm<EditorialValues>({
    defaultValues: {
      body: record?.body ?? "",
      published: record?.published ?? false,
      title: record?.title ?? "",
    },
  });
  const save = useCallback(
    async (values: EditorialValues) => {
      try {
        const saved = record
          ? await session.update(resource.key, record.id, values)
          : await session.create(resource.key, values);
        store.set(
          noticeAtom,
          `${resource.singularLabel} ${record ? "updated" : "created"}.`
        );
        await navigate({
          entity: resource.key,
          recordId: saved.id,
          view: "detail",
        });
      } catch (error) {
        form.setError("root", {
          message:
            error instanceof Error ? error.message : "Unable to save record.",
        });
      }
    },
    [form, navigate, record, resource, session, store]
  );
  const pageCommands = useMemo<AdminCommand[]>(
    () => [
      {
        execute: async () => {
          await form.handleSubmit(save)();
        },
        id: `${resource.key}.form.save`,
        label: `Save ${resource.singularLabel.toLocaleLowerCase()}`,
      },
      {
        execute: () => navigate({ entity: resource.key, view: "list" }),
        id: `${resource.key}.form.cancel`,
        label: "Cancel editing",
      },
    ],
    [form, navigate, resource, save]
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
        <TextField<EditorialValues>
          name="title"
          label="Title"
          maxLength={editorialTextLimits.title}
          rules={{
            maxLength: {
              message: `Use at most ${editorialTextLimits.title} title characters.`,
              value: editorialTextLimits.title,
            },
            required: "Enter a title.",
            validate: (value) =>
              (typeof value === "string" && value.trim().length > 0) ||
              "Enter a title.",
          }}
        />
        <TextareaField<EditorialValues>
          name="body"
          label="Body"
          maxLength={editorialTextLimits.body}
          rows={8}
          rules={{
            maxLength: {
              message: `Use at most ${editorialTextLimits.body} content characters.`,
              value: editorialTextLimits.body,
            },
            required: `Enter ${resource.singularLabel.toLocaleLowerCase()} content.`,
            validate: (value) =>
              (typeof value === "string" && value.trim().length > 0) ||
              `Enter ${resource.singularLabel.toLocaleLowerCase()} content.`,
          }}
        />
        <CheckboxField<EditorialValues> name="published" label="Published" />
        <div className={styles.actions}>
          <Submit>Save {resource.singularLabel.toLocaleLowerCase()}</Submit>
          {cancel && <AdminCommandButton command={cancel} />}
        </div>
      </form>
    </FormProvider>
  );
};
export const EditorialCreatePage = () => {
  const resource = useEditorialResource();
  return (
    <AdminPage heading={`Create ${resource.singularLabel.toLocaleLowerCase()}`}>
      <EditorialForm key={resource.key} />
    </AdminPage>
  );
};
export const EditorialUpdatePage = () => {
  const record = useCurrentRecord();
  const { entity } = useAdminEntityContext();
  if (!record) {
    return <MissingEntityPage />;
  }
  return (
    <AdminPage heading={`Edit ${record.title}`}>
      <EditorialForm key={`${entity?.key}:${record.id}`} record={record} />
    </AdminPage>
  );
};
