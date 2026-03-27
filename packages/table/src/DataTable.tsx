import type { ReactNode } from "react";
import styles from "./DataTable.module.scss";

export type Column<T> = {
	key: string;
	header: string;
	render: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
	columns: Column<T>[];
	rows: T[];
	getRowKey: (row: T) => string;
	totalsRow?: ReactNode[];
	loading?: boolean;
};

function renderBodyContent<T>(
	columns: Column<T>[],
	rows: T[],
	getRowKey: (row: T) => string,
	loading: boolean | undefined,
): ReactNode {
	if (loading) {
		return (
			<tr>
				<td className={styles.loadingState} colSpan={columns.length}>
					Loading…
				</td>
			</tr>
		);
	}
	if (rows.length === 0) {
		return (
			<tr>
				<td className={styles.emptyState} colSpan={columns.length}>
					No data
				</td>
			</tr>
		);
	}
	return rows.map((row) => (
		<tr key={getRowKey(row)}>
			{columns.map((column) => (
				<td key={column.key} className={styles.bodyCell}>
					{column.render(row)}
				</td>
			))}
		</tr>
	));
}

export function DataTable<T>({ columns, rows, getRowKey, totalsRow, loading }: DataTableProps<T>) {
	return (
		<div className={styles.wrapper}>
			<table className={styles.table}>
				<thead>
					<tr>
						{columns.map((column) => (
							<th key={column.key} className={styles.headerCell}>
								{column.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>{renderBodyContent(columns, rows, getRowKey, loading)}</tbody>
				{totalsRow && (
					<tfoot>
						<tr>
							{totalsRow.map((cell, index) => (
								<td key={columns[index]?.key ?? index} className={styles.footerCell}>
									{cell}
								</td>
							))}
						</tr>
					</tfoot>
				)}
			</table>
		</div>
	);
}
