import { Input, type InputProps } from "./Input";

export type DateInputProps = Omit<InputProps, "type">;

export function DateInput(props: DateInputProps) {
	return <Input {...props} type="date" />;
}
