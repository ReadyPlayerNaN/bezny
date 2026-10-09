import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
} from 'react';
import styles from './heading.module.scss';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HeadingLevelContext = createContext<HeadingLevel>(1);

function joinClassName(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function useHeadingLevel(): HeadingLevel {
  return useContext(HeadingLevelContext);
}

export function HeadingLevelProvider({ children, level }: { children: ReactNode; level?: HeadingLevel }) {
  const parent = useHeadingLevel();
  const resolved = level ?? (Math.min(parent + 1, 6) as HeadingLevel);
  return <HeadingLevelContext.Provider value={resolved}>{children}</HeadingLevelContext.Provider>;
}

export function Main(props: HTMLAttributes<HTMLElement>) {
  return <main {...props} />;
}

export function Section({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <HeadingLevelProvider>
      <section {...props}>{children}</section>
    </HeadingLevelProvider>
  );
}

export type HeadingProps = Omit<HTMLAttributes<HTMLHeadingElement>, 'children'> & {
  children?: ReactNode;
  level?: HeadingLevel;
};

export function Heading({ children, className, level, ...props }: HeadingProps) {
  const inherited = useHeadingLevel();
  const resolved = level ?? inherited;
  const Tag = `h${resolved}` as `h${HeadingLevel}`;
  return (
    <Tag {...props} className={joinClassName(styles.heading, styles[`heading--level-${resolved}`], className)}>
      {children}
    </Tag>
  );
}
