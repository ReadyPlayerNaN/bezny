import type { ComponentPropsWithRef } from "react";

import styles from "./filter.module.scss";

export type FilterBadgeProps = Omit<
  ComponentPropsWithRef<"button">,
  "children" | "type"
> & { label: string; selected: boolean };
export const FilterBadge = ({
  label,
  selected,
  className,
  ...props
}: FilterBadgeProps) => (
  <button
    {...props}
    type="button"
    data-selected={selected}
    aria-pressed={props["aria-haspopup"] ? undefined : selected}
    className={[styles.badge, className].filter(Boolean).join(" ")}
  >
    {label}
  </button>
);
