import type { ComponentPropsWithoutRef } from "react";

import styles from "./field.module.scss";

export type FieldLabelProps = ComponentPropsWithoutRef<"label"> & {
  required?: boolean;
  asComponent?: "label" | "span";
};

export const FieldLabel = ({
  children,
  className,
  htmlFor,
  required,
  asComponent = "label",
  ...props
}: FieldLabelProps) => {
  const Component = asComponent;
  return (
    <Component
      {...props}
      htmlFor={asComponent === "label" ? htmlFor : undefined}
      className={[styles.label, className].filter(Boolean).join(" ")}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className={styles.required}>
          *
        </span>
      ) : null}
    </Component>
  );
};
