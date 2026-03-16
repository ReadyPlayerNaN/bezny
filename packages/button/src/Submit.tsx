import type { PolymorphicProps } from "@bezny/styles";
import { Button, type ButtonOwnProps } from "./Button";

export type SubmitProps = PolymorphicProps<"button", ButtonOwnProps>;

export function Submit({ children, ...props }: SubmitProps) {
	return (
		<Button {...props} type="submit">
			{children}
		</Button>
	);
}
