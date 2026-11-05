import {
  Root,
  Item,
  Header,
  Trigger,
  Content,
} from "@radix-ui/react-accordion";
import type { ComponentPropsWithRef } from "react";

import styles from "./accordion.module.scss";

export type AccordionProps = ComponentPropsWithRef<typeof Root>;
export type AccordionItemProps = ComponentPropsWithRef<typeof Item>;
export type AccordionHeaderProps = ComponentPropsWithRef<typeof Header>;
export type AccordionTriggerProps = ComponentPropsWithRef<typeof Trigger>;
export type AccordionContentProps = ComponentPropsWithRef<typeof Content>;

export const Accordion = ({ className, ...props }: AccordionProps) => (
  <Root
    {...props}
    className={[styles.root, className].filter(Boolean).join(" ")}
  />
);
export const AccordionItem = ({ className, ...props }: AccordionItemProps) => (
  <Item
    {...props}
    className={[styles.item, className].filter(Boolean).join(" ")}
  />
);
export const AccordionHeader = ({
  className,
  ...props
}: AccordionHeaderProps) => (
  <Header
    {...props}
    className={[styles.header, className].filter(Boolean).join(" ")}
  />
);
export const AccordionTrigger = ({
  className,
  children,
  asChild,
  ...props
}: AccordionTriggerProps) => (
  <Trigger
    {...props}
    asChild={asChild}
    className={[styles.trigger, className].filter(Boolean).join(" ")}
  >
    {asChild ? (
      children
    ) : (
      <>
        {children}
        <span aria-hidden="true" className={styles.indicator} />
      </>
    )}
  </Trigger>
);
/** forceMount retains closed form bodies; the stylesheet removes closed content from layout and focus navigation. */
export const AccordionContent = ({
  className,
  ...props
}: AccordionContentProps) => (
  <Content
    {...props}
    className={[styles.content, className].filter(Boolean).join(" ")}
  />
);
