import { createContext, useContext } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import styles from "./heading.module.scss";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HeadingLevelContext = createContext<HeadingLevel>(1);

const joinClassName = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

export const useHeadingLevel = (): HeadingLevel =>
  useContext(HeadingLevelContext);

export const HeadingLevelProvider = ({
  children,
  level,
}: {
  children: ReactNode;
  level?: HeadingLevel;
}) => {
  const parent = useHeadingLevel();
  const resolved = level ?? (Math.min(parent + 1, 6) as HeadingLevel);
  return (
    <HeadingLevelContext.Provider value={resolved}>
      {children}
    </HeadingLevelContext.Provider>
  );
};

export const Main = (props: HTMLAttributes<HTMLElement>) => <main {...props} />;

export const Section = ({
  children,
  ...props
}: HTMLAttributes<HTMLElement>) => (
  <HeadingLevelProvider>
    <section {...props}>{children}</section>
  </HeadingLevelProvider>
);

export type HeadingProps = Omit<
  HTMLAttributes<HTMLHeadingElement>,
  "children"
> & {
  children?: ReactNode;
  level?: HeadingLevel;
};

export const Heading = ({
  children,
  className,
  level,
  ...props
}: HeadingProps) => {
  const inherited = useHeadingLevel();
  const resolved = level ?? inherited;
  const Tag = `h${resolved}` as `h${HeadingLevel}`;
  return (
    <Tag
      {...props}
      className={joinClassName(
        styles.heading,
        styles[`heading--level-${resolved}`],
        className
      )}
    >
      {children}
    </Tag>
  );
};
