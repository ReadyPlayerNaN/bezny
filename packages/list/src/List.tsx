import clsx, { type ClassValue } from "clsx";
import React, { type ComponentPropsWithoutRef, isValidElement, type ReactElement, type ReactNode } from "react";
import styles from "./List.module.scss";
import type { ListActionsProps } from "./ListActions";
import { ListActions } from "./ListActions";
import type { ListColumnProps } from "./ListColumn";
import { ListColumn } from "./ListColumn";

type HideBelow = "sm" | "md" | "lg";

type ColumnDef<T> = {
	header?: ReactNode;
	hideBelow?: HideBelow;
	render: (item: T) => ReactNode;
};

type ActionsDef<T> = {
	render: (item: T) => ReactNode;
};

const hideBelowClassMap: Record<HideBelow, string> = {
	sm: styles.hideBelowSm,
	md: styles.hideBelowMd,
	lg: styles.hideBelowLg,
};

function isListColumnElement<T>(child: ReactElement): child is ReactElement<ListColumnProps<T>> {
	return child.type === ListColumn;
}

function isListActionsElement<T>(child: ReactElement): child is ReactElement<ListActionsProps<T>> {
	return child.type === ListActions;
}

function parseChildren<T>(children: ReactNode): { columns: ColumnDef<T>[]; actions: ActionsDef<T> | null } {
	const columns: ColumnDef<T>[] = [];
	let actions: ActionsDef<T> | null = null;

	for (const child of React.Children.toArray(children)) {
		if (!isValidElement(child)) {
			continue;
		}
		if (isListColumnElement<T>(child)) {
			columns.push({
				header: child.props.header,
				hideBelow: child.props.hideBelow,
				render: child.props.render,
			});
		} else if (isListActionsElement<T>(child)) {
			actions = { render: child.props.render };
		}
	}

	return { columns: columns, actions: actions };
}

export type LinkComponentType = React.ComponentType<{ to: string; className?: string; children?: ReactNode }>;

export type ListProps<T> = Omit<ComponentPropsWithoutRef<"div">, "className" | "children"> & {
	children: ReactNode;
	className?: ClassValue;
	data: T[];
	emptyMessage?: ReactNode;
	headers?: boolean;
	hrefOf?: (item: T) => string;
	keyOf: (item: T) => string | number;
	linkComponent?: LinkComponentType;
	onRowClick?: (item: T) => void;
	status?: "ready" | "reloading";
};

export function List<T>({
	children,
	className,
	data,
	emptyMessage,
	headers = false,
	hrefOf,
	keyOf,
	linkComponent,
	onRowClick,
	status,
	...rest
}: ListProps<T>) {
	const { columns, actions } = parseChildren<T>(children);
	const totalColumns = columns.length + (actions ? 1 : 0);

	return (
		<div
			className={clsx(styles.list, className)}
			style={{ gridTemplateColumns: `repeat(${totalColumns}, minmax(0, 1fr))` }}
			{...rest}
		>
			{headers && (
				<div className={styles.listHeader}>
					{columns.map((col, i) => (
						<div
							key={i}
							className={clsx(styles.listCell, styles.headerCell, col.hideBelow && hideBelowClassMap[col.hideBelow])}
						>
							{col.header}
						</div>
					))}
					{actions && <div className={clsx(styles.listCell, styles.headerCell, styles.actionsCell)} />}
				</div>
			)}

			{data.map((item) => {
				const key = keyOf(item);
				const cells = (
					<>
						{columns.map((col, i) => (
							<div key={i} className={clsx(styles.listCell, col.hideBelow && hideBelowClassMap[col.hideBelow])}>
								{col.render(item)}
							</div>
						))}
						{actions && <div className={clsx(styles.listCell, styles.actionsCell)}>{actions.render(item)}</div>}
					</>
				);

				if (hrefOf) {
					const href = hrefOf(item);
					if (linkComponent) {
						const LinkTag = linkComponent;
						return (
							<LinkTag key={key} to={href} className={clsx(styles.listRow, styles.interactive)}>
								{cells}
							</LinkTag>
						);
					}
					return (
						<a key={key} href={href} className={clsx(styles.listRow, styles.interactive)}>
							{cells}
						</a>
					);
				}

				if (onRowClick) {
					return (
						<button
							key={key}
							type="button"
							className={clsx(styles.listRow, styles.interactive)}
							onClick={() => onRowClick(item)}
						>
							{cells}
						</button>
					);
				}

				return (
					<div key={key} className={styles.listRow}>
						{cells}
					</div>
				);
			})}

			{data.length === 0 && emptyMessage && <div className={styles.listEmpty}>{emptyMessage}</div>}

			{status === "reloading" && <div className={styles.listReloading} aria-busy="true" />}
		</div>
	);
}
