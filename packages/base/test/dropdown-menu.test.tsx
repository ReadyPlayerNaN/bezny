// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuItemIndicator,
} from "../src/index.js";

const SelectionMenu = () => {
  const [checked, setChecked] = useState<boolean | "indeterminate">(
    "indeterminate"
  );
  const [value, setValue] = useState("a");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Preferences</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          checked={checked}
          onCheckedChange={setChecked}
          onSelect={(event) => event.preventDefault()}
        >
          Pinned
        </DropdownMenuCheckboxItem>
        <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
          <DropdownMenuRadioItem
            value="a"
            onSelect={(event) => event.preventDefault()}
          >
            Compact
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="b"
            onSelect={(event) => event.preventDefault()}
          >
            Comfortable
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

describe(DropdownMenu, () => {
  afterEach(cleanup);

  it("opens by ArrowDown, skips disabled items, selects by keyboard and restores focus", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn<() => void>();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSelect}>Archive</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Export</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.tab();
    await user.keyboard("{ArrowDown}");
    const archive = await screen.findByRole("menuitem", { name: "Archive" });
    await waitFor(() => expect(document.activeElement).toBe(archive));
    await user.keyboard("{Enter}");
    expect(handleSelect).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Actions" })
    );
  });

  it("supports click opening, typeahead, Escape and caller cancellation of item selection", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn<(event: Event) => void>((event) =>
      event.preventDefault()
    );
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Archive</DropdownMenuItem>
          <DropdownMenuItem onSelect={handleSelect}>Export</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("menu");
    await user.keyboard("e");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("menuitem", { name: "Export" })
      )
    );
    await user.keyboard("{Enter}");
    expect(handleSelect).toHaveBeenCalledOnce();
    expect(screen.getByRole("menu")).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("updates checkbox indeterminate and controlled radio states without forced dismissal", async () => {
    const user = userEvent.setup();
    render(<SelectionMenu />);
    await user.click(screen.getByRole("button", { name: "Preferences" }));
    const checkbox = await screen.findByRole("menuitemcheckbox", {
      name: "Pinned",
    });
    expect(checkbox.getAttribute("aria-checked")).toBe("mixed");
    await user.click(checkbox);
    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    await user.click(
      screen.getByRole("menuitemradio", { name: "Comfortable" })
    );
    expect(
      screen
        .getByRole("menuitemradio", { name: "Comfortable" })
        .getAttribute("aria-checked")
    ).toBe("true");
    expect(
      screen
        .getByRole("menuitemradio", { name: "Compact" })
        .getAttribute("aria-checked")
    ).toBe("false");
  });

  it("opens submenus by ArrowRight, closes them by ArrowLeft and uses explicit portal containers", async () => {
    const user = userEvent.setup();
    const boundary = document.createElement("div");
    boundary.className = "bezny-dark";
    document.body.append(boundary);
    const contentRef = createRef<HTMLDivElement>();
    const subRef = createRef<HTMLDivElement>();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent container={boundary} ref={contentRef}>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent container={boundary} ref={subRef}>
              <DropdownMenuItem>Export</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.tab();
    await user.keyboard("{Enter}");
    const trigger = await screen.findByRole("menuitem", { name: "More" });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await user.keyboard("{ArrowRight}");
    await screen.findByRole("menuitem", { name: "Export" });
    expect(boundary.contains(contentRef.current)).toBeTruthy();
    expect(boundary.contains(subRef.current)).toBeTruthy();
    await user.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(screen.queryByRole("menuitem", { name: "Export" })).toBeNull()
    );
    expect(document.activeElement).toBe(trigger);
    cleanup();
    boundary.remove();
  });

  it("preserves native props, asChild selection composition and DOM refs", async () => {
    const user = userEvent.setup();
    const triggerRef = createRef<HTMLButtonElement>();
    const itemRef = createRef<HTMLDivElement>();
    const handleSubmit = vi.fn<
      (event: React.SubmitEvent<HTMLFormElement>) => void
    >((event) => event.preventDefault());
    render(
      <form onSubmit={handleSubmit}>
        <DropdownMenu>
          <DropdownMenuTrigger ref={triggerRef}>Actions</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-menu">
            <DropdownMenuCheckboxItem asChild checked ref={itemRef}>
              <div className="custom-item">
                <DropdownMenuItemIndicator>✓</DropdownMenuItemIndicator>Visible
              </div>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </form>
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const item = await screen.findByRole("menuitemcheckbox", {
      name: "Visible",
    });
    expect(itemRef.current).toBe(item);
    expect(triggerRef.current).toBe(
      screen.getByRole("button", { hidden: true, name: "Actions" })
    );
    expect(item.classList.contains("custom-item")).toBeTruthy();
    expect(
      screen.getByRole("menu").classList.contains("custom-menu")
    ).toBeTruthy();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("honours controlled open state and disabled trigger and items", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn<(open: boolean) => void>();
    const handleSelect = vi.fn<() => void>();
    const { rerender } = render(
      <DropdownMenu open={false} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled onSelect={handleSelect}>
            Disabled
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(handleOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.queryByRole("menu")).toBeNull();
    rerender(
      <DropdownMenu open onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled onSelect={handleSelect}>
            Disabled
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(await screen.findByRole("menuitem", { name: "Disabled" }));
    expect(handleSelect).not.toHaveBeenCalled();
    cleanup();
    handleOpenChange.mockClear();
    render(
      <DropdownMenu onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger disabled>Disabled trigger</DropdownMenuTrigger>
        <DropdownMenuContent>Content</DropdownMenuContent>
      </DropdownMenu>
    );
    await user.click(screen.getByRole("button", { name: "Disabled trigger" }));
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it("supports uncontrolled defaultOpen and force mounting both content portals", async () => {
    const { rerender } = render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await screen.findByRole("menu");
    rerender(
      <DropdownMenu open={false}>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent forceMount>
          <DropdownMenuSub open={false}>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent forceMount>
              <DropdownMenuItem>Animation target</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    const item = await screen.findByRole("menuitem", {
      name: "Animation target",
    });
    expect(item.closest<HTMLElement>('[role="menu"]')?.dataset.state).toBe(
      "closed"
    );
  });

  it("preserves caller cancellation of outside dismissal in non-modal menus", async () => {
    const user = userEvent.setup();
    const handleInteractOutside = vi.fn<(event: Event) => void>((event) =>
      event.preventDefault()
    );
    render(
      <>
        <button type="button">Outside</button>
        <DropdownMenu modal={false} defaultOpen>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent onInteractOutside={handleInteractOutside}>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
    await screen.findByRole("menu");
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(handleInteractOutside).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("uses reversed submenu keys under RTL", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Export</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    await user.tab();
    await user.keyboard(" ");
    await screen.findByRole("menu");
    await user.keyboard("{ArrowLeft}");
    await screen.findByRole("menuitem", { name: "Export" });
    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.queryByRole("menuitem", { name: "Export" })).toBeNull()
    );
  });
});
