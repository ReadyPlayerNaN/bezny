import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import type { NavLinkLinkProps } from "./NavLink";
import { NavLink } from "./NavLink";
import styles from "./Sidebar.module.scss";

export type SidebarItem = {
	label: string;
	href: string;
	icon?: ReactNode;
	active?: boolean;
	renderLink?: (children: ReactNode, linkProps: NavLinkLinkProps) => ReactNode;
};

export type SidebarGroup = {
	label: string;
	items: SidebarItem[];
};

export type SidebarProps = {
	className?: ClassValue;
	groups: SidebarGroup[];
};

export function Sidebar({ className, groups }: SidebarProps) {
	return (
		<nav className={clsx(styles.sidebar, className)}>
			{groups.map((group) => (
				<div key={group.label} className={styles.group}>
					<span className={styles.groupLabel}>{group.label}</span>
					<ul className={styles.groupItems}>
						{group.items.map((item) => (
							<li key={item.href} className={styles.item}>
								<NavLink
									href={item.href}
									active={item.active ?? false}
									className={styles.link}
									renderLink={item.renderLink}
								>
									{item.icon && <span className={styles.icon}>{item.icon}</span>}
									{item.label}
								</NavLink>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}
