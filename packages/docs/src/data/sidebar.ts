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
		items: [{ label: "Overview", href: "/components/" }],
	},
	{
		label: "Layout",
		items: [
			{ label: "Container", href: "/components/container/" },
			{ label: "Semantic Elements", href: "/components/semantic-elements/" },
			{ label: "Stack", href: "/components/stack/" },
		],
	},
	{
		label: "Typography",
		items: [
			{ label: "Blockquote", href: "/components/blockquote/" },
			{ label: "Code", href: "/components/code/" },
			{ label: "Heading", href: "/components/heading/" },
			{ label: "HorizontalRule", href: "/components/horizontal-rule/" },
			{ label: "Link", href: "/components/link/" },
			{ label: "Lists", href: "/components/lists/" },
			{ label: "Markdown", href: "/components/markdown/" },
			{ label: "Paragraph", href: "/components/paragraph/" },
		],
	},
	{
		label: "Data Display",
		items: [
			{ label: "Avatar", href: "/components/avatar/" },
			{ label: "AvatarStack", href: "/components/avatar-stack/" },
			{ label: "Badge", href: "/components/badge/" },
			{ label: "Card", href: "/components/card/" },
			{ label: "DataTable", href: "/components/data-table/" },
		],
	},
	{
		label: "Forms",
		items: [
			{ label: "Button", href: "/components/button/" },
			{ label: "ButtonGroup", href: "/components/button-group/" },
			{ label: "Checkbox", href: "/components/checkbox/" },
			{ label: "DateInput", href: "/components/date-input/" },
			{ label: "DateTimeInput", href: "/components/date-time-input/" },
			{ label: "EmailInput", href: "/components/email-input/" },
			{ label: "FileInput", href: "/components/file-input/" },
			{ label: "ImageInput", href: "/components/image-input/" },
			{ label: "Label", href: "/components/label/" },
			{ label: "MonthInput", href: "/components/month-input/" },
			{ label: "NumberInput", href: "/components/number-input/" },
			{ label: "PasswordInput", href: "/components/password-input/" },
			{ label: "Radio", href: "/components/radio/" },
			{ label: "SearchInput", href: "/components/search-input/" },
			{ label: "SelectInput", href: "/components/select-input/" },
			{ label: "Switch", href: "/components/switch/" },
			{ label: "TagListInput", href: "/components/tag-list-input/" },
			{ label: "TextInput", href: "/components/text-input/" },
			{ label: "TimeInput", href: "/components/time-input/" },
			{ label: "UrlInput", href: "/components/url-input/" },
			{ label: "WeekInput", href: "/components/week-input/" },
			{ label: "YearInput", href: "/components/year-input/" },
		],
	},
	{
		label: "Navigation",
		items: [
			{ label: "Breadcrumbs", href: "/components/breadcrumbs/" },
			{ label: "Navbar", href: "/components/navbar/" },
			{ label: "Pagination", href: "/components/pagination/" },
			{ label: "SideMenu", href: "/components/side-menu/" },
			{ label: "Tabs", href: "/components/tabs/" },
		],
	},
	{
		label: "Feedback",
		items: [
			{ label: "Alert", href: "/components/alert/" },
			{ label: "Tooltip", href: "/components/tooltip/" },
		],
	},
	{
		label: "Overlays",
		items: [
			{ label: "Dialog", href: "/components/dialog/" },
			{ label: "Drawer", href: "/components/drawer/" },
			{ label: "Dropdown", href: "/components/dropdown/" },
			{ label: "Overlay", href: "/components/overlay/" },
			{ label: "Popover", href: "/components/popover/" },
		],
	},
];
