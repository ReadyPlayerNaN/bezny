// @vitest-environment jsdom
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  expandableJsonPaths,
  stringifyJsonValue,
} from "../src/content/json-value.js";
import type { JsonViewerProps } from "../src/index.js";
import { JsonViewer } from "../src/index.js";

const nestedValue = {
  child: { ok: true },
  list: ["one", { result: 42 }],
  name: "Task",
};

const task = () => 1;

describe(JsonViewer, () => {
  afterEach(cleanup);

  it("opens only the root initially and expands individual branches with keyboard and relationships", async () => {
    const user = userEvent.setup();
    render(<JsonViewer value={nestedValue} />);
    const root = screen.getByRole("button", { name: "Root: Object(3)" });
    expect(root.getAttribute("aria-expanded")).toBe("true");
    const child = screen.getByRole("button", { name: "child: Object(1)" });
    expect(child.getAttribute("aria-expanded")).toBe("false");
    child.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("true").textContent).toBe("true");
    const contentId = child.getAttribute("aria-controls");
    const content = document.querySelector<HTMLElement>(`[id="${contentId}"]`);
    expect(content?.hidden).toBeFalsy();
    await user.keyboard(" ");
    expect({
      expanded: child.getAttribute("aria-expanded"),
      focus: document.activeElement,
      hidden: content?.hidden,
      leaf: screen.queryByText("true"),
    }).toStrictEqual({
      expanded: "false",
      focus: child,
      hidden: true,
      leaf: null,
    });
  });

  it("expands/collapses all including arrays without treating repeated references as cycles", async () => {
    const user = userEvent.setup();
    const repeated = { answer: 42 };
    const value = { first: repeated, list: [repeated], second: repeated };
    render(<JsonViewer value={value} />);
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getAllByText("42")).toHaveLength(3);
    expect(screen.queryByText("[Circular]")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.queryByText("42")).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Root: Object(3)" })
        .getAttribute("aria-expanded")
    ).toBe("false");
  });

  it("switches raw/tree using Radix roving focus and retains expansion", async () => {
    const user = userEvent.setup();
    render(<JsonViewer value={nestedValue} />);
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    const tree = screen.getByRole("radio", { name: "Tree" });
    tree.focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(screen.getByLabelText("Raw", { selector: "pre" }).textContent).toBe(
      JSON.stringify(nestedValue, null, 2)
    );
    expect(
      screen
        .getByRole("button", { name: "Expand all" })
        .hasAttribute("disabled")
    ).toBeTruthy();
    await user.click(tree);
    expect(screen.getByText("42").textContent).toBe("42");
    await user.click(tree);
    expect(tree.getAttribute("aria-checked")).toBe("true");
  });

  it("provides escaped RFC 6901 pointers, display keys, and an interactive leaf seam", async () => {
    const user = userEvent.setup();
    const inspect = vi.fn<() => void>();
    const renderLeaf = vi.fn<NonNullable<JsonViewerProps["renderLeaf"]>>(
      ({ path, formattedValue }) =>
        path === "/a~1b/~0key/0/" ? (
          <button type="button" onClick={inspect}>
            {formattedValue}
          </button>
        ) : undefined
    );
    render(
      <JsonViewer
        value={{ "a/b": { "~key": [{ "": "override" }] } }}
        renderLeaf={renderLeaf}
      />
    );
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(renderLeaf).toHaveBeenCalledWith({
      formattedValue: '"override"',
      key: "",
      path: "/a~1b/~0key/0/",
      value: "override",
    });
    const leaf = screen.getByRole("button", { name: '"override"' });
    leaf.focus();
    await user.keyboard("{Enter}");
    expect(inspect).toHaveBeenCalledOnce();
  });

  it("renders root and array-index leaf contexts and falls back on undefined", async () => {
    const user = userEvent.setup();
    const renderLeaf = vi.fn<NonNullable<JsonViewerProps["renderLeaf"]>>();
    const { rerender } = render(
      <JsonViewer value={null} renderLeaf={renderLeaf} />
    );
    expect(renderLeaf).toHaveBeenCalledWith({
      formattedValue: "null",
      key: null,
      path: "",
      value: null,
    });
    rerender(<JsonViewer value={["item"]} renderLeaf={renderLeaf} />);
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(renderLeaf).toHaveBeenCalledWith({
      formattedValue: '"item"',
      key: "[0]",
      path: "/0",
      value: "item",
    });
    expect(screen.getByText('"item"').textContent).toBe('"item"');
  });

  it("safely presents cycles, non-JSON scalars, dates, sparse arrays, and null-prototype objects", async () => {
    const user = userEvent.setup();
    const sparse: unknown[] = [];
    sparse.length = 1;
    const value: Record<string, unknown> = Object.assign(Object.create(null), {
      big: 7n,
      callable: task,
      date: new Date("2026-01-02T00:00:00.000Z"),
      invalid: new Date("invalid"),
      missing: undefined,
      regexp: /abc/u,
      sparse,
      symbol: Symbol("sample"),
    });
    value.self = value;
    render(<JsonViewer value={value} />);
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    for (const label of [
      "7n",
      "Symbol(sample)",
      "Date(2026-01-02T00:00:00.000Z)",
      "Date(Invalid Date)",
      "/abc/u",
      "[Function task]",
      "[Circular]",
    ]) {
      expect(screen.getByText(label).textContent).toBe(label);
    }
    expect(screen.getAllByText("undefined")).toHaveLength(2);
    await user.click(screen.getByRole("radio", { name: "Raw" }));
    const raw = screen.getByLabelText("Raw", { selector: "pre" }).textContent;
    expect(JSON.parse(raw ?? "{}")).toMatchObject({
      big: "7n",
      invalid: "Invalid Date",
      missing: "[undefined]",
      self: "[Circular]",
    });
  });

  it("escapes markup, handles inspection errors, and does not mutate values", () => {
    const value = Object.freeze({ html: '<img src=x onerror="alert(1)">' });
    const { container, rerender } = render(<JsonViewer value={value} />);
    expect(container.querySelector("img")).toBeNull();
    expect(value.html).toBe('<img src=x onerror="alert(1)">');
    const unreadable = {
      get broken() {
        throw new Error("Unavailable");
      },
    };
    rerender(<JsonViewer value={unreadable} />);
    expect(
      screen.getByText("Unable to inspect value: Unavailable").textContent
    ).toBe("Unable to inspect value: Unavailable");
    expect(stringifyJsonValue(unreadable)).toBe(
      "Unable to inspect value: Unavailable"
    );
  });

  it("forwards refs, classes and native props and supports labels/default raw/external updates", () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(
      <JsonViewer
        ref={ref}
        className="custom"
        id="payload"
        label="Payload"
        defaultMode="raw"
        labels={{ raw: "Source", tree: "Structure" }}
        value={123}
      />
    );
    expect(ref.current).toBe(screen.getByRole("region", { name: "Payload" }));
    expect(ref.current?.classList.contains("custom")).toBeTruthy();
    expect(ref.current?.id).toBe("payload");
    expect(
      screen.getByLabelText("Source", { selector: "pre" }).textContent
    ).toBe("123");
    rerender(<JsonViewer defaultMode="raw" value="updated" />);
    expect(screen.getByLabelText("Raw", { selector: "pre" }).textContent).toBe(
      '"updated"'
    );
  });

  it("does not submit a surrounding form", () => {
    const submit = vi.fn<(event: FormEvent<HTMLFormElement>) => void>((event) =>
      event.preventDefault()
    );
    render(
      <form onSubmit={submit}>
        <JsonViewer value={{ child: {} }} />
      </form>
    );
    fireEvent.click(screen.getByRole("button", { name: "child: Object(0)" }));
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(submit).not.toHaveBeenCalled();
  });

  it("collects canonical paths without recursive call-stack traversal or repeated-reference loss", () => {
    const child = { "": {} };
    expect(
      [...expandableJsonPaths({ "a/b": child, "~": child })].toSorted()
    ).toStrictEqual(["", "/a~1b", "/a~1b/", "/~0", "/~0/"]);
    expect(stringifyJsonValue({ one: child, two: child })).not.toContain(
      "Circular"
    );
  });
});
