import { useHeadingLevel } from "./useHeadingLevel";
import clsx, { type ClassValue } from "clsx";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Heading.module.scss";

type HtmlHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const MAX_HTML_HEADING_LEVEL = 6;

const levelClassMap: Record<HtmlHeadingLevel, string> = {
	1: styles.h1,
	2: styles.h2,
	3: styles.h3,
	4: styles.h4,
	5: styles.h5,
	6: styles.h6,
};

export type HeadingProps = Omit<ComponentPropsWithoutRef<"h1">, "className"> & {
	className?: ClassValue;
	level?: HtmlHeadingLevel;
};

export function Heading({ children, className, level, ...rest }: HeadingProps) {
	const contextLevel = useHeadingLevel();
	const resolved = level ?? (Math.min(contextLevel + 1, MAX_HTML_HEADING_LEVEL) as HtmlHeadingLevel);
	const Tag = `h${resolved}` as const;

	return (
		<Tag className={clsx(styles.heading, levelClassMap[resolved], className)} {...rest}>
			{children}
		</Tag>
	);
}
