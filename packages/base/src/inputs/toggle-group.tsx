import { Root, Item } from "@radix-ui/react-toggle-group";
import type { ComponentPropsWithRef } from "react";

import styles from "./toggle-group.module.scss";

export type ToggleGroupProps = ComponentPropsWithRef<typeof Root>;
export type ToggleGroupItemProps = ComponentPropsWithRef<typeof Item>;
export const ToggleGroup = ({ className, ...props }: ToggleGroupProps) => (
  <Root
    {...props}
    className={[styles.group, className].filter(Boolean).join(" ")}
  />
);
export const ToggleGroupItem = ({
  className,
  ...props
}: ToggleGroupItemProps) => (
  <Item
    {...props}
    className={[styles.item, className].filter(Boolean).join(" ")}
  />
);
