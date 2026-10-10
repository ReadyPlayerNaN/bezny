import { createInstance } from "i18next";

export const editorialContentLocales = ["en", "cs", "ar"] as const;
export type EditorialContentLocale = (typeof editorialContentLocales)[number];
export interface EditorialContent {
  title: string;
  body: string;
}
export type EditorialContentTranslations = Partial<
  Record<EditorialContentLocale, EditorialContent>
>;
export const isEditorialContentLocale = (
  value: unknown
): value is EditorialContentLocale =>
  value === "en" || value === "cs" || value === "ar";

/** Content resources are per-record and ephemeral, never added to the long-lived UI resource store. */
export const readEditorialContent = async (
  record: {
    title: string;
    body: string;
    content?: EditorialContentTranslations;
    sourceLocale?: EditorialContentLocale;
  },
  locale: string
): Promise<EditorialContent> => {
  const sourceLocale = record.sourceLocale ?? "en";
  const translations = record.content ?? {
    [sourceLocale]: { body: record.body, title: record.title },
  };
  const resources = Object.fromEntries(
    Object.entries(translations).map(([language, content]) => [
      language,
      { content },
    ])
  );
  const instance = createInstance();
  await instance.init({
    defaultNS: "content",
    fallbackLng: ["en", sourceLocale],
    initAsync: false,
    interpolation: { escapeValue: false },
    lng: locale,
    resources,
  });
  return {
    body: instance.t("body", { skipInterpolation: true }),
    title: instance.t("title", { skipInterpolation: true }),
  };
};
