// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "../src/index.js";

describe(ContextMenu, () => {
  afterEach(cleanup);

  it("preserves force-mounted menu content for controlled animation integrations", async () => {
    render(
      <ContextMenu open={false}>
        <ContextMenuTrigger>Row</ContextMenuTrigger>
        <ContextMenuContent forceMount>
          <ContextMenuItem>Animation target</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
    await expect(
      screen.findByRole("menuitem", { name: "Animation target" })
    ).resolves.toBeTruthy();
  });

  it("opens by keyboard, skips disabled items, selects, and restores focus", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn<() => void>();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Row</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled>Disabled</ContextMenuItem>
          <ContextMenuItem onSelect={handleSelect}>Archive</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
    await user.tab();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");
    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("menuitem", { name: "Archive" })
      )
    );
    await user.keyboard("{Enter}");
    expect(handleSelect).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(document.activeElement?.textContent).toBe("Row");
  });

  it("supports right-click, checkable items and submenus", async () => {
    const user = userEvent.setup();
    const handleCheckedChange =
      vi.fn<(checked: boolean | "indeterminate") => void>();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Row</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuCheckboxItem
            checked="indeterminate"
            onCheckedChange={handleCheckedChange}
          >
            Pinned
          </ContextMenuCheckboxItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Export</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    );
    fireEvent.contextMenu(screen.getByText("Row"), {
      clientX: 20,
      clientY: 20,
    });
    const checkbox = await screen.findByRole("menuitemcheckbox");
    expect(checkbox.getAttribute("aria-checked")).toBe("mixed");
    await user.click(screen.getByRole("menuitemcheckbox"));
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
    fireEvent.contextMenu(screen.getByText("Row"));
    screen.getByRole("menuitem", { name: "More" }).focus();
    await user.keyboard("{ArrowRight}");
    await screen.findByRole("menuitem", { name: "Export" });
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("menuitem", { name: "Export" })).toBeNull()
    );
  });

  it("honours cancelled keyboard opening", async () => {
    const user = userEvent.setup();
    render(
      <ContextMenu>
        <ContextMenuTrigger onKeyDown={(event) => event.preventDefault()}>
          Row
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Archive</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
    await user.tab();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
