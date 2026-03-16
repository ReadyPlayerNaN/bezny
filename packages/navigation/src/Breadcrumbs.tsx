import { createPolymorphic } from "@bezny/styles";
import clsx, { type ClassValue } from "clsx";
import React, { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import styles from "./Breadcrumbs.module.scss";

export type BreadcrumbItemOwnProps = {
	className?: ClassValue;
};

const BreadcrumbItemBase = createPolymorphic<"li", BreadcrumbItemOwnProps>(
	"li",
	(Tag, { className }, { className: _, ...rest }) => (
		<Tag className={clsx(styles.breadcrumbItem, className)} {...rest} />
	),
);

BreadcrumbItemBase.displayName = "BreadcrumbItem";
export const BreadcrumbItem = BreadcrumbItemBase;

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
