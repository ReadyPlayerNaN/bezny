type Heading = {
	depth: number;
	slug: string;
	text: string;
};

const MIN_DEPTH = 2;
const MAX_DEPTH = 3;
const INDENT_PX = 12;

export default function TableOfContents({ headings }: { headings: Heading[] }) {
	const filtered = headings.filter((h) => h.depth >= MIN_DEPTH && h.depth <= MAX_DEPTH);
	if (filtered.length === 0) {
		return null;
	}

	return (
		<nav aria-label="Table of contents">
			<div
				style={{
					fontSize: "0.75rem",
					fontWeight: 600,
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					color: "var(--bzn-text-muted)",
					marginBottom: 8,
				}}
			>
				On this page
			</div>
			<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
				{filtered.map((h) => (
					<li key={h.slug}>
						<a
							href={`#${h.slug}`}
							style={{
								display: "block",
								padding: "2px 0",
								paddingLeft: h.depth === MAX_DEPTH ? INDENT_PX : 0,
								fontSize: "0.8125rem",
								color: "var(--bzn-text-muted)",
								textDecoration: "none",
								lineHeight: 1.5,
							}}
						>
							{h.text}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}
