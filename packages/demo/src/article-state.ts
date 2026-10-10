import { atom } from "jotai";

export interface Article {
  id: string;
  title: string;
  body: string;
  published: boolean;
}

export type ArticleValues = Omit<Article, "id">;

export const articlesAtom = atom<Article[]>([
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
]);
export const nextArticleIdAtom = atom(4);
export const selectedArticleIdsAtom = atom<string[]>([]);
export const noticeAtom = atom("");

export interface DeletionRequest {
  ids: string[];
  returnFocus: HTMLElement | null;
}
export const deletionRequestAtom = atom<DeletionRequest | null>(null);

export type ArticleContext =
  | { kind: "collection"; entity: "articles" }
  | { kind: "entity"; entity: "articles"; id: string }
  | { kind: "selection"; entity: "articles"; ids: string[] }
  | { kind: "unavailable"; entity: "articles" };

export const normalizeArticlePathname = (pathname: string): string =>
  pathname.replace(/\/+$/u, "") || "/";

export const resolveArticleContext = (
  pathname: string,
  articles: Article[],
  selectedIds: string[]
): ArticleContext => {
  const path = normalizeArticlePathname(pathname);
  if (path === "/articles") {
    const ids = selectedIds.filter((id) =>
      articles.some((article) => article.id === id)
    );
    return ids.length > 0
      ? { entity: "articles", ids, kind: "selection" }
      : { entity: "articles", kind: "collection" };
  }
  if (path === "/articles/create") {
    return { entity: "articles", kind: "collection" };
  }
  const [, collection, id, operation, ...remaining] = path.split("/");
  const isEntityPage =
    collection === "articles" &&
    (operation === undefined || operation === "edit") &&
    remaining.length === 0;
  if (isEntityPage && id && articles.some((article) => article.id === id)) {
    return { entity: "articles", id, kind: "entity" };
  }
  return { entity: "articles", kind: "unavailable" };
};

export const describeArticleContext = (context: ArticleContext): string => {
  switch (context.kind) {
    case "collection": {
      return "Articles";
    }
    case "entity": {
      return `Article ${context.id}`;
    }
    case "selection": {
      return `Selected articles: ${context.ids.join(", ")}`;
    }
    default: {
      return "No available article";
    }
  }
};
