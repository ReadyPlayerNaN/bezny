import clsx, { type ClassValue } from "clsx";
import { type ReactNode, type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./Dropdown.module.scss";

export type DropdownProps = {
	align?: "left" | "right";
	anchorRef: RefObject<HTMLElement | null>;
	children?: ReactNode;
	className?: ClassValue;
	onClose: () => void;
	open: boolean;
};

export function Dropdown({ align = "right", anchorRef, children, className, onClose, open }: DropdownProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

	const updatePosition = useCallback(() => {
		const anchor = anchorRef.current;
		if (!anchor) {
			return;
		}
		const rect = anchor.getBoundingClientRect();
		const panel = panelRef.current;
		const panelWidth = panel ? panel.offsetWidth : 0;
		const left = align === "left" ? rect.left : rect.right - panelWidth;
		setPosition({
			left: left + window.scrollX,
			top: rect.bottom + window.scrollY,
		});
	}, [anchorRef, align]);

	useLayoutEffect(() => {
		if (!open) {
			return;
		}
		updatePosition();
	}, [open, updatePosition]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const handleScrollResize = () => {
			updatePosition();
		};
		window.addEventListener("scroll", handleScrollResize, true);
		window.addEventListener("resize", handleScrollResize);
		return () => {
			window.removeEventListener("scroll", handleScrollResize, true);
			window.removeEventListener("resize", handleScrollResize);
		};
	}, [open, updatePosition]);

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
		const handleClick = (event: MouseEvent) => {
			const { target } = event;
			if (!(target instanceof Node)) {
				return;
			}
			if (anchorRef.current?.contains(target)) {
				return;
			}
			if (panelRef.current?.contains(target)) {
				return;
			}
			onClose();
		};
		document.addEventListener("mousedown", handleClick);
		return () => {
			document.removeEventListener("mousedown", handleClick);
		};
	}, [open, onClose, anchorRef]);

	useEffect(() => {
		if (!open) {
			return;
		}
		const panel = panelRef.current;
		if (!panel) {
			return;
		}
		const focusable = panel.querySelector<HTMLElement>(
			'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
		);
		focusable?.focus();
	}, [open]);

	useEffect(() => {
		if (open) {
			return;
		}
		anchorRef.current?.focus();
	}, [open, anchorRef]);

	if (!open) {
		return null;
	}

	return createPortal(
		<div ref={panelRef} className={clsx(styles.dropdown, className)} style={{ left: position.left, top: position.top }}>
			{children}
		</div>,
		document.body,
	);
}
