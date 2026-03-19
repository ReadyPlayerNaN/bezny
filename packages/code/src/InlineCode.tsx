import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./InlineCode.module.scss";

export type InlineCodeOwnProps = {
	className?: ClassValue;
};

export const InlineCode = createPolymorphic<"code", InlineCodeOwnProps>(
	"code",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.inlineCode, className)} {...rest} />,
);
