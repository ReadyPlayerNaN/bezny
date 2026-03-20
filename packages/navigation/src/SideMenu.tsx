import { Drawer } from "@bezny/drawer";
import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import styles from "./SideMenu.module.scss";

export type SideMenuProps = {
	children: ReactNode;
	className?: ClassValue;
	onClose?: () => void;
	open?: boolean;
};

export function SideMenu({ children, className, onClose, open = false }: SideMenuProps) {
	return (
		<>
			<aside className={clsx(styles.aside, className)}>{children}</aside>
			<Drawer side="left" open={open} onClose={() => onClose?.()}>
				{children}
			</Drawer>
		</>
	);
}
