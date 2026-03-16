import { Input, type InputProps } from "./Input";

export type TextInputProps = Omit<InputProps, "type">;

export function TextInput(props: TextInputProps) {
	return <Input {...props} type="text" />;
}
