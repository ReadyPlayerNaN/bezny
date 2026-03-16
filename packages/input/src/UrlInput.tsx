import { Input, type InputProps } from "./Input";

export type UrlInputProps = Omit<InputProps, "type">;

export function UrlInput(props: UrlInputProps) {
	return <Input {...props} type="url" />;
}
