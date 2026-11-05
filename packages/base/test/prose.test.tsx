// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createElement, createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Prose } from "../src/index.js";

describe(Prose, () => {
  afterEach(cleanup);

  it("keeps text escaped rather than interpreting CMS strings as HTML", () => {
    const text = '<img src="x" onerror="alert(1)">';
    const { container } = render(<Prose>{text}</Prose>);
    expect(container.textContent).toBe(text);
    expect(container.querySelector("img")).toBeNull();
  });

  it("preserves semantic authored children without changing link or list ownership", () => {
    render(
      <Prose>
        <h2>Terms</h2>
        <p>
          Read <a href="/policy">policy</a>.
        </p>
        <ul>
          <li>First clause</li>
        </ul>
        <blockquote>Quotation</blockquote>
        <pre>
          <code>const result = true;</code>
        </pre>
      </Prose>
    );
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Terms");
    expect(
      screen.getByRole("link", { name: "policy" }).getAttribute("href")
    ).toBe("/policy");
    expect(screen.getByRole("listitem").textContent).toBe("First clause");
    expect(screen.getByText("const result = true;").tagName).toBe("CODE");
  });

  it("forwards refs, classes, native attributes and explicitly host-sanitized HTML", () => {
    const ref = createRef<HTMLDivElement>();
    // This literal is the trusted fixture; sanitization remains a caller responsibility.
    const trustedHtml = "<h2>Published terms</h2><p>Reviewed content</p>";
    render(
      createElement(Prose, {
        className: "custom",
        // oxlint-disable-next-line react/no-danger -- Verify native HTML forwarding with a trusted test literal; the host owns sanitization.
        dangerouslySetInnerHTML: { __html: trustedHtml },
        id: "legal",
        lang: "en",
        ref,
      })
    );
    expect(ref.current?.id).toBe("legal");
    expect(ref.current?.classList.contains("custom")).toBeTruthy();
    expect(ref.current?.lang).toBe("en");
    expect(screen.getByRole("heading").textContent).toBe("Published terms");
  });
});
