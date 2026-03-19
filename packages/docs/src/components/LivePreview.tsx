import { Alert } from "@bezny/alert";
import { Avatar, AvatarStack } from "@bezny/avatar";
import { Badge } from "@bezny/badge";
import { Button, Submit } from "@bezny/button";
import { Card, CardBody, CardFooter, CardHeader, CardImg } from "@bezny/card";
import { CodeBlock, InlineCode } from "@bezny/code";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@bezny/dialog";
import { Drawer } from "@bezny/drawer";
import { Dropdown } from "@bezny/dropdown";
import {
	DateInput,
	DateTimeInput,
	EmailInput,
	FileInput,
	ImageInput,
	MonthInput,
	NumberInput,
	PasswordInput,
	SearchInput,
	TagListInput,
	TextInput,
	TimeInput,
	UrlInput,
	WeekInput,
	YearInput,
} from "@bezny/input";
import { Article, Aside, Container, Main, Section, Stack } from "@bezny/layout";
import { Navbar, NavbarBrand, NavbarCollapse, NavbarToggle } from "@bezny/navbar";
import { BreadcrumbItem, Breadcrumbs } from "@bezny/navigation";
import { Overlay } from "@bezny/overlay";
import { Pagination } from "@bezny/pagination";
import { Popover } from "@bezny/popover";
import { ButtonGroup, ButtonGroupOption, Checkbox, CheckboxGroup, Radio, RadioGroup, Switch } from "@bezny/switches";
import { Tab, TabList, TabPanel, Tabs } from "@bezny/tabs";
import {
	Blockquote,
	Heading,
	HeadingLevelProvider,
	HorizontalRule,
	Label,
	Link,
	ListItem,
	OrderedList,
	Paragraph,
	StaticHeading,
	UnorderedList,
} from "@bezny/text";
import { Tooltip } from "@bezny/tooltip";
import React from "react";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";

const scope = {
	Alert: Alert,
	Article: Article,
	Badge: Badge,
	Blockquote: Blockquote,
	Aside: Aside,
	Avatar: Avatar,
	AvatarStack: AvatarStack,
	BreadcrumbItem: BreadcrumbItem,
	Breadcrumbs: Breadcrumbs,
	Button: Button,
	ButtonGroup: ButtonGroup,
	ButtonGroupOption: ButtonGroupOption,
	Card: Card,
	CodeBlock: CodeBlock,
	CardBody: CardBody,
	Checkbox: Checkbox,
	CheckboxGroup: CheckboxGroup,
	CardFooter: CardFooter,
	CardHeader: CardHeader,
	CardImg: CardImg,
	Container: Container,
	DateInput: DateInput,
	DateTimeInput: DateTimeInput,
	Dialog: Dialog,
	DialogBody: DialogBody,
	DialogFooter: DialogFooter,
	DialogHeader: DialogHeader,
	Drawer: Drawer,
	Dropdown: Dropdown,
	EmailInput: EmailInput,
	FileInput: FileInput,
	Heading: Heading,
	HeadingLevelProvider: HeadingLevelProvider,
	HorizontalRule: HorizontalRule,
	ImageInput: ImageInput,
	InlineCode: InlineCode,
	Label: Label,
	Link: Link,
	ListItem: ListItem,
	Main: Main,
	MonthInput: MonthInput,
	Navbar: Navbar,
	NavbarBrand: NavbarBrand,
	NavbarCollapse: NavbarCollapse,
	NavbarToggle: NavbarToggle,
	NumberInput: NumberInput,
	OrderedList: OrderedList,
	Overlay: Overlay,
	Pagination: Pagination,
	Paragraph: Paragraph,
	PasswordInput: PasswordInput,
	Popover: Popover,
	Radio: Radio,
	RadioGroup: RadioGroup,
	React: React,
	SearchInput: SearchInput,
	Section: Section,
	Stack: Stack,
	StaticHeading: StaticHeading,
	Submit: Submit,
	Switch: Switch,
	Tab: Tab,
	TabList: TabList,
	TabPanel: TabPanel,
	Tabs: Tabs,
	TagListInput: TagListInput,
	TextInput: TextInput,
	Tooltip: Tooltip,
	UnorderedList: UnorderedList,
	TimeInput: TimeInput,
	UrlInput: UrlInput,
	WeekInput: WeekInput,
	YearInput: YearInput,
};

export default function LiveCodePreview({ code, noInline }: { code: string; noInline?: boolean }) {
	return (
		<LiveProvider code={code} scope={scope} noInline={noInline}>
			<div
				style={{
					border: "1px solid var(--bzn-border)",
					borderRadius: "0.5rem",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						padding: "1.5rem",
						borderBottom: "1px solid var(--bzn-border)",
					}}
				>
					<LivePreview />
				</div>
				<LiveEditor style={{ fontSize: "0.875rem" }} />
			</div>
			<LiveError
				style={{
					color: "#dc2626",
					backgroundColor: "#fee2e2",
					padding: "0.75rem",
					borderRadius: "0.5rem",
					fontFamily: "monospace",
					fontSize: "0.875rem",
					marginTop: "0.5rem",
				}}
			/>
		</LiveProvider>
	);
}
