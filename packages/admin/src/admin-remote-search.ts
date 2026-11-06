import { atom } from "jotai";

export interface AdminSearchResult {
  id: string;
  label: string;
  /** Called only while the originating runtime scope remains active. */
  execute: () => void | Promise<void>;
  isAvailable?: () => boolean;
}
export interface AdminSearchSource {
  id: string;
  label: string;
  search: (request: {
    query: string;
    limit: number;
    locale: string;
    signal: AbortSignal;
  }) => Promise<readonly AdminSearchResult[]>;
}
export interface AdminSearchContext {
  sources: readonly AdminSearchSource[];
  signal: AbortSignal;
  locale: string;
}
export const adminSearchContextAtom = atom<AdminSearchContext | null>(null);
export const validateAdminSearchSources = (
  sources: readonly AdminSearchSource[]
) => {
  if (
    sources.length > 20 ||
    new Set(sources.map((source) => source.id)).size !== sources.length ||
    sources.some(
      (source) =>
        typeof source.id !== "string" ||
        !source.id ||
        source.id.length > 200 ||
        typeof source.label !== "string" ||
        !source.label ||
        source.label.length > 1000 ||
        typeof source.search !== "function"
    )
  ) {
    throw new Error("Invalid admin search sources.");
  }
  return Object.freeze(
    sources.map((source) =>
      Object.freeze({
        id: source.id,
        label: source.label,
        search: source.search.bind(source),
      })
    )
  );
};
export const validateAdminSearchResults = (
  results: readonly AdminSearchResult[]
) => {
  if (
    !Array.isArray(results) ||
    results.length > 20 ||
    new Set(results.map((result) => result.id)).size !== results.length ||
    results.some(
      (result) =>
        typeof result.id !== "string" ||
        !result.id ||
        result.id.length > 200 ||
        typeof result.label !== "string" ||
        !result.label ||
        result.label.length > 1000 ||
        typeof result.execute !== "function"
    )
  ) {
    throw new Error("Invalid admin search results.");
  }
  return results.map((result) => ({
    execute: result.execute.bind(result),
    id: result.id,
    label: result.label,
    ...(result.isAvailable
      ? { isAvailable: result.isAvailable.bind(result) }
      : {}),
  }));
};
