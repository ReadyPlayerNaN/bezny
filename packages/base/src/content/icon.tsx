import type { LucideIcon, LucideProps } from "lucide-react";

export type { LucideIcon, LucideProps } from "lucide-react";

export type IconProps = LucideProps & { icon: LucideIcon };

/** Shared SVG boundary for Lucide icons and semantic feature wrappers. */
export const Icon = ({ icon: Lucide, ref, ...props }: IconProps) => (
  <Lucide {...props} ref={ref} role="graphics-symbol" />
);

/** Create a reusable icon component without adding a DOM wrapper. */
export const wrapIcon = (Lucide: LucideIcon) => {
  const WrappedIcon = (props: LucideProps) => <Icon {...props} icon={Lucide} />;
  WrappedIcon.displayName = `Icon(${Lucide.displayName ?? "Lucide"})`;
  return WrappedIcon;
};
