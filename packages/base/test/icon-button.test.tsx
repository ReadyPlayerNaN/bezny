// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Plane } from "lucide-react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Icon, IconButton } from "../src/index.js";

import styles from "../src/controls/button.module.scss";

describe("labelled icons and icon buttons", () => {
  afterEach(cleanup);

  it("shows a standalone icon label on focus and dismisses it with Escape", async () => {
    const user = userEvent.setup();
    render(<Icon icon={Plane} aria-label="Travel" />);
    await user.tab();
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip.textContent).toBe("Travel");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    expect(document.activeElement).toBe(
      screen.getByRole("graphics-symbol", { name: "Travel" })
    );
  });

  it("labels the focusable icon button without an extra icon tab stop", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton
        icon={Plane}
        aria-label="Book travel"
        ref={ref}
        onClick={onClick}
      />
    );
    const button = screen.getByRole("button", { name: "Book travel" });
    expect(ref.current).toBe(button);
    expect(button.classList.contains(styles.iconButton ?? "")).toBeTruthy();
    await user.tab();
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip.textContent).toBe("Book travel");
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
    expect(button.querySelector("svg")?.hasAttribute("tabindex")).toBeFalsy();
  });

  it("links a visible label and preserves disabled and loading behavior", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn<() => void>();
    const { rerender } = render(
      <>
        <span id="travel-action">Travel</span>
        <IconButton
          icon={Plane}
          aria-labelledby="travel-action"
          disabled
          onClick={onClick}
        />
      </>
    );
    const button = screen.getByRole("button", { name: "Travel" });
    expect(button.querySelector("svg")?.getAttribute("aria-labelledby")).toBe(
      "travel-action"
    );
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
    rerender(
      <IconButton icon={Plane} aria-label="Travel" loading onClick={onClick} />
    );
    expect(
      screen.getByRole("button", { name: "Travel" }).getAttribute("aria-busy")
    ).toBe("true");
    await user.click(screen.getByRole("button", { name: "Travel" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("reveals the icon button label on hover", async () => {
    const user = userEvent.setup();
    render(<IconButton icon={Plane} aria-label="Travel" />);
    await user.hover(screen.getByRole("button", { name: "Travel" }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip.textContent).toBe("Travel");
  });
});
