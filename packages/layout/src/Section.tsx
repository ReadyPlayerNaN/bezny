import { HeadingLevelProvider } from "@bezny/text";
import type { ComponentPropsWithoutRef } from "react";

export type SectionProps = ComponentPropsWithoutRef<"section">;

export function Section({ children, ...rest }: SectionProps) {
	return (
		<section {...rest}>
			<HeadingLevelProvider>{children}</HeadingLevelProvider>
		</section>
	);
}
