import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
} from 'react';
import styles from './heading.module.scss';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingKind = 'title1' | 'title2' | 'title3' | 'title4' | 'title5' | 'title6';

const HeadingLevelContext = createContext<HeadingLevel>(1);

function joinClassName(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function resolveHeadingLevel(kind?: HeadingKind, level?: HeadingLevel, inherited?: HeadingLevel): HeadingLevel {
  if (level) return level;
  if (kind) return Number(kind.replace('title', '')) as HeadingLevel;
  return inherited ?? 1;
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
  type?: HeadingKind;
};

export function Heading({ children, className, level, type, ...props }: HeadingProps) {
  const inherited = useHeadingLevel();
  const resolved = resolveHeadingLevel(type, level, inherited);
  const Tag = `h${resolved}` as `h${HeadingLevel}`;
  return (
    <Tag {...props} className={joinClassName(styles.heading, styles[`heading--level-${resolved}`], className)}>
      {children}
    </Tag>
  );
}
