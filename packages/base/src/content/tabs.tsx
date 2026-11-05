import { Root, List, Trigger, Content } from "@radix-ui/react-tabs";
import type { ComponentPropsWithRef } from "react";

import styles from "./tabs.module.scss";

export type TabsProps = ComponentPropsWithRef<typeof Root>;
export type TabsListProps = ComponentPropsWithRef<typeof List>;
export type TabsTriggerProps = ComponentPropsWithRef<typeof Trigger>;
export type TabsContentProps = ComponentPropsWithRef<typeof Content>;
export const Tabs = ({ className, ...props }: TabsProps) => (
  <Root
    {...props}
    className={[styles.root, className].filter(Boolean).join(" ")}
  />
);
export const TabsList = ({ className, ...props }: TabsListProps) => (
  <List
    {...props}
    className={[styles.list, className].filter(Boolean).join(" ")}
  />
);
export const TabsTrigger = ({ className, ...props }: TabsTriggerProps) => (
  <Trigger
    {...props}
    className={[styles.trigger, className].filter(Boolean).join(" ")}
  />
);
/** With forceMount, inactive panels remain mounted but hidden by the package stylesheet. */
export const TabsContent = ({ className, ...props }: TabsContentProps) => (
  <Content
    {...props}
    className={[styles.content, className].filter(Boolean).join(" ")}
  />
);
