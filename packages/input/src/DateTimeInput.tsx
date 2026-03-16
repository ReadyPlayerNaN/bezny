import { Input, type InputProps } from "./Input";

export type DateTimeInputProps = Omit<InputProps, "type">;

export function DateTimeInput(props: DateTimeInputProps) {
	return <Input {...props} type="datetime-local" />;
}
