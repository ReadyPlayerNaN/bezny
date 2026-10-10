import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import {
  articlesAtom,
  deletionRequestAtom,
  normalizeArticlePathname,
  resolveArticleContext,
  selectedArticleIdsAtom,
} from "./article-state.js";
import type { Article } from "./article-state.js";

export interface ArticleCommand {
  id: string;
  label: string;
  execute: () => void | Promise<void>;
  destructive?: boolean;
}

const useArticlePathname = () =>
  useRouterState({
    select: (state) => normalizeArticlePathname(state.location.pathname),
  });

export const useArticleContext = () => {
  const articles = useAtomValue(articlesAtom);
  const selectedIds = useAtomValue(selectedArticleIdsAtom);
  const pathname = useArticlePathname();
  return resolveArticleContext(pathname, articles, selectedIds);
};

/** The palette, rows, detail page, and toolbar all execute these definitions. */
export const useArticleCommands = () => {
  const navigate = useNavigate();
  const articles = useAtomValue(articlesAtom);
  const [selectedIds, setSelectedIds] = useAtom(selectedArticleIdsAtom);
  const requestDeletion = useSetAtom(deletionRequestAtom);
  const pathname = useArticlePathname();
  const context = useArticleContext();

  const list: ArticleCommand = {
    execute: async () => {
      await navigate({ to: "/articles" });
    },
    id: "articles.list",
    label: "List articles",
  };
  const create: ArticleCommand = {
    execute: async () => {
      await navigate({ to: "/articles/create" });
    },
    id: "articles.create",
    label: "Create article",
  };
  const deleteArticles = (ids: string[]) => {
    requestDeletion({
      ids,
      returnFocus:
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null,
    });
  };
  const forArticle = (article: Article): ArticleCommand[] => [
    {
      execute: async () => {
        await navigate({
          params: { articleId: article.id },
          to: "/articles/$articleId",
        });
      },
      id: `articles.${article.id}.read`,
      label: `View ${article.title}`,
    },
    {
      execute: async () => {
        await navigate({
          params: { articleId: article.id },
          to: "/articles/$articleId/edit",
        });
      },
      id: `articles.${article.id}.update`,
      label: `Edit ${article.title}`,
    },
    {
      destructive: true,
      execute: () => deleteArticles([article.id]),
      id: `articles.${article.id}.delete`,
      label: `Delete ${article.title}`,
    },
  ];
  const selectionCommands: ArticleCommand[] =
    context.kind === "selection"
      ? [
          {
            destructive: true,
            execute: () => deleteArticles(context.ids),
            id: "articles.selection.delete",
            label: "Delete selected articles",
          },
          {
            execute: () => setSelectedIds([]),
            id: "articles.selection.clear",
            label: "Clear selection",
          },
        ]
      : [];
  const forSelection = (article: Article): ArticleCommand => ({
    execute: () =>
      setSelectedIds((ids) =>
        ids.includes(article.id)
          ? ids.filter((id) => id !== article.id)
          : [...ids, article.id]
      ),
    id: `articles.${article.id}.select`,
    label: `${selectedIds.includes(article.id) ? "Deselect" : "Select"} ${article.title}`,
  });
  const currentArticle =
    context.kind === "entity"
      ? articles.find((article) => article.id === context.id)
      : undefined;
  let entityCommands: ArticleCommand[] = [];
  if (pathname === "/articles") {
    entityCommands = articles.flatMap(forArticle);
  } else if (currentArticle) {
    entityCommands = forArticle(currentArticle);
  }
  const cancelEditing: ArticleCommand = {
    ...list,
    id: "articles.form.cancel",
    label: "Cancel editing",
  };
  const formCommands: ArticleCommand[] =
    pathname === "/articles/create" ||
    (pathname.endsWith("/edit") && currentArticle)
      ? [
          {
            execute: () => {
              const form = document.querySelector("#article-form");
              if (form instanceof HTMLFormElement) {
                form.requestSubmit();
              }
            },
            id: "articles.form.save",
            label: "Save article",
          },
          cancelEditing,
        ]
      : [];

  return {
    cancelEditing,
    create,
    forArticle,
    forSelection,
    list,
    paletteCommands: [
      list,
      create,
      ...entityCommands,
      ...selectionCommands,
      ...(pathname === "/articles" ? articles.map(forSelection) : []),
      ...formCommands,
    ],
    selectionCommands,
  };
};
