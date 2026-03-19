import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./Blockquote.module.scss";

export type BlockquoteOwnProps = {
	className?: ClassValue;
};

export const Blockquote = createPolymorphic<"blockquote", BlockquoteOwnProps>(
	"blockquote",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.blockquote, className)} {...rest} />,
);
