import { useId } from "react";

import { Icon } from "../content/icon.js";
import type { IconLabel, LucideIcon } from "../content/icon.js";
import { Button } from "./button.js";
import type { ButtonProps } from "./button.js";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip.js";

import styles from "./button.module.scss";

export type IconButtonProps = Omit<
  ButtonProps,
  | "children"
  | "size"
  | "fullWidth"
  | "asComponent"
  | "aria-label"
  | "aria-labelledby"
> &
  IconLabel & { icon: LucideIcon };

/** A fixed circular native button, with its popup label on the focusable control. */
export const IconButton = ({
  icon,
  id,
  className,
  ...props
}: IconButtonProps) => {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const button = (
    <Button
      {...props}
      id={buttonId}
      className={[styles.iconButton, className].filter(Boolean).join(" ")}
    >
      <Icon
        icon={icon}
        aria-labelledby={props["aria-labelledby"] ?? buttonId}
        aria-hidden="true"
      />
    </Button>
  );
  if (props["aria-labelledby"]) {
    return button;
  }
  if (!props["aria-label"]?.trim()) {
    throw new Error(
      "Icon buttons require a visible label association or a non-empty popup label."
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>{props["aria-label"]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
