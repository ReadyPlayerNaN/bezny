import { Children, Fragment, isValidElement } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { Heading, HeadingLevelProvider } from "./heading.js";

import styles from "./card.module.scss";

export type CardProps = ComponentPropsWithRef<"section">;
export const Card = ({ children, className, ...props }: CardProps) => (
  <HeadingLevelProvider>
    <section
      {...props}
      className={[styles.card, className].filter(Boolean).join(" ")}
    >
      {children}
    </section>
  </HeadingLevelProvider>
);
export type CardTitleProps = ComponentPropsWithRef<"div"> & {
  actions?: ReactNode;
};
export const CardTitle = ({
  children,
  actions,
  className,
  ...props
}: CardTitleProps) => (
  <div
    {...props}
    className={[styles.title, className].filter(Boolean).join(" ")}
  >
    <Heading className={styles.heading}>{children}</Heading>
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </div>
);
export const CardBody = ({
  className,
  ...props
}: ComponentPropsWithRef<"div">) => (
  <div
    {...props}
    className={[styles.body, className].filter(Boolean).join(" ")}
  />
);
export const CardProperties = ({
  className,
  ...props
}: ComponentPropsWithRef<"div">) => (
  <div
    {...props}
    className={[styles.properties, className].filter(Boolean).join(" ")}
  />
);
export const MultiBlockCard = ({ children, ...props }: CardProps) => (
  <Card {...props}>
    {/* oxlint-disable-next-line react/no-react-children -- Preserve direct-child block composition and skip empty React children. */}
    {Children.toArray(children).map((block, index) => (
      // oxlint-disable-next-line react/no-array-index-key, react-doctor/no-array-index-as-key -- Primitive blocks have no state; keyed elements preserve identity.
      <Fragment key={isValidElement(block) ? block.key : index}>
        {index > 0 ? <hr className={styles.separator} /> : null}
        <CardBody>{block}</CardBody>
      </Fragment>
    ))}
  </Card>
);
