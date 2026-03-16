import type { SidebarGroup } from "@bezny/navigation";

export const sidebarGroups: SidebarGroup[] = [
	{
		label: "Getting Started",
		items: [{ label: "Introduction", href: "/" }],
	},
	{
		label: "Theming",
		items: [
			{ label: "Overview", href: "/theming/overview/" },
			{ label: "Custom Themes", href: "/theming/custom-themes/" },
			{ label: "Dark Mode", href: "/theming/dark-mode/" },
		],
	},
	{
		label: "Components",
		items: [
			{ label: "Overview", href: "/components/" },
			{ label: "Alert", href: "/components/alert/" },
			{ label: "Avatar", href: "/components/avatar/" },
			{ label: "AvatarStack", href: "/components/avatar-stack/" },
			{ label: "Breadcrumbs", href: "/components/breadcrumbs/" },
			{ label: "Button", href: "/components/button/" },
			{ label: "Card", href: "/components/card/" },
			{ label: "Checkbox", href: "/components/checkbox/" },
			{ label: "Container", href: "/components/container/" },
			{ label: "Dialog", href: "/components/dialog/" },
			{ label: "Drawer", href: "/components/drawer/" },
			{ label: "Dropdown", href: "/components/dropdown/" },
			{ label: "Heading", href: "/components/heading/" },
			{ label: "Label", href: "/components/label/" },
			{ label: "Link", href: "/components/link/" },
			{ label: "Navbar", href: "/components/navbar/" },
			{ label: "Overlay", href: "/components/overlay/" },
			{ label: "Paragraph", href: "/components/paragraph/" },
			{ label: "Radio", href: "/components/radio/" },
			{ label: "Semantic Elements", href: "/components/semantic-elements/" },
			{ label: "Stack", href: "/components/stack/" },
			{ label: "Switch", href: "/components/switch/" },
		],
	},
];
