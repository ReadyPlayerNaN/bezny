import { Button, Submit } from "@bezny/button";
import type { ReactNode } from "react";
import { LiveEditor, LiveError, LivePreview, LiveProvider } from "react-live";

const scope = {
	Button: Button,
	Submit: Submit,
};

function BeznyWrapper({ children }: { children: ReactNode }) {
	return <div data-theme="light">{children}</div>;
}

export default function LiveCodePreview({ code }: { code: string }) {
	return (
		<LiveProvider code={code} scope={scope}>
			<div
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
					<BeznyWrapper>
						<LivePreview />
					</BeznyWrapper>
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
