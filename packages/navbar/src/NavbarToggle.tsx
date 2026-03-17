import { createPolymorphic } from "@bezny/core";
import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import { useNavbar } from "./NavbarContext";
import styles from "./NavbarToggle.module.scss";

export type NavbarToggleOwnProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export const NavbarToggle = createPolymorphic<"button", NavbarToggleOwnProps>(
	"button",
	(Tag, { children, className }, { children: _c, className: _, type = "button", ...rest }) => {
		const { collapseId, expanded, onToggle } = useNavbar();

		return (
			<Tag
				aria-controls={collapseId}
				aria-expanded={expanded}
				aria-label="Toggle navigation"
				className={clsx(styles.toggle, className)}
				onClick={() => onToggle(!expanded)}
				type={type}
				{...rest}
			>
				{children ?? <span aria-hidden="true" className={styles.icon} />}
			</Tag>
		);
	},
);
