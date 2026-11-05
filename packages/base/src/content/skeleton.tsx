import type { ComponentPropsWithRef, ReactNode } from "react";

import styles from "./skeleton.module.scss";

export type SkeletonProps = Omit<
  ComponentPropsWithRef<"span">,
  "children" | "dangerouslySetInnerHTML" | "tabIndex"
> & {
  variant?: "text" | "heading" | "circle" | "block";
};

/** Decorative only. Announce loading once at the resource boundary. */
export const Skeleton = ({
  className,
  variant = "text",
  ...props
}: SkeletonProps) => (
  <span
    {...props}
    aria-hidden="true"
    className={[styles.skeleton, className].filter(Boolean).join(" ")}
    data-variant={variant}
  />
);

export type LoadingSkeletonProps = Omit<
  ComponentPropsWithRef<"div">,
  "children" | "dangerouslySetInnerHTML" | "role"
> & {
  label: string;
  children: ReactNode;
};

/** Placeholder-only region: do not put real controls or data in its children. */
export const LoadingSkeleton = ({
  label,
  children,
  className,
  ...props
}: LoadingSkeletonProps) => (
  <div
    {...props}
    className={[styles.loading, className].filter(Boolean).join(" ")}
  >
    <output className={styles.label}>{label}</output>
    <div aria-hidden="true" className={styles.content} inert>
      {children}
    </div>
  </div>
);
