import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./Link.module.scss";

export type LinkProps = {
	children?: ReactNode;
	className?: ClassValue;
	href: string;
	target?: string;
};

export function Link({ children, className, href, target }: LinkProps) {
	return (
		<a
			className={clsx(styles.link, className)}
			href={href}
			rel={target === "_blank" ? "noopener noreferrer" : undefined}
			target={target}
		>
			{children}
		</a>
	);
}
