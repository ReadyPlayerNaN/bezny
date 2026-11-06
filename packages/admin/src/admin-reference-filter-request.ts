import { useEffect, useMemo, useState } from "react";

import type {
  AdminFilterReference,
  AdminReferenceFilterScope,
} from "./admin-reference-filter-model.js";

/** A popup-sized request, never a second collection owner or unbounded cache. */
export const useAdminReferenceRequest = ({
  enabled,
  load,
  scope,
  delay = 0,
}: {
  enabled: boolean;
  load: (signal: AbortSignal) => Promise<readonly AdminFilterReference[]>;
  scope: AdminReferenceFilterScope;
  delay?: number;
}) => {
  const [revision, setRevision] = useState(0);
  const request = useMemo(
    () => ({ delay, enabled, load, revision, scope }),
    [enabled, load, scope, delay, revision]
  );
  const [result, setResult] = useState<{
    request: typeof request;
    options: readonly AdminFilterReference[];
    failed: boolean;
  } | null>(null);
  useEffect(() => {
    if (!request.enabled || !request.scope.isCurrent()) {
      return;
    }
    const controller = new AbortController();
    const execute = async () => {
      try {
        const options = await request.load(controller.signal);
        if (!controller.signal.aborted && request.scope.isCurrent()) {
          setResult({ failed: false, options, request });
        }
      } catch {
        if (!controller.signal.aborted && request.scope.isCurrent()) {
          setResult({ failed: true, options: [], request });
        }
      }
    };
    const timer = setTimeout(() => {
      void execute();
    }, request.delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [request]);
  const matching = enabled && result?.request === request ? result : null;
  return {
    failed: Boolean(
      scope.isCurrent() &&
      result?.failed &&
      result.request.load === load &&
      result.request.scope === scope
    ),
    options: matching?.options ?? [],
    pending: enabled && !matching,
    retry: () => setRevision((value) => value + 1),
  };
};
