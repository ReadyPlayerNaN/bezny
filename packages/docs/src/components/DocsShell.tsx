import { Drawer } from "@bezny/drawer";
import { Main } from "@bezny/layout";
import { Navbar, NavbarBrand, NavbarToggle, useNavbar } from "@bezny/navbar";
import type { SidebarGroup } from "@bezny/navigation";
import { Sidebar } from "@bezny/navigation";
import { type ReactNode, useState } from "react";
import { sidebarGroups } from "../data/sidebar.js";
import ColourSelector from "./ColourSelector.js";
import TableOfContents from "./TableOfContents.js";

type Heading = {
	depth: number;
	slug: string;
	text: string;
};

function withActive(groups: SidebarGroup[], currentPath: string): SidebarGroup[] {
	return groups.map((group) => ({
		...group,
		items: group.items.map((item) => ({
			...item,
			active: item.href === currentPath,
		})),
	}));
}

function DrawerToggle() {
	const { onToggle, expanded } = useNavbar();
	return (
		<Drawer side="left" open={expanded} onClose={() => onToggle(false)}>
			<Sidebar groups={sidebarGroups} />
		</Drawer>
	);
}

export default function DocsShell({
	children,
	currentPath,
	headings,
}: {
	children: ReactNode;
	currentPath: string;
	headings: Heading[];
}) {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const groups = withActive(sidebarGroups, currentPath);

	return (
		<div className="docs-shell">
			<Navbar className="docs-navbar" expanded={drawerOpen} onToggle={setDrawerOpen}>
				<NavbarBrand href="/">bezny</NavbarBrand>
				<NavbarToggle />
				<div style={{ marginLeft: "auto" }}>
					<ColourSelector />
				</div>
				<DrawerToggle />
			</Navbar>
			<aside className="docs-sidebar">
				<Sidebar groups={groups} />
			</aside>
			<div className="docs-body">
				<Main className="docs-content">{children}</Main>
				<div className="docs-toc">
					<TableOfContents headings={headings} />
				</div>
			</div>
		</div>
	);
}
