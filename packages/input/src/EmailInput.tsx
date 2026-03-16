import { Input, type InputProps } from "./Input";

export type EmailInputProps = Omit<InputProps, "type">;

export function EmailInput(props: EmailInputProps) {
	return <Input {...props} type="email" />;
}
