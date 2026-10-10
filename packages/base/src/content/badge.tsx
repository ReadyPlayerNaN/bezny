import type { ComponentPropsWithRef } from "react";

import styles from "./badge.module.scss";

export type BadgeType = "neutral" | "info" | "success" | "warning" | "critical";
export type BadgeProps = ComponentPropsWithRef<"span"> & { type?: BadgeType };
export const Badge = ({
  className,
  type = "neutral",
  ...props
}: BadgeProps) => (
  <span
    {...props}
    data-type={type}
    className={[styles.badge, className].filter(Boolean).join(" ")}
  />
);
