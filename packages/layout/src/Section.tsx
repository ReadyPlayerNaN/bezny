import { createPolymorphic } from "@bezny/styles";
import { HeadingLevelProvider } from "@bezny/text";
import type { ReactNode } from "react";

export type SectionOwnProps = Record<string, never>;

export const Section = createPolymorphic<"section", SectionOwnProps>(
	"section",
	(Tag, _ownProps, { children, ...rest }) => (
		<Tag {...rest}>
			<HeadingLevelProvider>{children as ReactNode}</HeadingLevelProvider>
		</Tag>
	),
);
