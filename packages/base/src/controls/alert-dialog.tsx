import {
  Content,
  Overlay,
  Portal,
  Title,
  Description,
} from "@radix-ui/react-alert-dialog";
import type { ComponentPropsWithRef } from "react";

import styles from "./dialog.module.scss";

export {
  Root as AlertDialog,
  Trigger as AlertDialogTrigger,
  Action as AlertDialogAction,
  Cancel as AlertDialogCancel,
} from "@radix-ui/react-alert-dialog";
export type AlertDialogContentProps = ComponentPropsWithRef<typeof Content> & {
  container?: ComponentPropsWithRef<typeof Portal>["container"];
};
export const AlertDialogContent = ({
  className,
  container,
  ...props
}: AlertDialogContentProps) => (
  <Portal
    {...(container ? { container } : {})}
    {...(props.forceMount ? { forceMount: true as const } : {})}
  >
    <Overlay className={styles.overlay} />
    <Content
      {...props}
      className={[styles.content, className].filter(Boolean).join(" ")}
    />
  </Portal>
);
export const AlertDialogTitle = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof Title>) => (
  <Title
    {...props}
    className={[styles.title, className].filter(Boolean).join(" ")}
  />
);
export const AlertDialogDescription = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof Description>) => (
  <Description
    {...props}
    className={[styles.description, className].filter(Boolean).join(" ")}
  />
);
