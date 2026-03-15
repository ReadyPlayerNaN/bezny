import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Paragraph.module.scss";

type ParagraphProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function Paragraph({ children, className }: ParagraphProps) {
	return <p className={clsx(styles.paragraph, className)}>{children}</p>;
}
