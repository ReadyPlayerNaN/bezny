import { atom } from "jotai";

export interface EditorialRecord {
  id: string;
  title: string;
  body: string;
  published: boolean;
}
export type EditorialValues = Omit<EditorialRecord, "id">;
export const articlesAtom = atom<EditorialRecord[]>([
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
export const pagesAtom = atom<EditorialRecord[]>([
  {
    body: "Learn about our publication.",
    id: "1",
    published: true,
    title: "About us",
  },
]);
export const editorialResources = [
  {
    key: "articles",
    label: "Articles",
    nextId: atom(4),
    records: articlesAtom,
    singularLabel: "Article",
  },
  {
    key: "pages",
    label: "Pages",
    nextId: atom(2),
    records: pagesAtom,
    singularLabel: "Page",
  },
];
export const noticeAtom = atom("");
export interface DeletionRequest {
  entity: string;
  ids: readonly string[];
  returnFocus: HTMLElement | null;
}
export const deletionRequestAtom = atom<DeletionRequest | null>(null);
