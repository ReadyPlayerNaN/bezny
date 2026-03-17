import { createPolymorphic } from "@bezny/core";
import { HeadingLevelProvider } from "@bezny/text";
import type { ReactNode } from "react";

export type AsideOwnProps = Record<string, never>;

export const Aside = createPolymorphic<"aside", AsideOwnProps>("aside", (Tag, _ownProps, { children, ...rest }) => (
	<Tag {...rest}>
		<HeadingLevelProvider>{children as ReactNode}</HeadingLevelProvider>
	</Tag>
));
