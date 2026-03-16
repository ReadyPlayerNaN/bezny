import { Input, type InputProps } from "./Input";

export type WeekInputProps = Omit<InputProps, "type">;

export function WeekInput(props: WeekInputProps) {
	return <Input {...props} type="week" />;
}
