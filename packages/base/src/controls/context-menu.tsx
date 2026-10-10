import {
  Trigger,
  Portal,
  Content,
  Item,
  CheckboxItem,
  RadioItem,
  ItemIndicator,
  SubTrigger,
  SubContent,
  Label,
  Separator,
} from "@radix-ui/react-context-menu";
import { Check, Minus, ChevronRight } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

import { Icon } from "../content/icon.js";

import styles from "./context-menu.module.scss";

export {
  Root as ContextMenu,
  Group as ContextMenuGroup,
  RadioGroup as ContextMenuRadioGroup,
  Sub as ContextMenuSub,
} from "@radix-ui/react-context-menu";
export type ContextMenuTriggerProps = ComponentPropsWithRef<typeof Trigger>;
export const ContextMenuTrigger = ({
  onKeyDown,
  disabled = false,
  tabIndex = 0,
  ...props
}: ContextMenuTriggerProps) => (
  <Trigger
    {...props}
    disabled={disabled}
    tabIndex={tabIndex}
    onKeyDown={(event) => {
      onKeyDown?.(event);
      if (
        event.defaultPrevented ||
        disabled ||
        !(
          event.key === "ContextMenu" ||
          (event.shiftKey && event.key === "F10")
        )
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const bounds = event.currentTarget.getBoundingClientRect();
      event.currentTarget.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: bounds.left + bounds.width / 2,
          clientY: bounds.top + bounds.height / 2,
        })
      );
    }}
  />
);
interface PortalContainer {
  container?: ComponentPropsWithRef<typeof Portal>["container"];
}
export type ContextMenuContentProps = ComponentPropsWithRef<typeof Content> &
  PortalContainer;
export const ContextMenuContent = ({
  container,
  className,
  ...props
}: ContextMenuContentProps) => (
  <Portal {...(container ? { container } : {})}>
    <Content
      {...props}
      className={[styles.content, className].filter(Boolean).join(" ")}
    />
  </Portal>
);
export const ContextMenuSubContent = ({
  container,
  className,
  ...props
}: ComponentPropsWithRef<typeof SubContent> & PortalContainer) => (
  <Portal {...(container ? { container } : {})}>
    <SubContent
      {...props}
      className={[styles.content, className].filter(Boolean).join(" ")}
    />
  </Portal>
);
export type ContextMenuItemProps = ComponentPropsWithRef<typeof Item> & {
  tone?: "critical" | "secondary";
};
export const ContextMenuItem = ({
  className,
  tone,
  ...props
}: ContextMenuItemProps) => (
  <Item
    {...props}
    data-tone={tone}
    className={[styles.item, className].filter(Boolean).join(" ")}
  />
);
export const ContextMenuCheckboxItem = ({
  children,
  className,
  ...props
}: Omit<ComponentPropsWithRef<typeof CheckboxItem>, "asChild">) => (
  <CheckboxItem
    {...props}
    className={[styles.item, className].filter(Boolean).join(" ")}
  >
    <ItemIndicator>
      <Icon
        icon={props.checked === "indeterminate" ? Minus : Check}
        aria-hidden="true"
        className={styles.icon}
      />
    </ItemIndicator>
    {children}
  </CheckboxItem>
);
export const ContextMenuRadioItem = ({
  children,
  className,
  ...props
}: Omit<ComponentPropsWithRef<typeof RadioItem>, "asChild">) => (
  <RadioItem
    {...props}
    className={[styles.item, className].filter(Boolean).join(" ")}
  >
    <ItemIndicator>
      <Icon icon={Check} aria-hidden="true" className={styles.icon} />
    </ItemIndicator>
    {children}
  </RadioItem>
);
export const ContextMenuSubTrigger = ({
  children,
  className,
  ...props
}: Omit<ComponentPropsWithRef<typeof SubTrigger>, "asChild">) => (
  <SubTrigger
    {...props}
    className={[styles.item, className].filter(Boolean).join(" ")}
  >
    {children}
    <Icon icon={ChevronRight} aria-hidden="true" className={styles.icon} />
  </SubTrigger>
);
export const ContextMenuLabel = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof Label>) => (
  <Label
    {...props}
    className={[styles.label, className].filter(Boolean).join(" ")}
  />
);
export const ContextMenuSeparator = ({
  className,
  ...props
}: ComponentPropsWithRef<typeof Separator>) => (
  <Separator
    {...props}
    className={[styles.separator, className].filter(Boolean).join(" ")}
  />
);
