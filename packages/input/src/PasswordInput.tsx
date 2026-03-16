import { Input, type InputProps } from "./Input";

export type PasswordInputProps = Omit<InputProps, "type">;

export function PasswordInput(props: PasswordInputProps) {
	return <Input {...props} type="password" />;
}
