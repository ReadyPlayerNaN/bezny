import type { ComponentPropsWithRef } from "react";

import styles from "./prose.module.scss";

export type ProseProps = ComponentPropsWithRef<"div">;

/** Typography only. The host must sanitize any HTML before using native dangerouslySetInnerHTML. */
export const Prose = ({ className, ...props }: ProseProps) => (
  <div
    {...props}
    className={[styles.prose, className].filter(Boolean).join(" ")}
  />
);
