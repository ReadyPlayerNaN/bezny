import { Alert } from "@bezny/alert";
import { Avatar, AvatarStack } from "@bezny/avatar";
import { Button, Submit } from "@bezny/button";
import { Dialog, DialogBody, DialogFooter, DialogHeader } from "@bezny/dialog";
import { Article, Aside, Container, Main, Section, Stack } from "@bezny/layout";
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
	Button,
	Container,
	Dialog,
	DialogBody,
	DialogFooter,
	DialogHeader,
	Heading,
	HeadingLevelProvider,
	Label,
	Main,
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
