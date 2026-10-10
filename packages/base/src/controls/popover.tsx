import { Content, Portal, Arrow } from "@radix-ui/react-popover";
import type { ComponentPropsWithRef } from "react";

import styles from "./popover.module.scss";

export {
  Root as Popover,
  Trigger as PopoverTrigger,
  Anchor as PopoverAnchor,
  Close as PopoverClose,
} from "@radix-ui/react-popover";
export type {
  PopoverProps,
  PopoverTriggerProps,
  PopoverAnchorProps,
  PopoverCloseProps,
} from "@radix-ui/react-popover";
export type PopoverContentProps = ComponentPropsWithRef<typeof Content> & {
  container?: ComponentPropsWithRef<typeof Portal>["container"];
};
export const PopoverContent = ({
  container,
  className,
  ...props
}: PopoverContentProps) => (
  <Portal
    {...(container ? { container } : {})}
    {...(props.forceMount ? { forceMount: true as const } : {})}
  >
    <Content
      {...props}
      className={[styles.content, className].filter(Boolean).join(" ")}
    />
  </Portal>
);
export type PopoverArrowProps = ComponentPropsWithRef<typeof Arrow>;
export const PopoverArrow = ({ className, ...props }: PopoverArrowProps) => (
  <Arrow
    {...props}
    className={[styles.arrow, className].filter(Boolean).join(" ")}
  />
);
