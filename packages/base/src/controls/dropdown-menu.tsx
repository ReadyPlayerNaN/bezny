import {
  Content,
  Portal,
  Item,
  CheckboxItem,
  RadioItem,
  ItemIndicator,
  SubTrigger,
  SubContent,
  Label,
  Separator,
} from "@radix-ui/react-dropdown-menu";
import { Check, Minus, ChevronRight } from "lucide-react";
import { useId } from "react";
import type { ComponentPropsWithRef } from "react";

import { Icon } from "../content/icon.js";

import styles from "./dropdown-menu.module.scss";

export {
  Root as DropdownMenu,
  Trigger as DropdownMenuTrigger,
  Group as DropdownMenuGroup,
  RadioGroup as DropdownMenuRadioGroup,
  Sub as DropdownMenuSub,
} from "@radix-ui/react-dropdown-menu";
export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuGroupProps,
  DropdownMenuRadioGroupProps,
  DropdownMenuSubProps,
} from "@radix-ui/react-dropdown-menu";
interface PortalContainer {
  container?: ComponentPropsWithRef<typeof Portal>["container"];
}
export type DropdownMenuContentProps = ComponentPropsWithRef<typeof Content> &
  PortalContainer;
export const DropdownMenuContent = ({
  container,
  className,
  ...props
}: DropdownMenuContentProps) => (
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
export type DropdownMenuSubContentProps = ComponentPropsWithRef<
  typeof SubContent
> &
  PortalContainer;
export const DropdownMenuSubContent = ({
  container,
  className,
  ...props
}: DropdownMenuSubContentProps) => (
  <Portal
    {...(container ? { container } : {})}
    {...(props.forceMount ? { forceMount: true as const } : {})}
  >
    <SubContent
      {...props}
      className={[styles.content, className].filter(Boolean).join(" ")}
    />
  </Portal>
);
export type DropdownMenuItemProps = ComponentPropsWithRef<typeof Item> & {
  tone?: "critical" | "secondary";
};
export const DropdownMenuItem = ({
  className,
  tone,
  ...props
}: DropdownMenuItemProps) => (
  <Item
    {...props}
    data-tone={tone}
    className={[styles.item, className].filter(Boolean).join(" ")}
  />
);
export type DropdownMenuItemIndicatorProps = ComponentPropsWithRef<
  typeof ItemIndicator
>;
export const DropdownMenuItemIndicator = ({
  className,
  ...props
}: DropdownMenuItemIndicatorProps) => (
  <ItemIndicator
    aria-hidden="true"
    {...props}
    className={[styles.indicator, className].filter(Boolean).join(" ")}
  />
);
export type DropdownMenuCheckboxItemProps = ComponentPropsWithRef<
  typeof CheckboxItem
>;
export const DropdownMenuCheckboxItem = ({
  children,
  className,
  asChild,
  ...props
}: DropdownMenuCheckboxItemProps) => {
  const labelId = useId();
  return (
    <CheckboxItem
      {...props}
      {...(asChild === undefined ? {} : { asChild })}
      className={[styles.item, styles.selectionItem, className]
        .filter(Boolean)
        .join(" ")}
    >
      {asChild ? (
        children
      ) : (
        <>
          <DropdownMenuItemIndicator>
            <Icon
              icon={props.checked === "indeterminate" ? Minus : Check}
              aria-labelledby={labelId}
              aria-hidden="true"
              className={styles.icon}
            />
          </DropdownMenuItemIndicator>
          <span id={labelId}>{children}</span>
        </>
      )}
    </CheckboxItem>
  );
};
export type DropdownMenuRadioItemProps = ComponentPropsWithRef<
  typeof RadioItem
>;
export const DropdownMenuRadioItem = ({
  children,
  className,
  asChild,
  ...props
}: DropdownMenuRadioItemProps) => {
  const labelId = useId();
  return (
    <RadioItem
      {...props}
      {...(asChild === undefined ? {} : { asChild })}
      className={[styles.item, styles.selectionItem, className]
        .filter(Boolean)
        .join(" ")}
    >
      {asChild ? (
        children
      ) : (
        <>
          <DropdownMenuItemIndicator>
            <Icon
              icon={Check}
              aria-labelledby={labelId}
              aria-hidden="true"
              className={styles.icon}
            />
          </DropdownMenuItemIndicator>
          <span id={labelId}>{children}</span>
        </>
      )}
    </RadioItem>
  );
};
export type DropdownMenuSubTriggerProps = ComponentPropsWithRef<
  typeof SubTrigger
>;
export const DropdownMenuSubTrigger = ({
  children,
  className,
  asChild,
  ...props
}: DropdownMenuSubTriggerProps) => {
  const labelId = useId();
  return (
    <SubTrigger
      {...props}
      {...(asChild === undefined ? {} : { asChild })}
      className={[styles.item, className].filter(Boolean).join(" ")}
    >
      {asChild ? (
        children
      ) : (
        <>
          <span id={labelId}>{children}</span>
          <Icon
            icon={ChevronRight}
            aria-labelledby={labelId}
            aria-hidden="true"
            className={[styles.icon, styles.chevron].join(" ")}
          />
        </>
      )}
    </SubTrigger>
  );
};
export type DropdownMenuLabelProps = ComponentPropsWithRef<typeof Label>;
export const DropdownMenuLabel = ({
  className,
  ...props
}: DropdownMenuLabelProps) => (
  <Label
    {...props}
    className={[styles.label, className].filter(Boolean).join(" ")}
  />
);
export type DropdownMenuSeparatorProps = ComponentPropsWithRef<
  typeof Separator
>;
export const DropdownMenuSeparator = ({
  className,
  ...props
}: DropdownMenuSeparatorProps) => (
  <Separator
    {...props}
    className={[styles.separator, className].filter(Boolean).join(" ")}
  />
);
