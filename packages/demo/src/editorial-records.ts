import { isEditorialContentLocale } from "./editorial-content.js";
import type {
  EditorialContentLocale,
  EditorialContentTranslations,
} from "./editorial-content.js";

export interface EditorialRecord {
  id: string;
  title: string;
  body: string;
  published: boolean;
  sourceLocale?: EditorialContentLocale;
  content?: EditorialContentTranslations;
}
export interface EditorialValues {
  title: string;
  body: string;
  published: boolean;
  contentLocale?: EditorialContentLocale;
}
export const editorialTextLimits = { body: 10_000, title: 200 };
export const editorialResources = [
  { key: "articles", label: "Articles", singularLabel: "Article" },
  { key: "pages", label: "Pages", singularLabel: "Page" },
];
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
  const contentLocale = "contentLocale" in value ? value.contentLocale : "en";
  if (!isEditorialContentLocale(contentLocale)) {
    throw new TypeError("Unsupported content language.");
  }
  return { body, contentLocale, published: value.published, title };
};
export interface EditorialNotice {
  key: "created" | "updated" | "deleted";
  entity: string;
  count: number;
}
