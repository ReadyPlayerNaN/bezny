import { Indicator, Root } from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { useId } from "react";
import type { ComponentPropsWithRef } from "react";

import { Icon } from "../content/icon.js";

import styles from "./input.module.scss";

export type CheckboxInputProps = Omit<
  ComponentPropsWithRef<typeof Root>,
  "asChild" | "children"
>;

export const CheckboxInput = ({
  className,
  id,
  ...props
}: CheckboxInputProps) => {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const labelId = props["aria-labelledby"] ?? controlId;
  return (
    <Root
      {...props}
      id={controlId}
      className={[styles.checkable, className].filter(Boolean).join(" ")}
    >
      <Indicator className={styles.indicator}>
        <Icon
          icon={Check}
          aria-labelledby={labelId}
          aria-hidden="true"
          className={styles.checkmark}
        />
        <Icon
          icon={Minus}
          aria-labelledby={labelId}
          aria-hidden="true"
          className={styles.mixed}
        />
      </Indicator>
    </Root>
  );
};
