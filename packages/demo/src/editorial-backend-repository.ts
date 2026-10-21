import type { AdminDataAdapter, AdminListQuery } from "@bezny/admin/adapters";

import { readEditorialContent } from "./editorial-content.js";
import { parseEditorialValues } from "./editorial-records.js";
import type { EditorialRecord, EditorialValues } from "./editorial-records.js";

const articleSeeds: EditorialRecord[] = [
  {
    body: "Build your administration interface from composable building blocks.",
    content: {
      ar: {
        body: "ابنِ واجهة الإدارة من مكونات قابلة لإعادة الاستخدام.",
        title: "مرحبًا ببيزني",
      },
      cs: {
        body: "Sestavte administraci z opakovaně použitelných stavebních bloků.",
        title: "Vítejte v Bezny",
      },
      en: {
        body: "Build your administration interface from composable building blocks.",
        title: "Welcome to Bezny",
      },
    },
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
const project = async (
  record: EditorialRecord,
  locale: string
): Promise<EditorialRecord> => ({
  ...record,
  ...(await readEditorialContent(record, locale)),
});
const matches = (record: EditorialRecord, query: AdminListQuery) => {
  const text = query.filters.search?.toLocaleLowerCase(query.locale) ?? "";
  const { status } = query.filters;
  return (
    `${record.title} ${record.body}`
      .toLocaleLowerCase(query.locale)
      .includes(text) &&
    (status !== "published" || record.published) &&
    (status !== "draft" || !record.published)
  );
};

/** Worker-owned bounded storage. Disconnecting a client must not dispose it. */
export const createEditorialRepository = () => {
  const datasets = new Map<string, Map<string, EditorialRecord>>([
    [
      "articles",
      new Map(
        articleSeeds.map((record) => [record.id, structuredClone(record)])
      ),
    ],
    [
      "pages",
      new Map(pageSeeds.map((record) => [record.id, structuredClone(record)])),
    ],
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
      const parsed = parseEditorialValues(values);
      const sourceLocale = parsed.contentLocale ?? "en";
      const record: EditorialRecord = {
        body: parsed.body,
        content: { [sourceLocale]: { body: parsed.body, title: parsed.title } },
        id: String(nextId),
        published: parsed.published,
        sourceLocale,
        title: parsed.title,
      };
      dataset(key).set(record.id, record);
      nextIds.set(key, nextId + 1);
      return record;
    },
    dispose,
    get: async (id, { signal, locale = "en" }) => {
      await Promise.resolve();
      signal.throwIfAborted();
      const record = dataset(key).get(id);
      return record ? await project(record, locale) : null;
    },
    list: async (query, { signal }) => {
      await Promise.resolve();
      signal.throwIfAborted();
      const projected = await Promise.all(
        [...dataset(key).values()].map((record) =>
          project(record, query.locale)
        )
      );
      signal.throwIfAborted();
      const matching = projected.filter((record) => matches(record, query));
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
      const existing = dataset(key).get(id);
      if (!existing) {
        throw new Error("The record no longer exists.");
      }
      const parsed = parseEditorialValues(values);
      const contentLocale = parsed.contentLocale ?? "en";
      const sourceLocale = existing.sourceLocale ?? "en";
      const content = {
        ...(existing.content ?? {
          [sourceLocale]: { body: existing.body, title: existing.title },
        }),
        [contentLocale]: { body: parsed.body, title: parsed.title },
      };
      const record: EditorialRecord = {
        ...existing,
        content,
        published: parsed.published,
        sourceLocale,
        ...(contentLocale === sourceLocale
          ? { body: parsed.body, title: parsed.title }
          : {}),
      };
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
