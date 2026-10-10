import { Root, Image, Fallback } from "@radix-ui/react-avatar";
import type { ComponentPropsWithRef } from "react";

import styles from "./avatar.module.scss";

export type AvatarSize = "small" | "normal" | "large";
export type AvatarProps = ComponentPropsWithRef<typeof Root> & {
  size?: AvatarSize;
};
export const Avatar = ({
  size = "normal",
  className,
  ...props
}: AvatarProps) => (
  <Root
    {...props}
    data-size={size}
    className={[styles.avatar, className].filter(Boolean).join(" ")}
  />
);
export type AvatarImageProps = Omit<
  ComponentPropsWithRef<typeof Image>,
  "alt"
> & { alt: string };
export type AvatarImageLoadingStatus = Parameters<
  NonNullable<AvatarImageProps["onLoadingStatusChange"]>
>[0];
export const AvatarImage = ({ className, ...props }: AvatarImageProps) => (
  <Image
    {...props}
    className={[styles.image, className].filter(Boolean).join(" ")}
  />
);
export type AvatarFallbackProps = ComponentPropsWithRef<typeof Fallback>;
export const AvatarFallback = ({
  className,
  ...props
}: AvatarFallbackProps) => (
  <Fallback
    {...props}
    className={[styles.fallback, className].filter(Boolean).join(" ")}
  />
);
