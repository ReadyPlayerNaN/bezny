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
};

export function DataTable<T>({ columns, rows, getRowKey, totalsRow }: DataTableProps<T>) {
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
				<tbody>
					{rows.length === 0 ? (
						<tr>
							<td className={styles.emptyState} colSpan={columns.length}>
								No data
							</td>
						</tr>
					) : (
						rows.map((row) => (
							<tr key={getRowKey(row)}>
								{columns.map((column) => (
									<td key={column.key} className={styles.bodyCell}>
										{column.render(row)}
									</td>
								))}
							</tr>
						))
					)}
				</tbody>
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
