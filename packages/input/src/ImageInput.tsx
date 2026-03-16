import { FileInput, type FileInputProps } from "./FileInput";

export type ImageInputProps = Omit<FileInputProps, "type">;

export function ImageInput({ accept = "image/*", ...props }: ImageInputProps) {
	return <FileInput {...props} accept={accept} />;
}
