import { Alert } from "@bezny/alert";
import { Avatar, AvatarStack } from "@bezny/avatar";
import { Breadcrumbs, BreadcrumbItem } from "@bezny/breadcrumbs";
import { Button, Submit } from "@bezny/button";
import { Card, CardBody, CardFooter, CardHeader, CardImg } from "@bezny/card";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@bezny/dialog";
import { Drawer } from "@bezny/drawer";
import { Dropdown } from "@bezny/dropdown";
import { Article, Aside, Container, Main, Section, Stack } from "@bezny/layout";
import { Navbar, NavbarBrand, NavbarCollapse, NavbarToggle } from "@bezny/navbar";
import { Overlay } from "@bezny/overlay";
import {
	Heading,
	HeadingLevelProvider,
	Label,
	Paragraph,
	StaticHeading,
} from "@bezny/text";
import React from "react";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";

const scope = {
	Alert,
	Article,
	Aside,
	Avatar,
	AvatarStack,
	BreadcrumbItem,
	Breadcrumbs,
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	CardImg,
	Container,
	Dialog,
	DialogBody,
	DialogFooter,
	DialogHeader,
	Drawer,
	Dropdown,
	Heading,
	HeadingLevelProvider,
	Label,
	Main,
	Navbar,
	NavbarBrand,
	NavbarCollapse,
	NavbarToggle,
	Overlay,
	Paragraph,
	React,
	Section,
	Stack,
	StaticHeading,
	Submit,
};

export default function LiveCodePreview({
	code,
	noInline,
}: { code: string; noInline?: boolean }) {
	return (
		<LiveProvider code={code} scope={scope} noInline={noInline}>
			<div
				className="not-content"
				style={{
					border: "1px solid var(--sl-color-gray-5)",
					borderRadius: "0.5rem",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						padding: "1.5rem",
						borderBottom: "1px solid var(--sl-color-gray-5)",
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
