import { Button, type ButtonProps } from "./Button";

export function Submit({ children, ...props }: ButtonProps) {
	return (
		<Button {...props} type="submit">
			{children}
		</Button>
	);
}
