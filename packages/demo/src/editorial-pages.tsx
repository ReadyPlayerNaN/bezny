import {
  useAdminEntityCommands,
  useAdminEntityNavigate,
  useAdminPageCommands,
} from "@bezny/admin/commands";
import { useAdminEntityContext } from "@bezny/admin/context";
import type { AdminCommand } from "@bezny/admin/entities";
import { AdminPage } from "@bezny/admin/page";
import {
  Badge,
  Button,
  CheckboxField,
  CheckboxInput,
  Submit,
  TextField,
  TextareaField,
} from "@bezny/base";
import { useAtomValue, useStore } from "jotai";
import { useCallback, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { editorialResources, noticeAtom } from "./editorial-records.js";
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
  const records = useAtomValue(resource.records);
  const { selectedIds } = useAdminEntityContext();
  const selected = new Set(selectedIds);
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
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <caption>{resource.label} in this workspace</caption>
            <thead>
              <tr>
                <th scope="col">Select</th>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const select = commands.forSelection(record.id);
                return (
                  <tr key={record.id}>
                    <td>
                      <CheckboxInput
                        aria-label={select.label}
                        checked={selected.has(record.id)}
                        onCheckedChange={async () => {
                          await select.execute();
                        }}
                      />
                    </td>
                    <th scope="row">{record.title}</th>
                    <td>
                      <Badge type={record.published ? "success" : "neutral"}>
                        {record.published ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        {commands.forRecord(record.id).map((command) => (
                          <AdminCommandButton
                            key={command.id}
                            command={command}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
  const resource = useEditorialResource();
  const { recordId } = useAdminEntityContext();
  const records = useAtomValue(resource.records);
  return records.find((record) => record.id === recordId);
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
  const form = useForm<EditorialValues>({
    defaultValues: {
      body: record?.body ?? "",
      published: record?.published ?? false,
      title: record?.title ?? "",
    },
  });
  const save = useCallback(
    async (values: EditorialValues) => {
      const nextId = store.get(resource.nextId);
      const id = record?.id ?? String(nextId);
      const saved = {
        ...values,
        body: values.body.trim(),
        id,
        title: values.title.trim(),
      };
      store.set(resource.records, (records) =>
        record
          ? records.map((item) => (item.id === id ? saved : item))
          : [...records, saved]
      );
      if (!record) {
        store.set(resource.nextId, nextId + 1);
      }
      store.set(
        noticeAtom,
        `${resource.singularLabel} ${record ? "updated" : "created"}.`
      );
      await navigate({ entity: resource.key, recordId: id, view: "detail" });
    },
    [navigate, record, resource, store]
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
        <TextField<EditorialValues>
          name="title"
          label="Title"
          rules={{
            required: "Enter a title.",
            validate: (value) =>
              (typeof value === "string" && value.trim().length > 0) ||
              "Enter a title.",
          }}
        />
        <TextareaField<EditorialValues>
          name="body"
          label="Body"
          rows={8}
          rules={{
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
