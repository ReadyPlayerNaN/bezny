import { useAdminListControls } from "@bezny/admin/list";
import { ChoiceFilter, ValueFilter, Button } from "@bezny/base";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const EditorialListControls = () => {
  const { t, i18n } = useTranslation("editorial");
  const language = i18n.resolvedLanguage;
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(language, {
        numberingSystem: language === "ar" ? "arab" : undefined,
      }),
    [language]
  );
  const { filterCommands, paginationCommands, clear, query, pageCount, total } =
    useAdminListControls();
  return (
    <section aria-label={t("controls")}>
      <div>
        {filterCommands.map((command) => {
          const { input } = command;
          if (!input) {
            return null;
          }
          return input.options ? (
            <ChoiceFilter
              allLabel={t("all")}
              searchLabel={t("filterValues")}
              emptyLabel={t("noValues")}
              summarize={(label, labels) =>
                `${label}: ${labels.length ? labels.join(", ") : t("all")}`
              }
              key={command.id}
              label={input.label}
              value={input.value || null}
              options={input.options}
              onChange={(value) => {
                void input.execute(value ?? "");
              }}
            />
          ) : (
            <ValueFilter
              applyLabel={t("apply")}
              clearLabel={t("clear")}
              placeholder={t("filterValue")}
              summarize={(label, value) => `${label}: ${value || t("all")}`}
              maxLength={input.maxLength}
              key={command.id}
              label={input.label}
              value={input.value || null}
              onChange={(value) => {
                void input.execute(value ?? "");
              }}
            />
          );
        })}
        {clear && (
          <Button
            variant="secondary"
            onClick={() => {
              void clear.execute();
            }}
          >
            {clear.label}
          </Button>
        )}
      </div>
      <output aria-label={t("pagination")}>
        {t("pageSummary", {
          page: formatter.format(query.page),
          pages: pageCount === null ? "…" : formatter.format(pageCount),
          total: total === null ? "…" : formatter.format(total),
        })}
      </output>
      <div>
        {paginationCommands.map((command) =>
          command.input ? null : (
            <Button
              key={command.id}
              variant="secondary"
              onClick={() => {
                void command.execute();
              }}
            >
              {command.label}
            </Button>
          )
        )}
      </div>
    </section>
  );
};
