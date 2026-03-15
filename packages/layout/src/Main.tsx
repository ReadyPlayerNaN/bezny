import type { ComponentPropsWithoutRef } from "react";

export type MainProps = ComponentPropsWithoutRef<"main">;

export function Main({ children, ...rest }: MainProps) {
	return <main {...rest}>{children}</main>;
}
