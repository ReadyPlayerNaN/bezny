import { Input, type InputProps } from "./Input";

export type TimeInputProps = Omit<InputProps, "type">;

export function TimeInput(props: TimeInputProps) {
	return <Input {...props} type="time" />;
}
