import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Showcase } from "../src/showcase.js";

describe("component showcase", () => {
  afterEach(cleanup);

  it("renders semantic headings with automatically nested levels", () => {
    render(<Showcase />);

    expect(screen.getByRole("main")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Bezny component showcase",
      })
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: "Headings" })
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 3, name: "Nested heading" })
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 4, name: "Deeper heading" })
    ).toBeTruthy();
  });

  it("renders explicit heading context through level six", () => {
    render(<Showcase />);

    expect(
      screen.getByRole("heading", { level: 5, name: "Explicit heading level" })
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 6, name: "Level six heading" })
    ).toBeTruthy();
    expect(screen.getByText("useHeadingLevel reports level 5.")).toBeTruthy();
  });

  it("renders an accessible icon", () => {
    render(<Showcase />);

    expect(
      screen.getByRole("graphics-symbol", { name: "Airplane" })
    ).toBeTruthy();
    expect(
      screen.getByRole("graphics-symbol", { name: "Wrapped airplane" })
    ).toBeTruthy();
  });

  it("updates the interactive example and renders disabled and loading states", () => {
    render(<Showcase />);

    fireEvent.click(screen.getByRole("button", { name: "Primary" }));
    expect(
      screen.getByRole("status", { name: "Primary click count" }).textContent
    ).toBe("Primary button clicks: 1");
    expect(
      screen.getByRole("button", { name: "Disabled" }).hasAttribute("disabled")
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Loading" }).getAttribute("aria-busy")
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Submit" }).getAttribute("type")
    ).toBe("submit");
  });
});
