import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Markdown } from "./Markdown";

const sampleMarkdown = `# Heading 1

A paragraph with **bold** and *italic* text.

## Heading 2

- Item one
- Item two
- Item three

1. First
2. Second

> A blockquote with some text.

Inline \`code\` example.

\`\`\`js
const x = 1;
\`\`\`

[A link](https://example.com)

---

### Heading 3
`;

describe("Markdown a11y", () => {
	it("has no accessibility violations", async () => {
		const { container } = render(<Markdown content={sampleMarkdown} />);
		expect(await axe(container)).toHaveNoViolations();
	});
});
