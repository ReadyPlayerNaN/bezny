import type { ReactNode } from "react";

type DataViewState<T> =
	| { status: "loading" }
	| { status: "reloading"; data: T }
	| { status: "ready"; data: T }
	| { status: "error"; error: unknown };

export type RemoteDataViewProps<T> = {
	state: DataViewState<T>;
	loading?: ReactNode;
	error?: ReactNode;
	children: (data: T) => ReactNode;
};

export function RemoteDataView<T>({
	state,
	loading = null,
	error = null,
	children,
}: RemoteDataViewProps<T>): ReactNode {
	if (state.status === "loading") {
		return loading;
	}
	if (state.status === "error") {
		return error;
	}
	return children(state.data);
}
