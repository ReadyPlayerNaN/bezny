// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  EntityRowListSkeleton,
  EntityRowSkeleton,
  LoadingSkeleton,
  Skeleton,
} from "../src/index.js";

describe(Skeleton, () => {
  afterEach(cleanup);

  it("forwards native props and refs while keeping placeholders decorative", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Skeleton
        ref={ref}
        id="placeholder"
        className="custom"
        variant="circle"
        aria-hidden={false}
      />
    );
    expect(ref.current?.id).toBe("placeholder");
    expect(ref.current?.classList.contains("custom")).toBeTruthy();
    expect(ref.current?.dataset.variant).toBe("circle");
    expect(ref.current?.getAttribute("aria-hidden")).toBe("true");
    expect(ref.current?.hasAttribute("tabindex")).toBeFalsy();
  });

  it("announces one localized status without exposing placeholder content", () => {
    const { rerender } = render(
      <LoadingSkeleton label="Načítání společností">
        <Skeleton variant="heading" />
        <Skeleton />
      </LoadingSkeleton>
    );
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("Načítání společností");
    expect(
      status.parentElement
        ?.querySelector("[aria-hidden=true]")
        ?.hasAttribute("inert")
    ).toBeTruthy();
    rerender(<p>Companies loaded</p>);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Companies loaded")).toBeTruthy();
  });
});

describe(EntityRowListSkeleton, () => {
  afterEach(cleanup);

  it("renders compact entity geometry without links, checkboxes, or menus", () => {
    const { container } = render(
      <EntityRowListSkeleton
        label="Loading companies"
        rows={2}
        variant="small"
        leading
      />
    );
    expect(
      screen.getAllByRole("status").map((status) => status.textContent)
    ).toStrictEqual(["Loading companies"]);
    expect(container.querySelectorAll("div[data-variant=small]")).toHaveLength(
      2
    );
    expect(
      container.querySelectorAll("span[data-variant=circle]")
    ).toHaveLength(2);
    expect(container.querySelectorAll("span[data-variant=text]")).toHaveLength(
      4
    );
    expect(
      container.querySelectorAll("a, input, button, [tabindex]")
    ).toHaveLength(0);
  });

  it("supports a standalone row and title-only layout with native refs", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <EntityRowSkeleton ref={ref} description={false} className="custom" />
    );
    expect(ref.current?.dataset.variant).toBe("default");
    expect(ref.current?.getAttribute("aria-hidden")).toBe("true");
    expect(ref.current?.classList.contains("custom")).toBeTruthy();
    expect(ref.current?.querySelectorAll("span")).toHaveLength(1);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid row count %s",
    (rows) => {
      expect(() =>
        render(<EntityRowListSkeleton label="Loading" rows={rows} />)
      ).toThrow(RangeError);
    }
  );
});
