import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import styles from "./Paragraph.module.scss";

export type ParagraphOwnProps = {
	className?: ClassValue;
};

export const Paragraph = createPolymorphic<"p", ParagraphOwnProps>(
	"p",
	(Tag, { className }, { className: _, ...rest }) => (
		<Tag className={clsx(styles.paragraph, className)} {...rest} />
	),
);
