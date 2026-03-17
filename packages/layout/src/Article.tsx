import { createPolymorphic } from "@bezny/core";
import { HeadingLevelProvider } from "@bezny/text";
import type { ReactNode } from "react";

export type ArticleOwnProps = Record<string, never>;

export const Article = createPolymorphic<"article", ArticleOwnProps>(
	"article",
	(Tag, _ownProps, { children, ...rest }) => (
		<Tag {...rest}>
			<HeadingLevelProvider>{children as ReactNode}</HeadingLevelProvider>
		</Tag>
	),
);
