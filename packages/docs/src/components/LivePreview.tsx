import { Alert } from "@bezny/alert";
import { Avatar, AvatarStack } from "@bezny/avatar";
import { BreadcrumbItem, Breadcrumbs } from "@bezny/navigation";
import { Button, Submit } from "@bezny/button";
import { Card, CardBody, CardFooter, CardHeader, CardImg } from "@bezny/card";
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
	TextInput,
	TimeInput,
	UrlInput,
	WeekInput,
	YearInput,
} from "@bezny/input";
import { Article, Aside, Container, Main, Section, Stack } from "@bezny/layout";
import { Navbar, NavbarBrand, NavbarCollapse, NavbarToggle } from "@bezny/navbar";
import { Overlay } from "@bezny/overlay";
import { ButtonGroup, ButtonGroupOption, Checkbox, CheckboxGroup, Radio, RadioGroup, Switch } from "@bezny/switches";
import { Heading, HeadingLevelProvider, Label, Link, Paragraph, StaticHeading } from "@bezny/text";
import React from "react";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";

const scope = {
	Alert: Alert,
	Article: Article,
	Aside: Aside,
	Avatar: Avatar,
	AvatarStack: AvatarStack,
	BreadcrumbItem: BreadcrumbItem,
	Breadcrumbs: Breadcrumbs,
	Button: Button,
	ButtonGroup: ButtonGroup,
	ButtonGroupOption: ButtonGroupOption,
	Card: Card,
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
	ImageInput: ImageInput,
	Label: Label,
	Link: Link,
	Main: Main,
	MonthInput: MonthInput,
	Navbar: Navbar,
	NavbarBrand: NavbarBrand,
	NavbarCollapse: NavbarCollapse,
	NavbarToggle: NavbarToggle,
	NumberInput: NumberInput,
	Overlay: Overlay,
	Paragraph: Paragraph,
	PasswordInput: PasswordInput,
	Radio: Radio,
	RadioGroup: RadioGroup,
	React: React,
	SearchInput: SearchInput,
	Section: Section,
	Stack: Stack,
	StaticHeading: StaticHeading,
	Submit: Submit,
	Switch: Switch,
	TextInput: TextInput,
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
