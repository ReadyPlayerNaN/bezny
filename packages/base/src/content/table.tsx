import type { ComponentPropsWithRef } from "react";

import { Skeleton } from "./skeleton.js";

import styles from "./table.module.scss";

export type TableProps = ComponentPropsWithRef<"table">;
export const Table = ({ className, ...props }: TableProps) => (
  <table
    {...props}
    className={[styles.table, className].filter(Boolean).join(" ")}
  />
);

export type TableCaptionProps = ComponentPropsWithRef<"caption">;
export const TableCaption = ({ className, ...props }: TableCaptionProps) => (
  <caption
    {...props}
    className={[styles.caption, className].filter(Boolean).join(" ")}
  />
);

export type TableHeadProps = ComponentPropsWithRef<"thead">;
export const TableHead = ({ className, ...props }: TableHeadProps) => (
  <thead
    {...props}
    className={[styles.head, className].filter(Boolean).join(" ")}
  />
);

export type TableBodyProps = ComponentPropsWithRef<"tbody">;
export const TableBody = (props: TableBodyProps) => <tbody {...props} />;

export type TableFootProps = ComponentPropsWithRef<"tfoot">;
export const TableFoot = ({ className, ...props }: TableFootProps) => (
  <tfoot
    {...props}
    className={[styles.foot, className].filter(Boolean).join(" ")}
  />
);

export type TableRowProps = ComponentPropsWithRef<"tr">;
export const TableRow = ({ className, ...props }: TableRowProps) => (
  <tr
    {...props}
    className={[styles.row, className].filter(Boolean).join(" ")}
  />
);

export type TableHeaderCellProps = ComponentPropsWithRef<"th"> & {
  numeric?: boolean;
};
export const TableHeaderCell = ({
  className,
  scope = "col",
  numeric = false,
  ...props
}: TableHeaderCellProps) => (
  <th
    {...props}
    scope={scope}
    data-numeric={numeric || undefined}
    className={[styles.cell, styles.headerCell, className]
      .filter(Boolean)
      .join(" ")}
  />
);

export type TableCellProps = ComponentPropsWithRef<"td"> & {
  numeric?: boolean;
};
export const TableCell = ({
  className,
  numeric = false,
  ...props
}: TableCellProps) => (
  <td
    {...props}
    data-numeric={numeric || undefined}
    className={[styles.cell, className].filter(Boolean).join(" ")}
  />
);

export type TableScrollAreaProps = Omit<
  ComponentPropsWithRef<"section">,
  "role" | "tabIndex"
> & {
  label: string;
};

/** Named, keyboard-scrollable region. The table retains native semantics. */
export const TableScrollArea = ({
  label,
  className,
  ...props
}: TableScrollAreaProps) => (
  <section
    {...props}
    aria-label={label}
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Native overflow regions need a tab stop for keyboard scrolling.
    tabIndex={0}
    className={[styles.scrollArea, className].filter(Boolean).join(" ")}
  />
);

export type TableSkeletonRowProps = Omit<
  TableRowProps,
  "children" | "dangerouslySetInnerHTML" | "tabIndex"
> & {
  columns: number;
};

/** Decorative cells; announce loading outside the busy table once per resource. */
export const TableSkeletonRow = ({
  columns,
  ...props
}: TableSkeletonRowProps) => {
  if (!Number.isInteger(columns) || columns < 1) {
    throw new RangeError(
      "TableSkeletonRow columns must be a positive integer."
    );
  }
  return (
    <TableRow {...props} aria-hidden="true" inert>
      {Array.from({ length: columns }, (_, index) => (
        // oxlint-disable-next-line react/no-array-index-key, react-doctor/no-array-index-as-key -- Stateless placeholder cells have no record identity.
        <TableCell key={index}>
          <Skeleton />
        </TableCell>
      ))}
    </TableRow>
  );
};
