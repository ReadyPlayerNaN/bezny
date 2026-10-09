import { Indicator, Item, Root } from "@radix-ui/react-radio-group";
import type { ComponentPropsWithRef } from "react";

import styles from "./input.module.scss";

export type RadioGroupInputProps = Omit<
  ComponentPropsWithRef<typeof Root>,
  "asChild"
>;
export type RadioInputProps = Omit<
  ComponentPropsWithRef<typeof Item>,
  "asChild" | "children"
>;

export const RadioGroupInput = ({
  className,
  ...props
}: RadioGroupInputProps) => (
  <Root
    {...props}
    className={[styles.radioGroup, className].filter(Boolean).join(" ")}
  />
);

export const RadioInput = ({ className, ...props }: RadioInputProps) => (
  <Item
    {...props}
    className={[styles.checkable, styles.radio, className]
      .filter(Boolean)
      .join(" ")}
  >
    <Indicator className={styles.indicator}>
      <span className={styles.radioDot} />
    </Indicator>
  </Item>
);
