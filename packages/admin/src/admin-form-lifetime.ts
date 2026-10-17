import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";

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

const FormNavigationLifetimeContext = createContext<(() => boolean) | null>(
  null
);

/** A logical screen survives its own refresh, but never a scope change/unmount. */
export const AdminFormNavigationLifetime = ({
  children,
}: {
  children: ReactNode;
}) => {
  const isAlive = useAdminFormLifetime();
  return createElement(
    FormNavigationLifetimeContext.Provider,
    { value: isAlive },
    children
  );
};
export const useAdminFormNavigationLifetime = () =>
  useContext(FormNavigationLifetimeContext);
