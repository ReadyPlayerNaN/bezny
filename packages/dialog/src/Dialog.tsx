import { createPolymorphic } from "@bezny/styles";
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
		} else if (dialog.open) {
			dialog.close();
		}
	}, [open]);

	return (
		// biome-ignore lint/a11y/noNoninteractiveElementInteractions: backdrop click-to-close is a standard dialog pattern
		// biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled via onCancel
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

export type DialogHeaderOwnProps = {
	className?: ClassValue;
	onClose?: () => void;
};

export const DialogHeader = createPolymorphic<"header", DialogHeaderOwnProps>(
	"header",
	(Tag, { className, onClose }, { className: _, onClose: _onClose, children, ...rest }) => (
		<Tag className={clsx(styles.header, className)} {...rest}>
			{children}
			{onClose ? (
				<button aria-label="Close" className={styles.close} onClick={onClose} type="button">
					&times;
				</button>
			) : null}
		</Tag>
	),
);

export type DialogBodyOwnProps = {
	className?: ClassValue;
};

export const DialogBody = createPolymorphic<"div", DialogBodyOwnProps>(
	"div",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.body, className)} {...rest} />,
);

export type DialogFooterOwnProps = {
	className?: ClassValue;
};

export const DialogFooter = createPolymorphic<"footer", DialogFooterOwnProps>(
	"footer",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.footer, className)} {...rest} />,
);

DialogHeader.displayName = "DialogHeader";
DialogBody.displayName = "DialogBody";
DialogFooter.displayName = "DialogFooter";

Dialog.Header = DialogHeader;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;
