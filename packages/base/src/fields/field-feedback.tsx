import type { ComponentPropsWithoutRef, ReactNode } from "react";

import styles from "./field.module.scss";

export type FieldFeedbackProps = ComponentPropsWithoutRef<"div"> & {
  error?: ReactNode;
  help?: ReactNode;
  errorId?: string | undefined;
  helpId?: string | undefined;
};

export const FieldFeedback = ({
  error,
  help,
  errorId,
  helpId,
  className,
  ...props
}: FieldFeedbackProps) => {
  if (!error && !help) {
    return null;
  }
  return (
    <div
      {...props}
      className={[styles.feedback, className].filter(Boolean).join(" ")}
    >
      {error ? (
        <span id={errorId} role="alert" className={styles.error}>
          {error}
        </span>
      ) : null}
      {help ? (
        <span id={helpId} className={styles.help}>
          {help}
        </span>
      ) : null}
    </div>
  );
};
