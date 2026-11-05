import type { ComponentPropsWithRef } from "react";

import type { EntityRowVariant } from "./entity-row-title.js";
import { LoadingSkeleton, Skeleton } from "./skeleton.js";

import styles from "./entity-row.module.scss";

export type EntityRowSkeletonProps = Omit<
  ComponentPropsWithRef<"div">,
  "children" | "dangerouslySetInnerHTML" | "tabIndex"
> & {
  variant?: EntityRowVariant;
  leading?: boolean;
  description?: boolean;
};

/** Uses the real row's geometry without fake links, selection, or menus. */
export const EntityRowSkeleton = ({
  className,
  variant = "default",
  leading = false,
  description = true,
  ...props
}: EntityRowSkeletonProps) => (
  <div
    {...props}
    aria-hidden="true"
    inert
    className={[styles.row, className].filter(Boolean).join(" ")}
    data-variant={variant}
  >
    {leading && <Skeleton variant="circle" />}
    <div className={styles.main}>
      <Skeleton variant={variant === "small" ? "text" : "heading"} />
      {description && <Skeleton />}
    </div>
  </div>
);

export interface EntityRowListSkeletonProps {
  label: string;
  rows?: number;
  variant?: EntityRowVariant;
  leading?: boolean;
  description?: boolean;
}

export const EntityRowListSkeleton = ({
  label,
  rows = 3,
  ...rowProps
}: EntityRowListSkeletonProps) => {
  if (!Number.isInteger(rows) || rows < 1) {
    throw new RangeError(
      "EntityRowListSkeleton rows must be a positive integer."
    );
  }
  return (
    <LoadingSkeleton label={label}>
      <div className={styles.list}>
        {Array.from({ length: rows }, (_, index) => (
          // oxlint-disable-next-line react/no-array-index-key, react-doctor/no-array-index-as-key -- Static, stateless placeholders have no record identity.
          <EntityRowSkeleton key={index} {...rowProps} />
        ))}
      </div>
    </LoadingSkeleton>
  );
};
