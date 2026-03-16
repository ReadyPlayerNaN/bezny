import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import styles from "./Link.module.scss";

export type LinkOwnProps = {
	className?: ClassValue;
	href: string;
	target?: string;
};

export const Link = createPolymorphic<"a", LinkOwnProps>(
	"a",
	(Tag, { className, href, target }, { className: _, href: _h, target: _t, ...rest }) => (
		<Tag
			className={clsx(styles.link, className)}
			href={href}
			rel={target === "_blank" ? "noopener noreferrer" : undefined}
			target={target}
			{...rest}
		/>
	),
);
