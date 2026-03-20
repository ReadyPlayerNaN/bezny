import { Main } from "@bezny/layout";
import { Navbar, NavbarBrand, NavbarToggle } from "@bezny/navbar";
import type { SidebarGroup } from "@bezny/navigation";
import { Sidebar, SideMenu } from "@bezny/navigation";
import { type ReactNode, useState } from "react";
import { sidebarGroups } from "../data/sidebar.js";
import TableOfContents from "./TableOfContents.js";
import ThemeSettings from "./ThemeSettings.js";

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
					<ThemeSettings />
				</div>
			</Navbar>
			<SideMenu open={drawerOpen} onClose={() => setDrawerOpen(false)}>
				<Sidebar groups={groups} />
			</SideMenu>
			<div className="docs-body">
				<Main className="docs-content">{children}</Main>
				<div className="docs-toc">
					<TableOfContents headings={headings} />
				</div>
			</div>
		</div>
	);
}
