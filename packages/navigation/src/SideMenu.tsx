import clsx, { type ClassValue } from "clsx";
import { type ReactNode, useCallback, useEffect, useRef } from "react";
import styles from "./SideMenu.module.scss";

export type SideMenuProps = {
	children: ReactNode;
	className?: ClassValue;
	onClose?: () => void;
	open?: boolean;
};

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SideMenu({ children, className, onClose, open = false }: SideMenuProps) {
	const asideRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (!open) {
			return;
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose?.();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [open, onClose]);

	const handleFocusTrap = useCallback((event: KeyboardEvent) => {
		if (event.key !== "Tab") {
			return;
		}
		const panel = asideRef.current;
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
		const previouslyFocused = document.activeElement as HTMLElement | null;
		return () => {
			previouslyFocused?.focus();
		};
	}, [open]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const panel = asideRef.current;
		if (!panel) {
			return;
		}
		const focusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
		focusable?.focus();
	}, [open]);

	return (
		<>
			<div
				className={clsx(styles.overlay, open && styles.overlayOpen)}
				data-scroll-lock={open ? "" : undefined}
				onClick={() => onClose?.()}
				role="none"
			/>
			<aside ref={asideRef} className={clsx(styles.aside, open && styles.open, className)}>
				<button aria-label="Close" className={styles.close} onClick={() => onClose?.()} type="button">
					&times;
				</button>
				{children}
			</aside>
		</>
	);
}
