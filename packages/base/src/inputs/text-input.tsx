import type { ComponentPropsWithRef, ReactNode } from "react";

import styles from "./input.module.scss";

export type TextInputProps = Omit<
  ComponentPropsWithRef<"input">,
  "prefix" | "size"
> & {
  prefix?: ReactNode;
  minValue?: number;
  maxValue?: number;
};

export const TextInput = ({
  prefix,
  minValue,
  maxValue,
  min,
  max,
  className,
  disabled,
  type = "text",
  ...props
}: TextInputProps) => (
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
    {prefix ? (
      <span aria-hidden="true" className={styles.prefix}>
        {prefix}
      </span>
    ) : null}
    <input
      {...props}
      type={type}
      disabled={disabled}
      min={minValue ?? min}
      max={maxValue ?? max}
      className={[styles.input, className].filter(Boolean).join(" ")}
    />
  </span>
);
