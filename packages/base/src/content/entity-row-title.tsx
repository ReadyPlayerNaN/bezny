import type { ComponentProps } from "react";

import { Heading } from "./heading.js";

import styles from "./entity-row.module.scss";

export type EntityRowVariant = "default" | "small";
export type EntityRowTitleProps = ComponentProps<typeof Heading> & {
  href?: string;
  variant?: EntityRowVariant;
};
export const EntityRowTitle = ({
  children,
  href,
  variant = "default",
  className,
  ...props
}: EntityRowTitleProps) => (
  <Heading
    {...props}
    data-variant={variant}
    className={[styles.title, className].filter(Boolean).join(" ")}
  >
    {href ? <a href={href}>{children}</a> : children}
  </Heading>
);
