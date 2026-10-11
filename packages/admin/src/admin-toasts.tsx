import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@bezny/base";
import type {
  ToastProps,
  ToastProviderProps,
  ToastViewportProps,
} from "@bezny/base";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

export interface AdminToastMessage {
  title?: ReactNode;
  description: ReactNode;
  duration?: number;
  type?: ToastProps["type"];
}

export interface AdminToastOptions {
  duration?: ToastProviderProps["duration"];
  swipeDirection?: ToastProviderProps["swipeDirection"];
  hotkey?: ToastViewportProps["hotkey"];
  /** Accessible announcement prefix. */
  label?: string;
  /** Discoverable keyboard shortcut; Radix substitutes {hotkey}. */
  viewportLabel?: string;
  dismissLabel?: string;
}

export interface AdminToasts {
  publish: (message: AdminToastMessage) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const AdminToastContext = createContext<AdminToasts | null>(null);
const defaultToastOptions: AdminToastOptions = {};

/** App-root scoped notifications, independent of route lifetimes. */
export const AdminToastProvider = ({
  children,
  options = defaultToastOptions,
}: {
  children: ReactNode;
  options?: AdminToastOptions | undefined;
}) => {
  const [messages, setMessages] = useState<
    readonly (AdminToastMessage & { id: string })[]
  >([]);
  const prefix = useId();
  const sequence = useRef(0);
  const publish = useCallback(
    (message: AdminToastMessage): string => {
      sequence.current += 1;
      const id = `${prefix}-${sequence.current}`;
      setMessages((current) => [...current, { ...message, id }]);
      return id;
    },
    [prefix]
  );
  const dismiss = useCallback((id: string): void => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);
  const clear = useCallback((): void => {
    setMessages([]);
  }, []);
  const notifications = useMemo(
    () => ({ clear, dismiss, publish }),
    [publish, dismiss, clear]
  );
  return (
    <AdminToastContext.Provider value={notifications}>
      <ToastProvider
        duration={options.duration ?? 5000}
        swipeDirection={options.swipeDirection ?? "right"}
        label={options.label ?? "Notification"}
      >
        {children}
        {messages.map(({ id, title, description, duration, type }) => (
          <Toast
            key={id}
            open
            onOpenChange={(open) => {
              if (!open) {
                dismiss(id);
              }
            }}
            {...(duration === undefined ? {} : { duration })}
            {...(type === undefined ? {} : { type })}
          >
            {title !== undefined && <ToastTitle>{title}</ToastTitle>}
            <ToastDescription>{description}</ToastDescription>
            <ToastClose>{options.dismissLabel ?? "Dismiss"}</ToastClose>
          </Toast>
        ))}
        <ToastViewport
          label={options.viewportLabel ?? "Notifications ({hotkey})"}
          {...(options.hotkey === undefined ? {} : { hotkey: options.hotkey })}
        />
      </ToastProvider>
    </AdminToastContext.Provider>
  );
};

export const useAdminToasts = (): AdminToasts => {
  const notifications = useContext(AdminToastContext);
  if (!notifications) {
    throw new Error(
      "useAdminToasts requires an AdminProvider or AdminToastProvider."
    );
  }
  return notifications;
};
