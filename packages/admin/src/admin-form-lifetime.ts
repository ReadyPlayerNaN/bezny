import { useCallback, useEffect, useRef } from "react";

/** Imperative lifetime for event/async handlers, not rendered or domain state. */
export const useAdminFormLifetime = () => {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return useCallback(() => mounted.current, []);
};
