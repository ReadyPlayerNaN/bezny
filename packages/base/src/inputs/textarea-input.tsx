import type { ComponentPropsWithRef } from "react";

import styles from "./input.module.scss";

export type TextareaInputProps = ComponentPropsWithRef<"textarea">;

export const TextareaInput = ({
  className,
  disabled,
  rows = 3,
  ...props
}: TextareaInputProps) => (
  <span
    className={[
      styles.control,
      (props["aria-invalid"] === true || props["aria-invalid"] === "true") &&
        styles.invalid,
    ]
      .filter(Boolean)
      .join(" ")}
    data-disabled={disabled ? "" : undefined}
  >
    <textarea
      {...props}
      rows={rows}
      disabled={disabled}
      className={[styles.textarea, className].filter(Boolean).join(" ")}
    />
  </span>
);
