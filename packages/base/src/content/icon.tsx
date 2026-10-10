import type { LucideIcon, LucideProps } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../controls/tooltip.js";

export type { LucideIcon, LucideProps } from "lucide-react";

/** Link visible text, or supply the text shown in a hover/focus label popup. */
export type IconLabel =
  | { "aria-labelledby": string; "aria-label"?: never }
  | { "aria-label": string; "aria-labelledby"?: never };
export type LabelledIconProps = Omit<
  LucideProps,
  "aria-label" | "aria-labelledby"
> &
  IconLabel;
export type IconProps = LabelledIconProps & { icon: LucideIcon };

export const Icon = ({ icon: Lucide, ref, ...props }: IconProps) => {
  if (props["aria-labelledby"]) {
    return <Lucide {...props} ref={ref} role="graphics-symbol" />;
  }
  const label = props["aria-label"];
  if (!label?.trim()) {
    throw new Error(
      "Icons require aria-labelledby pointing to visible text or a non-empty aria-label for a popup label."
    );
  }
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Lucide
            {...props}
            ref={ref}
            role="graphics-symbol"
            tabIndex={props.tabIndex ?? 0}
          />
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const wrapIcon = (Lucide: LucideIcon) => {
  const WrappedIcon = (props: LabelledIconProps) => (
    <Icon {...props} icon={Lucide} />
  );
  WrappedIcon.displayName = `Icon(${Lucide.displayName ?? "Lucide"})`;
  return WrappedIcon;
};
