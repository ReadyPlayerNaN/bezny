import { Input, type InputProps } from "./Input";

export type MonthInputProps = Omit<InputProps, "type">;

export function MonthInput(props: MonthInputProps) {
	return <Input {...props} type="month" />;
}
