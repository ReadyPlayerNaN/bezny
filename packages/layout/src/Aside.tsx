import { HeadingLevelProvider } from "@bezny/text";
import type { ComponentPropsWithoutRef } from "react";

export type AsideProps = ComponentPropsWithoutRef<"aside">;

export function Aside({ children, ...rest }: AsideProps) {
	return (
		<aside {...rest}>
			<HeadingLevelProvider>{children}</HeadingLevelProvider>
		</aside>
	);
}
