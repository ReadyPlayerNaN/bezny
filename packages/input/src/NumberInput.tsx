import { Input, type InputProps } from "./Input";

export type NumberInputProps = Omit<InputProps, "type">;

export function NumberInput(props: NumberInputProps) {
	return <Input {...props} type="number" />;
}
