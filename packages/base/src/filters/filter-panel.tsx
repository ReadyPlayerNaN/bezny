import { Root, Trigger, Content, Portal } from "@radix-ui/react-popover";
import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import { FilterBadge } from "./filter-badge.js";

import styles from "./filter.module.scss";

export interface FilterPanelProps {
  label: string;
  selected: boolean;
  autoOpen?: boolean;
  disabled?: boolean;
  container?: ComponentProps<typeof Portal>["container"];
  suppressReturnFocus?: boolean;
  children: (close: () => void) => ReactNode;
}
export const FilterPanel = ({
  label,
  selected,
  autoOpen = false,
  disabled = false,
  container,
  suppressReturnFocus = false,
  children,
}: FilterPanelProps) => {
  const [open, setOpen] = useState(autoOpen);
  const [wasAutoOpen, setWasAutoOpen] = useState(autoOpen);
  if (autoOpen !== wasAutoOpen) {
    setWasAutoOpen(autoOpen);
    if (autoOpen) {
      setOpen(true);
    }
  }
  return (
    <Root open={open} onOpenChange={setOpen}>
      <Trigger asChild>
        <FilterBadge label={label} selected={selected} disabled={disabled} />
      </Trigger>
      <Portal {...(container ? { container } : {})}>
        <Content
          className={styles.panel}
          align="start"
          aria-label={`${label} filter`}
          onCloseAutoFocus={(event) => {
            if (suppressReturnFocus) {
              event.preventDefault();
            }
          }}
        >
          {children(() => setOpen(false))}
        </Content>
      </Portal>
    </Root>
  );
};
