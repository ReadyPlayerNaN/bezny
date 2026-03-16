import { Input, type InputProps } from "./Input";

export type YearInputProps = Omit<InputProps, "type"> & {
	max?: number;
	min?: number;
	step?: number;
};

export function YearInput({ min = 1900, max = 2100, step = 1, ...props }: YearInputProps) {
	return <Input {...props} type="number" min={min} max={max} step={step} />;
}
