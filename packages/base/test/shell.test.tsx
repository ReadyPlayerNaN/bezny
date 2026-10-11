// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Shell } from "../src/index.js";

const navigation = (
  <ul>
    <li>
      <a href="#articles">Articles</a>
    </li>
    <li>
      <a href="#pages">Pages</a>
    </li>
  </ul>
);

describe(Shell, () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("forwards root props and renders one main with a closed navigation modal", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Shell
        ref={ref}
        className="custom-shell"
        data-owner="test"
        header="Brand"
        navigation={navigation}
        footer="Footer"
      >
        Content
      </Shell>
    );
    expect(ref.current?.classList.contains("custom-shell")).toBeTruthy();
    expect(ref.current?.dataset.owner).toBe("test");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("navigation").querySelectorAll("a")).toHaveLength(
      2
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens a named modal, traps focus, closes with Escape and restores the menu trigger", async () => {
    const user = userEvent.setup();
    render(<Shell navigation={navigation} />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const dialog = within(
      await screen.findByRole("dialog", { name: "Entities" })
    );
    expect(dialog.getByRole("navigation", { name: "Entities" })).toBeTruthy();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(
      screen.getByRole("dialog").contains(document.activeElement)
    ).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on ordinary navigation but preserves modified/new-tab activation", async () => {
    const user = userEvent.setup();
    render(<Shell navigation={navigation} />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const link = within(screen.getByRole("dialog")).getByRole("link", {
      name: "Pages",
    });
    fireEvent.click(link, { ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.click(link);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("returns focus to visible sidebar navigation when CSS has hidden the menu trigger", async () => {
    const user = userEvent.setup();
    render(<Shell navigation={navigation} />);
    const sidebar = screen.getByRole("navigation");
    const firstLink = within(sidebar).getByRole("link", { name: "Articles" });
    const rectangle = new DOMRect();
    vi.spyOn(sidebar, "getClientRects").mockReturnValue({
      0: rectangle,
      item: () => rectangle,
      length: 1,
      [Symbol.iterator]: () => [rectangle][Symbol.iterator](),
    });
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(firstLink));
  });

  it("omits navigation controls when no navigation is supplied", () => {
    render(<Shell>Content</Shell>);
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("banner")).toBeNull();
  });

  it("forwards explicit direction and localized labels to the portalled drawer", async () => {
    const user = userEvent.setup();
    render(
      <Shell
        dir="rtl"
        navigation={navigation}
        navigationLabel="الكيانات"
        openNavigationLabel="فتح"
        closeNavigationLabel="إغلاق"
      />
    );
    await user.click(screen.getByRole("button", { name: "فتح" }));
    const dialog = screen.getByRole("dialog", { name: "الكيانات" });
    expect(dialog.getAttribute("dir")).toBe("rtl");
    await user.click(within(dialog).getByRole("button", { name: "إغلاق" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
