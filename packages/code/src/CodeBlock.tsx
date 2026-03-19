import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import styles from "./CodeBlock.module.scss";

export type CodeBlockOwnProps = {
	className?: ClassValue;
};

export const CodeBlock = createPolymorphic<"pre", CodeBlockOwnProps>(
	"pre",
	(Tag, { className }, { className: _, ...rest }) => <Tag className={clsx(styles.codeBlock, className)} {...rest} />,
);
