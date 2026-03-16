import { Input, type InputProps } from "./Input";

export type SearchInputProps = Omit<InputProps, "type">;

export function SearchInput(props: SearchInputProps) {
	return <Input {...props} type="search" />;
}
