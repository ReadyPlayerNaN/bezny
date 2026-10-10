import type { Root } from "@radix-ui/react-select";
import {
  Trigger,
  Icon as SelectIcon,
  Portal,
  Content,
  Viewport,
  Item,
  ItemText,
  ItemIndicator,
  Label,
  Separator,
  ScrollUpButton,
  ScrollDownButton,
} from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useId } from "react";
import type { ComponentPropsWithRef } from "react";

import { Icon } from "../content/icon.js";

import styles from "./select.module.scss";

export {
  Root as Select,
  Value as SelectValue,
  Group as SelectGroup,
} from "@radix-ui/react-select";
export type SelectProps = ComponentPropsWithRef<typeof Root>;
export const SelectTrigger = ({
  children,
  className,
  id,
  ...props
}: ComponentPropsWithRef<typeof Trigger>) => {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  return (
    <Trigger
      {...props}
      id={triggerId}
      className={[styles.trigger, className].filter(Boolean).join(" ")}
    >
      {children}
      <SelectIcon>
        <Icon
          icon={ChevronDown}
          aria-labelledby={props["aria-labelledby"] ?? triggerId}
          aria-hidden="true"
          className={styles.icon}
        />
      </SelectIcon>
    </Trigger>
  );
};
export type SelectContentProps = Omit<
  ComponentPropsWithRef<typeof Content>,
  "asChild"
> & { container?: ComponentPropsWithRef<typeof Portal>["container"] };
export const SelectContent = ({
  children,
  className,
  container,
  position = "popper",
  ...props
}: SelectContentProps) => (
  <Portal
    {...(container ? { container } : {})}
    {...(props.forceMount ? { forceMount: true as const } : {})}
  >
    <Content
      {...props}
      position={position}
      className={[styles.content, className].filter(Boolean).join(" ")}
    >
      <ScrollUpButton className={styles.scroll}>
        <Icon icon={ChevronUp} aria-label="Scroll up" className={styles.icon} />
      </ScrollUpButton>
      <Viewport className={styles.viewport}>{children}</Viewport>
      <ScrollDownButton className={styles.scroll}>
        <Icon
          icon={ChevronDown}
          aria-label="Scroll down"
          className={styles.icon}
        />
      </ScrollDownButton>
    </Content>
  </Portal>
);
export const SelectItem = ({
  children,
  className,
  ...props
}: Omit<ComponentPropsWithRef<typeof Item>, "asChild">) => {
  const labelId = useId();
  return (
    <Item
      {...props}
      className={[styles.item, className].filter(Boolean).join(" ")}
    >
      <ItemIndicator>
        <Icon
          icon={Check}
          aria-labelledby={labelId}
          aria-hidden="true"
          className={styles.icon}
        />
      </ItemIndicator>
      <ItemText id={labelId}>{children}</ItemText>
    </Item>
  );
};
export const SelectLabel = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof Label>) => (
  <Label
    {...props}
    className={[styles.label, className].filter(Boolean).join(" ")}
  />
);
export const SelectSeparator = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof Separator>) => (
  <Separator
    {...props}
    className={[styles.separator, className].filter(Boolean).join(" ")}
  />
);
