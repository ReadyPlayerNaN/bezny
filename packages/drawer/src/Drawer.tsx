import { Overlay } from "@bezny/overlay";
import clsx, { type ClassValue } from "clsx";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import styles from "./Drawer.module.scss";

export type DrawerProps = {
	children?: ReactNode;
	className?: ClassValue;
	onClose: () => void;
	open: boolean;
	side?: "left" | "right" | "top" | "bottom";
};

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({ children, className, onClose, open, side = "right" }: DrawerProps) {
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, onClose]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [open]);

	const handleFocusTrap = useCallback((event: KeyboardEvent) => {
		if (event.key !== "Tab") {
			return;
		}
		const panel = panelRef.current;
		if (!panel) {
			return;
		}
		const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
		if (focusableElements.length === 0) {
			event.preventDefault();
			return;
		}
		const [first] = focusableElements;
		const last = focusableElements.at(-1);
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}, []);

	useEffect(() => {
		if (!open) {
			return;
		}
		document.addEventListener("keydown", handleFocusTrap);
		return () => {
			document.removeEventListener("keydown", handleFocusTrap);
		};
	}, [open, handleFocusTrap]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const panel = panelRef.current;
		if (!panel) {
			return;
		}
		const focusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
		focusable?.focus();
	}, [open]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const handleMouseDown = (event: MouseEvent) => {
			const { target } = event;
			if (target instanceof Node && !panelRef.current?.contains(target)) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleMouseDown);
		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
		};
	}, [open, onClose]);

	const sideClassMap = {
		left: styles.panelLeft,
		right: styles.panelRight,
		top: styles.panelTop,
		bottom: styles.panelBottom,
	};
	const sideClass = sideClassMap[side];

	return (
		<Overlay className={styles.overlay} open={open}>
			{(visible) => (
				<div ref={panelRef} aria-modal="true" className={clsx(styles.panel, sideClass, visible && styles.panelVisible, className)} role="dialog">
					<button aria-label="Close" className={styles.close} onClick={onClose} type="button">
						&times;
					</button>
					<div className={styles.content}>{children}</div>
				</div>
			)}
		</Overlay>
	);
}
