import { type ComponentType, lazy, Suspense, useState } from "react";

const LazyMarkdown = lazy(() =>
	import("@bezny/markdown").then((mod) => ({ default: mod.Markdown as ComponentType<{ content: string }> })),
);

const defaultContent = `## Hello

Some **bold** text and a [link](https://example.com).

- Item one
- Item two
- Item three

> A blockquote with some text.

Inline \`code\` and a block:

\`\`\`js
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`

---

### Heading 3
`;

export default function MarkdownDemo() {
	const [content, setContent] = useState(defaultContent);

	return (
		<div
			style={{
				border: "1px solid var(--bzn-border)",
				borderRadius: "0.5rem",
				overflow: "hidden",
			}}
		>
			<div style={{ padding: "1.5rem", borderBottom: "1px solid var(--bzn-border)" }}>
				<Suspense fallback={<div>Loading...</div>}>
					<LazyMarkdown content={content} />
				</Suspense>
			</div>
			<textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				style={{
					width: "100%",
					minHeight: "12rem",
					padding: "1rem",
					fontFamily: "monospace",
					fontSize: "0.875rem",
					border: "none",
					background: "var(--bzn-surface)",
					color: "var(--bzn-text)",
					resize: "vertical",
				}}
			/>
		</div>
	);
}
