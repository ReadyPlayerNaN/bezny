import { Heading } from "@bezny/text";
import type { ReactNode } from "react";
import styles from "./PageHeader.module.scss";

export type PageHeaderProps = {
	title: string;
	description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps): ReactNode {
	return (
		<div className={styles.header}>
			<Heading>{title}</Heading>
			{description ? <p className={styles.description}>{description}</p> : null}
		</div>
	);
}
