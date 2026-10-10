import {
  Content,
  Overlay,
  Portal,
  Title,
  Description,
} from "@radix-ui/react-dialog";
import type { ComponentPropsWithRef } from "react";

import styles from "./dialog.module.scss";

export {
  Root as Dialog,
  Trigger as DialogTrigger,
  Close as DialogClose,
} from "@radix-ui/react-dialog";
export type DialogContentProps = ComponentPropsWithRef<typeof Content> & {
  container?: ComponentPropsWithRef<typeof Portal>["container"];
};
export const DialogContent = ({
  className,
  container,
  ...props
}: DialogContentProps) => (
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
export const DialogTitle = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof Title>) => (
  <Title
    {...props}
    className={[styles.title, className].filter(Boolean).join(" ")}
  />
);
export const DialogDescription = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof Description>) => (
  <Description
    {...props}
    className={[styles.description, className].filter(Boolean).join(" ")}
  />
);
