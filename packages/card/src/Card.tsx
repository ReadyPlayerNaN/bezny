import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Card.module.scss";

export type CardProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function Card({ children, className }: CardProps) {
	return <div className={clsx(styles.card, className)}>{children}</div>;
}

export type CardHeaderProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function CardHeader({ children, className }: CardHeaderProps) {
	return <div className={clsx(styles.cardHeader, className)}>{children}</div>;
}

export type CardBodyProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function CardBody({ children, className }: CardBodyProps) {
	return <div className={clsx(styles.cardBody, className)}>{children}</div>;
}

export type CardFooterProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function CardFooter({ children, className }: CardFooterProps) {
	return <div className={clsx(styles.cardFooter, className)}>{children}</div>;
}

const DEFAULT_IMG_HEIGHT = 160;

export type CardImgProps = {
	alt: string;
	className?: ClassValue;
	height?: number | string;
	position?: "top" | "bottom" | "overlay";
	src: string;
};

export const positionClassMap = {
	top: styles.cardImgTop,
	bottom: styles.cardImgBottom,
	overlay: styles.cardImgOverlay,
};

export function CardImg({ alt, className, height, position = "top", src }: CardImgProps) {
	const resolvedHeight = position === "overlay" ? undefined : (height ?? DEFAULT_IMG_HEIGHT);

	return (
		<div className={clsx(positionClassMap[position], className)}>
			{/* biome-ignore lint/correctness/useImageSize: width is 100% via CSS, height is dynamic */}
			<img alt={alt} className={styles.cardImg} src={src} style={{ height: resolvedHeight }} />
		</div>
	);
}

Card.Body = CardBody;
Card.Header = CardHeader;
Card.Footer = CardFooter;
Card.Img = CardImg;
