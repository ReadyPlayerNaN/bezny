import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./Card.module.scss";

export type CardOwnProps = {
	className?: ClassValue;
};

const CardBase = createPolymorphic<"div", CardOwnProps>("div", (Tag, { className }, { className: _, ...rest }) => (
	<Tag className={clsx(styles.card, className)} {...rest} />
));

export type CardHeaderOwnProps = {
	className?: ClassValue;
};

export const CardHeader = createPolymorphic<"div", CardHeaderOwnProps>(
	"div",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.cardHeader, className)} {...rest} />,
);

export type CardBodyOwnProps = {
	className?: ClassValue;
};

export const CardBody = createPolymorphic<"div", CardBodyOwnProps>(
	"div",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.cardBody, className)} {...rest} />,
);

export type CardFooterOwnProps = {
	className?: ClassValue;
};

export const CardFooter = createPolymorphic<"div", CardFooterOwnProps>(
	"div",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.cardFooter, className)} {...rest} />,
);

const DEFAULT_IMG_HEIGHT = 160;

export type CardImgProps = {
	alt: string;
	className?: ClassValue;
	height?: number | string;
	position?: CardImgPosition;
	src: string;
};

type CardImgPosition = "top" | "bottom" | "overlay";

export const positionClassMap: Record<CardImgPosition, string> = {
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

CardBase.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardBody.displayName = "CardBody";
CardFooter.displayName = "CardFooter";

export const Card = Object.assign(CardBase, {
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	Body: CardBody,
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	Header: CardHeader,
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	Footer: CardFooter,
	// biome-ignore lint/style/useNamingConvention: React compound component convention
	Img: CardImg,
});
