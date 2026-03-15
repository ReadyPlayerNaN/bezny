import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./NavLink.module.scss";

export type NavLinkLinkProps = {
	"aria-current"?: "page";
	className: string;
};

export type NavLinkProps = {
	active?: boolean;
	children?: ReactNode;
	className?: ClassValue;
	href?: string;
	renderLink?: (children: ReactNode, linkProps: NavLinkLinkProps) => ReactNode;
};

export function NavLink({ active = false, children, className, href, renderLink }: NavLinkProps) {
	const linkClass = clsx(styles.navLink, active && styles.active, className);
	const ariaCurrent = active ? ("page" as const) : undefined;

	if (renderLink) {
		return <>{renderLink(children, { "aria-current": ariaCurrent, className: linkClass })}</>;
	}

	return (
		<a aria-current={ariaCurrent} className={linkClass} href={href}>
			{children}
		</a>
	);
}
