import clsx, { type ClassValue } from "clsx";
import styles from "./Pagination.module.scss";

export type PaginationProps = {
	className?: ClassValue;
	onPageChange: (page: number) => void;
	page: number;
	siblings?: number;
	totalPages: number;
};

function getPageNumbers(page: number, totalPages: number, siblings: number): (number | "ellipsis")[] {
	const range: (number | "ellipsis")[] = [];
	const left = Math.max(2, page - siblings);
	const right = Math.min(totalPages - 1, page + siblings);

	range.push(1);
	if (left > 2) {
		range.push("ellipsis");
	}
	for (let i = left; i <= right; i++) {
		range.push(i);
	}
	if (right < totalPages - 1) {
		range.push("ellipsis");
	}
	if (totalPages > 1) {
		range.push(totalPages);
	}
	return range;
}

export function Pagination({ className, onPageChange, page, siblings = 1, totalPages }: PaginationProps) {
	const pages = getPageNumbers(page, totalPages, siblings);

	return (
		<nav aria-label="Pagination" className={clsx(styles.pagination, className)}>
			<button
				type="button"
				className={styles.pageButton}
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				aria-label="Previous page"
			>
				&lsaquo;
			</button>
			{pages.map((p, i) =>
				p === "ellipsis" ? (
					<span key={`ellipsis-${i}`} className={styles.ellipsis} aria-hidden="true">
						&hellip;
					</span>
				) : (
					<button
						key={p}
						type="button"
						className={clsx(styles.pageButton, p === page && styles.active)}
						aria-current={p === page ? "page" : undefined}
						onClick={() => onPageChange(p)}
					>
						{p}
					</button>
				),
			)}
			<button
				type="button"
				className={styles.pageButton}
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				aria-label="Next page"
			>
				&rsaquo;
			</button>
		</nav>
	);
}
