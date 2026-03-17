import type { ReactNode } from "react";

export type ListColumnProps<T> = {
	header?: ReactNode;
	hideBelow?: "sm" | "md" | "lg";
	render: (item: T) => ReactNode;
};

export function ListColumn<T>(_props: ListColumnProps<T>): null {
	return null;
}
