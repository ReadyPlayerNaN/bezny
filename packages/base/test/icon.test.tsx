// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Copy as LucideCopy, Plane as LucidePlane } from "lucide-react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Heading, Icon, wrapIcon } from "../src/index.js";

const Copy = wrapIcon(LucideCopy);

describe("icon wrapper", () => {
  afterEach(cleanup);

  it("enforces graphics-symbol while preserving SVG props, events, and refs", () => {
    const ref = createRef<SVGSVGElement>();
    const onClick = vi.fn<() => void>();
    const conflictingRole = { role: "img" };
    const { container } = render(
      <Icon
        icon={LucidePlane}
        ref={ref}
        {...conflictingRole}
        aria-label="Airline"
        size={18}
        strokeWidth={1.5}
        color="red"
        className="airline"
        style={{ verticalAlign: "middle" }}
        onClick={onClick}
      />
    );
    const icon = screen.getByRole("graphics-symbol", { name: "Airline" });
    expect(container.firstElementChild).toBe(icon);
    expect(container.children).toHaveLength(1);
    expect({
      className: icon.classList.contains("airline"),
      color: icon.getAttribute("stroke"),
      height: icon.getAttribute("height"),
      strokeWidth: icon.getAttribute("stroke-width"),
      tag: icon.tagName.toLowerCase(),
      verticalAlign: icon.style.verticalAlign,
      width: icon.getAttribute("width"),
    }).toStrictEqual({
      className: true,
      color: "red",
      height: "18",
      strokeWidth: "1.5",
      tag: "svg",
      verticalAlign: "middle",
      width: "18",
    });
    expect(ref.current).toBe(icon);
    fireEvent.click(icon);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("forwards refs and props through wrapped icons", () => {
    const ref = createRef<SVGSVGElement>();
    render(<Copy ref={ref} aria-label="Copy" />);
    expect(ref.current).toBe(
      screen.getByRole("graphics-symbol", { name: "Copy" })
    );
    expect(Copy.displayName).toContain("Icon(");
  });

  it("preserves decorative accessibility", () => {
    const { container } = render(
      <>
        <span id="copy-label">Copy</span>
        <Copy aria-labelledby="copy-label" aria-hidden="true" />
      </>
    );
    expect(container.querySelector("svg")?.getAttribute("role")).toBe(
      "graphics-symbol"
    );
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true"
    );
    expect(screen.queryByRole("graphics-symbol")).toBeNull();
  });

  it("preserves titles and labelled-by semantics inside headings", () => {
    render(
      <Heading>
        <span id="icon-label">Live call</span>
        <Copy aria-labelledby="icon-label">
          <title>Call</title>
        </Copy>
      </Heading>
    );
    expect(
      screen.getByRole("graphics-symbol", { name: "Live call" }).textContent
    ).toContain("Call");
    expect(
      screen
        .getByRole("heading", { level: 1 })
        .contains(screen.getByRole("graphics-symbol"))
    ).toBeTruthy();
  });
});
