import type { ReactNode } from "react";

export type ListActionsProps<T> = {
	render: (item: T) => ReactNode;
};

export function ListActions<T>(_props: ListActionsProps<T>): null {
	return null;
}
