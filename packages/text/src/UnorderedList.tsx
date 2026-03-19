import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./UnorderedList.module.scss";

export type UnorderedListOwnProps = {
	className?: ClassValue;
};

export const UnorderedList = createPolymorphic<"ul", UnorderedListOwnProps>(
	"ul",
	(Tag, { className }, { className: _, ...rest }) => (
		<Tag className={clsx(styles.unorderedList, className)} {...rest} />
	),
);
