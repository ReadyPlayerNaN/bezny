import clsx, { type ClassValue } from "clsx";
import { type ReactNode, useEffect, useRef } from "react";
import styles from "./Dialog.module.scss";

export type DialogProps = {
	children?: ReactNode;
	className?: ClassValue;
	onClose: () => void;
	open: boolean;
};

export function Dialog({ children, className, onClose, open }: DialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) {
			return;
		}
		if (open) {
			if (!dialog.open) {
				dialog.showModal();
			}
		} else {
			dialog.close();
		}
	}, [open]);

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

	return (
		<dialog
			ref={dialogRef}
			className={clsx(styles.dialog, className)}
			onCancel={(e) => {
				e.preventDefault();
				onClose();
			}}
			onClick={(e) => {
				if (e.target === dialogRef.current) {
					onClose();
				}
			}}
		>
			{children}
		</dialog>
	);
}

export type DialogHeaderProps = {
	children?: ReactNode;
	className?: ClassValue;
	onClose?: () => void;
};

export function DialogHeader({ children, className, onClose }: DialogHeaderProps) {
	return (
		<header className={clsx(styles.header, className)}>
			{children}
			{onClose ? (
				<button aria-label="Close" className={styles.close} onClick={onClose} type="button">
					&times;
				</button>
			) : null}
		</header>
	);
}

export type DialogBodyProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function DialogBody({ children, className }: DialogBodyProps) {
	return <div className={clsx(styles.body, className)}>{children}</div>;
}

export type DialogFooterProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function DialogFooter({ children, className }: DialogFooterProps) {
	return <footer className={clsx(styles.footer, className)}>{children}</footer>;
}
