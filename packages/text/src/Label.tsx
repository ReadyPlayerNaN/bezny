import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import styles from "./Label.module.scss";

export type LabelOwnProps = {
	className?: ClassValue;
};

export const Label = createPolymorphic<"label", LabelOwnProps>(
	"label",
	(Tag, { className }, { className: _, ...rest }) => (
		<Tag className={clsx(styles.label, className)} {...rest} />
	),
);
