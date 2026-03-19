import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./HorizontalRule.module.scss";

export type HorizontalRuleOwnProps = {
	className?: ClassValue;
};

export const HorizontalRule = createPolymorphic<"hr", HorizontalRuleOwnProps>(
	"hr",
	(Tag, { className }, { className: _, ...rest }) => (
		<Tag className={clsx(styles.horizontalRule, className)} {...rest} />
	),
);
