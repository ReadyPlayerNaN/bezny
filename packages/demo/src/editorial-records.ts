import type { AdminDataAdapter, AdminListQuery } from "@bezny/admin/adapters";
import { atom } from "jotai";

export interface EditorialRecord {
  id: string;
  title: string;
  body: string;
  published: boolean;
}
export type EditorialValues = Omit<EditorialRecord, "id">;
export const editorialTextLimits = { body: 10_000, title: 200 };
export const editorialResources = [
  { key: "articles", label: "Articles", singularLabel: "Article" },
  { key: "pages", label: "Pages", singularLabel: "Page" },
];
const articleSeeds: EditorialRecord[] = [
  {
    body: "Build your administration interface from composable building blocks.",
    id: "1",
    published: true,
    title: "Welcome to Bezny",
  },
  {
    body: "Draft notes for the next release.",
    id: "2",
    published: false,
    title: "Planning the next release",
  },
  {
    body: "Select articles to work with several records at once.",
    id: "3",
    published: true,
    title: "Working with articles",
  },
];
const pageSeeds: EditorialRecord[] = [
  {
    body: "Learn about our publication.",
    id: "1",
    published: true,
    title: "About us",
  },
];
const maxDemoRecords = 200;
export const isEditorialRecord = (value: unknown): value is EditorialRecord =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "title" in value &&
  typeof value.title === "string" &&
  "body" in value &&
  typeof value.body === "string" &&
  "published" in value &&
  typeof value.published === "boolean";
export const parseEditorialRecord = (value: unknown): EditorialRecord => {
  if (!isEditorialRecord(value)) {
    throw new Error("Invalid editorial record returned by the adapter.");
  }
  return value;
};
export const parseEditorialValues = (value: unknown): EditorialValues => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("title" in value) ||
    typeof value.title !== "string" ||
    !("body" in value) ||
    typeof value.body !== "string" ||
    !("published" in value) ||
    typeof value.published !== "boolean"
  ) {
    throw new Error("Invalid editorial form values.");
  }
  const title = value.title.trim();
  const body = value.body.trim();
  if (
    !title ||
    !body ||
    title.length > editorialTextLimits.title ||
    body.length > editorialTextLimits.body
  ) {
    throw new TypeError(
      "Editorial text is empty or exceeds the configured length limit."
    );
  }
  return { body, published: value.published, title };
};

/** Bounded, application-owned mock backend. Production adapters belong to a remote/persistent backend. */
export const createEditorialRepository = () => {
  const datasets = new Map<string, Map<string, EditorialRecord>>([
    [
      "articles",
      new Map(articleSeeds.map((record) => [record.id, { ...record }])),
    ],
    ["pages", new Map(pageSeeds.map((record) => [record.id, { ...record }]))],
  ]);
  const nextIds = new Map([
    ["articles", 4],
    ["pages", 2],
  ]);
  let disposed = false;
  const dataset = (key: string) => {
    if (disposed) {
      throw new Error("Editorial repository disposed.");
    }
    const records = datasets.get(key);
    if (!records) {
      throw new Error(`Unknown editorial dataset: ${key}`);
    }
    return records;
  };
  const matches = (record: EditorialRecord, query: AdminListQuery) => {
    const text = query.filters.search?.toLocaleLowerCase() ?? "";
    const { status } = query.filters;
    return (
      `${record.title} ${record.body}`.toLocaleLowerCase().includes(text) &&
      (status !== "published" || record.published) &&
      (status !== "draft" || !record.published)
    );
  };
  const dispose = () => {
    disposed = true;
    datasets.clear();
    nextIds.clear();
  };
  const adapter = (
    key: string
  ): AdminDataAdapter<EditorialRecord, EditorialValues> => ({
    create: async (values, { signal }) => {
      await Promise.resolve();
      signal.throwIfAborted();
      if (
        [...datasets.values()].reduce(
          (total, records) => total + records.size,
          0
        ) >= maxDemoRecords
      ) {
        throw new Error(
          "The bounded demo backend is full; delete a record first."
        );
      }
      const nextId = nextIds.get(key);
      if (nextId === undefined) {
        throw new Error(`Unknown editorial dataset: ${key}`);
      }
      const record = { ...parseEditorialValues(values), id: String(nextId) };
      dataset(key).set(record.id, record);
      nextIds.set(key, nextId + 1);
      return record;
    },
    dispose,
    get: async (id, { signal }) => {
      await Promise.resolve();
      signal.throwIfAborted();
      return dataset(key).get(id) ?? null;
    },
    list: async (query, { signal }) => {
      await Promise.resolve();
      signal.throwIfAborted();
      const matching = [...dataset(key).values()].filter((record) =>
        matches(record, query)
      );
      const start = (query.page - 1) * query.pageSize;
      return {
        items: matching.slice(start, start + query.pageSize),
        total: matching.length,
      };
    },
    remove: async (ids, { signal }) => {
      await Promise.resolve();
      signal.throwIfAborted();
      for (const id of ids) {
        dataset(key).delete(id);
      }
    },
    update: async (id, values, { signal }) => {
      await Promise.resolve();
      signal.throwIfAborted();
      if (!dataset(key).has(id)) {
        throw new Error("The record no longer exists.");
      }
      const record = { ...parseEditorialValues(values), id };
      dataset(key).set(id, record);
      return record;
    },
  });
  return {
    adapter,
    diagnostics: () => ({
      disposed,
      maxRecords: maxDemoRecords,
      records: [...datasets.values()].reduce(
        (total, records) => total + records.size,
        0
      ),
    }),
    dispose,
    inspect: (key: string) => [...dataset(key).values()],
  };
};
export type EditorialRepository = ReturnType<typeof createEditorialRepository>;
export const noticeAtom = atom("");
export interface DeletionRequest {
  entity: string;
  ids: readonly string[];
  labels: readonly string[];
  returnFocus: HTMLElement | null;
}
export const deletionRequestAtom = atom<DeletionRequest | null>(null);
