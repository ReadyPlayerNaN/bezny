import { Alert } from "@bezny/alert";
import { Avatar, AvatarStack } from "@bezny/avatar";
import { BreadcrumbItem, Breadcrumbs } from "@bezny/breadcrumbs";
import { Button, Submit } from "@bezny/button";
import { Card, CardBody, CardFooter, CardHeader, CardImg } from "@bezny/card";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@bezny/dialog";
import { Drawer } from "@bezny/drawer";
import { Dropdown } from "@bezny/dropdown";
import { Article, Aside, Container, Main, Section, Stack } from "@bezny/layout";
import { Navbar, NavbarBrand, NavbarCollapse, NavbarToggle } from "@bezny/navbar";
import { Overlay } from "@bezny/overlay";
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
	Card: Card,
	CardBody: CardBody,
	CardFooter: CardFooter,
	CardHeader: CardHeader,
	CardImg: CardImg,
	Container: Container,
	Dialog: Dialog,
	DialogBody: DialogBody,
	DialogFooter: DialogFooter,
	DialogHeader: DialogHeader,
	Drawer: Drawer,
	Dropdown: Dropdown,
	Heading: Heading,
	HeadingLevelProvider: HeadingLevelProvider,
	Label: Label,
	Link: Link,
	Main: Main,
	Navbar: Navbar,
	NavbarBrand: NavbarBrand,
	NavbarCollapse: NavbarCollapse,
	NavbarToggle: NavbarToggle,
	Overlay: Overlay,
	Paragraph: Paragraph,
	React: React,
	Section: Section,
	Stack: Stack,
	StaticHeading: StaticHeading,
	Submit: Submit,
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
