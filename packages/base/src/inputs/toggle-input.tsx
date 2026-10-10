import { Root, Thumb } from "@radix-ui/react-switch";
import type { ComponentPropsWithRef } from "react";

import styles from "./toggle-input.module.scss";

export type ToggleInputProps = Omit<
  ComponentPropsWithRef<typeof Root>,
  "asChild" | "children"
>;

export const ToggleInput = ({ className, ...props }: ToggleInputProps) => (
  <Root
    {...props}
    className={[styles.toggle, className].filter(Boolean).join(" ")}
  >
    <Thumb className={styles.thumb} />
  </Root>
);
