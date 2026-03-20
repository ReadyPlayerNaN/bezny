import clsx, { type ClassValue } from "clsx";
import { type ReactNode, useState } from "react";
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

function hasActiveItem(group: SidebarGroup): boolean {
	return group.items.some((item) => item.active);
}

export function Sidebar({ className, groups }: SidebarProps) {
	const [expanded, setExpanded] = useState<Set<string>>(() => {
		const initial = new Set<string>();
		for (const group of groups) {
			if (hasActiveItem(group)) {
				initial.add(group.label);
			}
		}
		return initial;
	});

	function toggle(label: string) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(label)) {
				next.delete(label);
			} else {
				next.add(label);
			}
			return next;
		});
	}

	return (
		<nav className={clsx(styles.sidebar, className)}>
			{groups.map((group) => {
				const isExpanded = expanded.has(group.label);
				return (
					<div key={group.label} className={styles.group}>
						<button
							aria-expanded={isExpanded}
							className={styles.groupLabel}
							onClick={() => toggle(group.label)}
							type="button"
						>
							{group.label}
							<span aria-hidden="true" className={clsx(styles.chevron, { [styles.chevronExpanded]: isExpanded })}>
								›
							</span>
						</button>
						<div className={clsx(styles.groupCollapse, { [styles.groupExpanded]: isExpanded })}>
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
					</div>
				);
			})}
		</nav>
	);
}
