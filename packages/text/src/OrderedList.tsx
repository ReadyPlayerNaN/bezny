import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./OrderedList.module.scss";

export type OrderedListOwnProps = {
	className?: ClassValue;
};

export const OrderedList = createPolymorphic<"ol", OrderedListOwnProps>(
	"ol",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.orderedList, className)} {...rest} />,
);
