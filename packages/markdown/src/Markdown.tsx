import { CodeBlock, InlineCode } from "@bezny/code";
import {
	Blockquote,
	Heading,
	HorizontalRule,
	Link,
	ListItem,
	OrderedList,
	Paragraph,
	UnorderedList,
	useHeadingLevel,
} from "@bezny/text";
import clsx, { type ClassValue } from "clsx";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import styles from "./Markdown.module.scss";

export type MarkdownProps = {
	className?: ClassValue;
	content: string;
};

type HtmlHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const HEADING_LEVELS: HtmlHeadingLevel[] = [1, 2, 3, 4, 5, 6];
const MAX_HEADING_LEVEL = 6;

function resolveHeadingLevel(contextLevel: number, markdownLevel: HtmlHeadingLevel): HtmlHeadingLevel {
	return Math.min(contextLevel + markdownLevel, MAX_HEADING_LEVEL) as HtmlHeadingLevel;
}

function buildHeadingComponents(contextLevel: number): Partial<Components> {
	return Object.fromEntries(
		HEADING_LEVELS.map((level) => [
			`h${level}`,
			({ node, ...props }: { node?: unknown }) => (
				<Heading level={resolveHeadingLevel(contextLevel, level)} {...props} />
			),
		]),
	);
}

function useComponents(contextLevel: number): Components {
	return {
		...buildHeadingComponents(contextLevel),
		p: ({ node, ...props }) => <Paragraph {...props} />,
		a: ({ node, ...props }) => <Link {...props} />,
		blockquote: ({ node, ...props }) => <Blockquote {...props} />,
		hr: ({ node, ...props }) => <HorizontalRule {...props} />,
		ol: ({ node, ...props }) => <OrderedList {...props} />,
		ul: ({ node, ...props }) => <UnorderedList {...props} />,
		li: ({ node, ...props }) => <ListItem {...props} />,
		pre: ({ node, ...props }) => <CodeBlock {...props} />,
		code: ({ node, className, children, ...props }) => {
			if (className) {
				return (
					<code className={className} {...props}>
						{children}
					</code>
				);
			}
			return <InlineCode {...props}>{children}</InlineCode>;
		},
	};
}

export function Markdown({ className, content }: MarkdownProps) {
	const contextLevel = useHeadingLevel();
	const components = useComponents(contextLevel);

	return (
		<div className={clsx(styles.markdown, className)}>
			<ReactMarkdown components={components}>{content}</ReactMarkdown>
		</div>
	);
}
