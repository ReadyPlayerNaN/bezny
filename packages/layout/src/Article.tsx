import { HeadingLevelProvider } from "@bezny/text";
import type { ComponentPropsWithoutRef } from "react";

export type ArticleProps = ComponentPropsWithoutRef<"article">;

export function Article({ children, ...rest }: ArticleProps) {
	return (
		<article {...rest}>
			<HeadingLevelProvider>{children}</HeadingLevelProvider>
		</article>
	);
}
