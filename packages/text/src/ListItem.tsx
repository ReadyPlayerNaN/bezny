import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./ListItem.module.scss";

export type ListItemOwnProps = {
	className?: ClassValue;
};

export const ListItem = createPolymorphic<"li", ListItemOwnProps>(
	"li",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.listItem, className)} {...rest} />,
);
