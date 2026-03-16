import type { ReactNode } from "react";
import { type HeadingLevel, HeadingLevelContext } from "./HeadingLevelContext";
import { useHeadingLevel } from "./useHeadingLevel";

const MAX_HEADING_LEVEL = 5;

export type HeadingLevelProviderProps = {
	children?: ReactNode;
	level?: HeadingLevel;
};

export function HeadingLevelProvider({ children, level }: HeadingLevelProviderProps) {
	const current = useHeadingLevel();
	const next = level ?? (current == null ? 0 : (Math.min(current + 1, MAX_HEADING_LEVEL) as HeadingLevel));

	return <HeadingLevelContext value={next}>{children}</HeadingLevelContext>;
}
