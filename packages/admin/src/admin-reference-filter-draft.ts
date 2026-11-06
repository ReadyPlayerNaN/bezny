import { useCallback, useState } from "react";

import { adminReferenceQueryLimit } from "./admin-reference-filter-model.js";
import type { AdminReferenceFilterScope } from "./admin-reference-filter-model.js";

/** Reset transient lookup state before rendering a new collection scope, preserving input focus. */
export const useAdminReferenceDraft = (scope: AdminReferenceFilterScope) => {
  const [draft, setDraft] = useState({
    composing: false,
    open: false,
    query: "",
    scope,
  });
  if (draft.scope !== scope) {
    setDraft({ composing: false, open: false, query: "", scope });
  }
  const handleOpenChange = useCallback((open: boolean) => {
    setDraft((current) =>
      current.open === open ? current : { ...current, open }
    );
  }, []);
  const handleQueryChange = (query: string) =>
    setDraft((current) => ({
      ...current,
      query: query.slice(0, adminReferenceQueryLimit),
    }));
  const handleCompositionStart = () =>
    setDraft((current) => ({ ...current, composing: true }));
  const handleCompositionEnd = () =>
    setDraft((current) => ({ ...current, composing: false }));
  return {
    ...draft,
    handleCompositionEnd,
    handleCompositionStart,
    handleOpenChange,
    handleQueryChange,
  };
};
