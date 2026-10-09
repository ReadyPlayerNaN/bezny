import { Indicator, Root } from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

import { Icon } from "../content/icon.js";

import styles from "./input.module.scss";

export type CheckboxInputProps = Omit<
  ComponentPropsWithRef<typeof Root>,
  "asChild" | "children"
>;

export const CheckboxInput = ({ className, ...props }: CheckboxInputProps) => (
  <Root
    {...props}
    className={[styles.checkable, className].filter(Boolean).join(" ")}
  >
    <Indicator className={styles.indicator}>
      <Icon icon={Check} aria-hidden="true" className={styles.checkmark} />
      <Icon icon={Minus} aria-hidden="true" className={styles.mixed} />
    </Indicator>
  </Root>
);
