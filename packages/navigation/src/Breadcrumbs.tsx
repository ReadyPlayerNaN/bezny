import clsx, { type ClassValue } from "clsx";
import React, { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import styles from "./Breadcrumbs.module.scss";

export type BreadcrumbItemProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function BreadcrumbItem({ children, className, ...rest }: BreadcrumbItemProps & Record<string, unknown>) {
	return (
		<li className={clsx(styles.breadcrumbItem, className)} {...rest}>
			{children}
		</li>
	);
}

export type BreadcrumbsProps = {
	children?: ReactNode;
	className?: ClassValue;
};

export function Breadcrumbs({ children, className }: BreadcrumbsProps) {
	const items = React.Children.toArray(children);
	const lastIndex = items.length - 1;

	return (
		<nav aria-label="breadcrumb">
			<ol className={clsx(styles.breadcrumbs, className)}>
				{items.map((child, index) =>
					index === lastIndex && isValidElement(child)
						? cloneElement(child as ReactElement<{ "aria-current"?: string }>, {
								"aria-current": "page",
							})
						: child,
				)}
			</ol>
		</nav>
	);
}
