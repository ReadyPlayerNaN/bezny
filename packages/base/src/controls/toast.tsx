import {
  Root,
  Viewport,
  Title,
  Description,
  Action,
  Close,
} from "@radix-ui/react-toast";
import type { ComponentPropsWithRef } from "react";

import styles from "./toast.module.scss";

export { Provider as ToastProvider } from "@radix-ui/react-toast";
export type { ToastProviderProps } from "@radix-ui/react-toast";

export type ToastProps = ComponentPropsWithRef<typeof Root>;
export const Toast = ({ className, ...props }: ToastProps) => (
  <Root
    {...props}
    className={[styles.root, className].filter(Boolean).join(" ")}
  />
);

export type ToastViewportProps = ComponentPropsWithRef<typeof Viewport>;
export const ToastViewport = ({ className, ...props }: ToastViewportProps) => (
  <Viewport
    {...props}
    className={[styles.viewport, className].filter(Boolean).join(" ")}
  />
);

export type ToastTitleProps = ComponentPropsWithRef<typeof Title>;
export const ToastTitle = ({ className, ...props }: ToastTitleProps) => (
  <Title
    {...props}
    className={[styles.title, className].filter(Boolean).join(" ")}
  />
);

export type ToastDescriptionProps = ComponentPropsWithRef<typeof Description>;
export const ToastDescription = ({
  className,
  ...props
}: ToastDescriptionProps) => (
  <Description
    {...props}
    className={[styles.description, className].filter(Boolean).join(" ")}
  />
);

export type ToastActionProps = ComponentPropsWithRef<typeof Action>;
export const ToastAction = ({ className, ...props }: ToastActionProps) => (
  <Action
    {...props}
    className={[styles.button, className].filter(Boolean).join(" ")}
  />
);

export type ToastCloseProps = ComponentPropsWithRef<typeof Close>;
export const ToastClose = ({ className, ...props }: ToastCloseProps) => (
  <Close
    {...props}
    className={[styles.button, className].filter(Boolean).join(" ")}
  />
);
