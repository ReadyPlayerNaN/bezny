import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import styles from "./Link.module.scss";

export type LinkOwnProps = {
	className?: ClassValue;
};

export const Link = createPolymorphic<"a", LinkOwnProps>(
	"a",
	(Tag, { className }, { className: _, target, ...rest }) => (
		<Tag
			className={clsx(styles.link, className)}
			rel={target === "_blank" ? "noopener noreferrer" : undefined}
			target={target}
			{...rest}
		/>
	),
);
