import { defineAdminEntity } from "@bezny/admin/adapters";
import type { AdminEntityDefinition } from "@bezny/admin/adapters";
import { Badge } from "@bezny/base";
import type { i18n } from "i18next";
import { createElement } from "react";

import {
  editorialContentLocales,
  isEditorialContentLocale,
  readEditorialContent,
} from "./editorial-content.js";
import type { EditorialRepository } from "./editorial-records.js";
import {
  editorialResources,
  editorialTextLimits,
  parseEditorialRecord,
  parseEditorialValues,
} from "./editorial-records.js";

const summaryCharacterLimit = 140;
const summaryWhitespace = /\s+/gu;
const editorialSummary = (body: string) => {
  const characters = [...body.replace(summaryWhitespace, " ").trim()];
  return characters.length > summaryCharacterLimit
    ? `${characters.slice(0, summaryCharacterLimit).join("").trimEnd()}…`
    : characters.join("");
};

/** All CRUD pages, fields, commands and confirmation UI come from registration. */
export const createEditorialEntities = (
  repository: EditorialRepository,
  translations: i18n
): AdminEntityDefinition[] => {
  const contentLocale = () =>
    isEditorialContentLocale(translations.resolvedLanguage)
      ? translations.resolvedLanguage
      : "en";
  return editorialResources.map((resource) =>
    defineAdminEntity({
      adapter: repository.adapter(resource.key),
      columns: [
        {
          key: "body",
          label: "Summary",
          labelKey: "editorial:summary",
          render: (data, view) => {
            const { body } = parseEditorialRecord(data);
            return view === "list" ? editorialSummary(body) : body;
          },
        },
        {
          key: "published",
          label: "Status",
          labelKey: "editorial:status",
          render: (data) => {
            const { published } = parseEditorialRecord(data);
            return createElement(
              Badge,
              { type: published ? "success" : "neutral" },
              translations.t(
                published ? "editorial:published" : "editorial:draft"
              )
            );
          },
        },
      ],
      filters: [
        { key: "search", label: "Search", labelKey: "editorial:search" },
        {
          key: "status",
          label: "Status",
          labelKey: "editorial:status",
          options: [
            { label: "Draft", labelKey: "editorial:draft", value: "draft" },
            {
              label: "Published",
              labelKey: "editorial:published",
              value: "published",
            },
          ],
        },
      ],
      form: {
        defaultValues: () => ({
          body: "",
          contentLocale: contentLocale(),
          published: false,
          title: "",
        }),
        fields: [
          {
            deriveValues: async (values, data) => {
              if (
                data === undefined ||
                !isEditorialContentLocale(values.contentLocale)
              ) {
                return {};
              }
              return await readEditorialContent(
                parseEditorialRecord(data),
                values.contentLocale
              );
            },
            key: "contentLocale",
            label: "Content language",
            labelKey: "editorial:contentLanguage",
            options: editorialContentLocales.map((locale) => ({
              label: locale,
              labelKey: `beznyAdmin:languages.${locale}`,
              value: locale,
            })),
            required: true,
            type: "select",
          },
          {
            key: "title",
            label: "Title",
            labelKey: "editorial:title",
            maxLength: editorialTextLimits.title,
            required: true,
          },
          {
            key: "body",
            label: "Body",
            labelKey: "editorial:body",
            maxLength: editorialTextLimits.body,
            required: true,
            type: "textarea",
          },
          {
            key: "published",
            label: "Published",
            labelKey: "editorial:published",
            type: "checkbox",
          },
        ],
        readValues: (data) => {
          const record = parseEditorialRecord(data);
          return {
            body: record.body,
            contentLocale: contentLocale(),
            published: record.published,
            title: record.title,
          };
        },
      },
      key: resource.key,
      label: resource.label,
      labelKey: `editorial:entities.${resource.key}.plural`,
      pageSize: 3,
      parseValues: parseEditorialValues,
      reference: (record) => ({ id: record.id, label: record.title }),
      singularLabel: resource.singularLabel,
      singularLabelKey: `editorial:entities.${resource.key}.singular`,
    })
  );
};
