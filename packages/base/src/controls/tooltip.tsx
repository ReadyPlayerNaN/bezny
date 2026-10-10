import { Content, Portal, Arrow } from "@radix-ui/react-tooltip";
import type { ComponentPropsWithRef } from "react";

import styles from "./tooltip.module.scss";

export {
  Root as Tooltip,
  Provider as TooltipProvider,
  Trigger as TooltipTrigger,
} from "@radix-ui/react-tooltip";
export type TooltipContentProps = Omit<
  ComponentPropsWithRef<typeof Content>,
  "asChild"
> & { container?: ComponentPropsWithRef<typeof Portal>["container"] };
export const TooltipContent = ({
  children,
  className,
  container,
  ...props
}: TooltipContentProps) => (
  <Portal
    {...(container ? { container } : {})}
    {...(props.forceMount ? { forceMount: true as const } : {})}
  >
    <Content
      {...props}
      className={[styles.content, className].filter(Boolean).join(" ")}
    >
      {children}
      <Arrow className={styles.arrow} />
    </Content>
  </Portal>
);
