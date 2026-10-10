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

import { combineEntityRowActions } from "../src/content/entity-row-actions.js";
import {
  EntityCard,
  EntityRow,
  EntityRowList,
  SelectableRow,
} from "../src/index.js";
import type { EntityRowData } from "../src/index.js";

describe("Entity rows", () => {
  afterEach(cleanup);

  it("supports application-controlled selection and row-only menus", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn<(ids: string[]) => void>();
    const handleAction = vi.fn<() => void>();
    const rows = ["a", "b"].map((id) => ({
      actions: [
        { key: "archive", label: `Archive ${id}`, onSelect: handleAction },
      ],
      id,
      title: id,
    }));
    render(
      <EntityRowList
        rows={rows}
        selectedIds={["b"]}
        onSelectedIdsChange={handleChange}
        selectable
        selectionMenu={false}
      />
    );
    await user.click(screen.getByRole("checkbox", { name: "Select a" }));
    expect(handleChange).toHaveBeenCalledExactlyOnceWith(["b", "a"]);
    expect(
      screen
        .getByRole("checkbox", { name: "Deselect b" })
        .getAttribute("aria-checked")
    ).toBe("true");
    fireEvent.contextMenu(screen.getByRole("group", { name: "Item b" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Archive b" })
    );
    expect(handleAction).toHaveBeenCalledOnce();
    expect(handleChange).toHaveBeenCalledOnce();
  });

  it("uses explicit shared commands for multiple selected rows without clearing caller-owned confirmation state", async () => {
    const user = userEvent.setup();
    const requestDeletion = vi.fn<() => void>();
    const changeSelection = vi.fn<(ids: string[]) => void>();
    render(
      <EntityRowList
        selectable
        selectedIds={["1", "2"]}
        onSelectedIdsChange={changeSelection}
        selectionActions={[
          {
            key: "delete-selected",
            label: "Delete selected records",
            onSelect: requestDeletion,
          },
        ]}
        rows={[
          {
            actions: [
              {
                key: "view-1",
                label: "View One",
                onSelect: vi.fn<() => void>(),
              },
            ],
            id: "1",
            title: "One",
          },
          { id: "2", title: "Two" },
        ]}
      />
    );
    const row = screen.getByRole("group", { name: "Item 1" });
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(screen.queryByRole("menuitem", { name: "View One" })).toBeNull();
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete selected records" })
    );
    expect(requestDeletion).toHaveBeenCalledOnce();
    expect(changeSelection).not.toHaveBeenCalled();
  });

  it("accepts localized group and context-menu labels", async () => {
    const user = userEvent.setup();
    render(
      <EntityRowList
        rows={[
          {
            actions: [
              { key: "edit", label: "Upravit", onSelect: vi.fn<() => void>() },
            ],
            id: "1",
            title: "Záznam",
          },
        ]}
        groupLabel={(row) => `Položka ${row.id}`}
        menuLabel={(row) => `Akce pro ${row.title}`}
      />
    );
    const row = screen.getByRole("group", { name: "Položka 1" });
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await expect(
      screen.findByRole("menu", { name: "Akce pro Záznam" })
    ).resolves.toBeTruthy();
  });

  it("keeps read-only rows out of tab order while actionable rows remain keyboard accessible", async () => {
    const user = userEvent.setup();
    render(
      <EntityRowList
        rows={[
          { id: "readonly", title: "Read only" },
          {
            actions: [
              {
                key: "archive",
                label: "Archive",
                onSelect: vi.fn<() => void>(),
              },
            ],
            id: "action",
            title: "Action",
          },
        ]}
      />
    );
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("group", { name: "Item action" })
    );
  });

  it("gives standalone rows local context menus and a caller-owned portal boundary", async () => {
    const user = userEvent.setup();
    const container = document.createElement("div");
    container.className = "bezny-dark";
    document.body.append(container);
    const handleSelect = vi.fn<() => void>();
    render(
      <EntityRow
        id="a"
        title="Alpha"
        menuContainer={container}
        actions={[{ key: "archive", label: "Archive", onSelect: handleSelect }]}
      />
    );
    fireEvent.contextMenu(screen.getByRole("group", { name: "Item a" }));
    const menu = await screen.findByRole("menu");
    expect(container.contains(menu)).toBeTruthy();
    await user.click(screen.getByRole("menuitem", { name: "Archive" }));
    expect(handleSelect).toHaveBeenCalledOnce();
    container.remove();
  });

  it("intersects submenu actions and invokes corresponding callbacks for every selected row", async () => {
    const handleFirst = vi.fn<() => void>();
    const handleSecond = vi.fn<() => void>();
    const handleSuccess = vi.fn<() => void>();
    const [parent] = combineEntityRowActions(
      [
        {
          actions: [
            {
              key: "more",
              label: "More",
              onSelect: handleFirst,
              submenu: [
                { key: "archive", label: "Archive", onSelect: handleFirst },
              ],
            },
          ],
          id: "a",
        },
        {
          actions: [
            {
              key: "more",
              label: "More",
              onSelect: handleSecond,
              submenu: [
                { key: "archive", label: "Archive", onSelect: handleSecond },
              ],
            },
          ],
          id: "b",
        },
      ],
      handleSuccess
    );
    const [child] = parent?.submenu ?? [];
    await child?.onSelect?.();
    expect(handleFirst).toHaveBeenCalledOnce();
    expect(handleSecond).toHaveBeenCalledOnce();
    expect(handleSuccess).toHaveBeenCalledOnce();
  });

  it("ports title, badge, metadata, version links and entity cards without router coupling", () => {
    render(
      <>
        <EntityRowList
          rows={[
            {
              badge: "Ready",
              description: "Description",
              expanded: <span>Expanded</span>,
              id: "a",
              meta: "Today",
              title: "Alpha",
              titleHref: "/alpha",
              versionNumber: 2,
            },
          ]}
        />
        <EntityCard
          title="Beta"
          titleHref="/beta"
          description="Card details"
          versionNumber={3}
        />
      </>
    );
    expect(
      screen.getByRole("link", { name: "Alpha" }).getAttribute("href")
    ).toBe("/alpha");
    expect(screen.getByRole("link", { name: "v2" }).getAttribute("href")).toBe(
      "/alpha"
    );
    expect(screen.getByText("Ready")).toBeTruthy();
    expect(screen.getByText("Expanded")).toBeTruthy();
    expect(screen.getByText("Card details")).toBeTruthy();
  });

  it("intersects bulk actions, executes once, clears selection, and prunes removed rows", async () => {
    const user = userEvent.setup();
    const handleBulk = vi.fn<(ids: string[]) => void>();
    const handleSelect = vi.fn<() => void>();
    const rows: EntityRowData[] = ["a", "b"].map((id) => ({
      actions: [
        {
          key: "archive",
          label: "Archive",
          onBulkSelect: handleBulk,
          onSelect: handleSelect,
        },
        {
          bulkable: false,
          key: "private",
          label: "Private",
          onSelect: handleSelect,
        },
        { href: `/${id}`, key: "link", label: "Open" },
      ],
      id,
      title: id,
    }));
    const { rerender } = render(<EntityRowList rows={rows} />);
    await user.click(screen.getByRole("checkbox", { name: "Select a" }));
    await user.click(screen.getByRole("checkbox", { name: "Select b" }));
    fireEvent.contextMenu(screen.getByRole("group", { name: "Item a" }));
    await screen.findByRole("menu");
    expect(screen.queryByRole("menuitem", { name: "Private" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "Open" })).toBeNull();
    await user.click(screen.getByRole("menuitem", { name: "Archive" }));
    await waitFor(() => expect(handleBulk).toHaveBeenCalledWith(["a", "b"]));
    await waitFor(() =>
      expect(
        screen
          .getByRole("checkbox", { name: "Select a" })
          .getAttribute("aria-checked")
      ).toBe("false")
    );
    expect(handleSelect).not.toHaveBeenCalled();
    await user.click(screen.getByRole("checkbox", { name: "Select a" }));
    rerender(<EntityRowList rows={rows.slice(1)} />);
    rerender(<EntityRowList rows={rows} />);
    expect(
      screen
        .getByRole("checkbox", { name: "Select a" })
        .getAttribute("aria-checked")
    ).toBe("false");
  });

  it("keeps failed asynchronous actions retryable without unhandled rejections", async () => {
    const user = userEvent.setup();
    const handleError = vi.fn<(error: unknown) => void>();
    render(
      <SelectableRow
        selected={false}
        selectable={false}
        selectLabel="Select"
        onSelect={() => {}}
        onActionError={handleError}
        menuItems={[
          {
            key: "fail",
            label: "Fail",
            onSelect: () => Promise.reject(new Error("Failure")),
          },
        ]}
      >
        Row
      </SelectableRow>
    );
    fireEvent.contextMenu(screen.getByText("Row"));
    await user.click(await screen.findByRole("menuitem", { name: "Fail" }));
    await screen.findByRole("alert");
    expect(handleError).toHaveBeenCalledOnce();
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("preserves drag selection and Shift-drag clearing", async () => {
    const user = userEvent.setup();
    const rows: EntityRowData[] = ["a", "b"].map((id) => ({
      actions: [{ key: "archive", label: "Archive", onSelect: () => {} }],
      id,
      title: id,
    }));
    render(<EntityRowList rows={rows} />);
    await user.click(screen.getByRole("checkbox", { name: "Select a" }));
    const first = screen.getByRole("group", { name: "Item a" });
    const second = screen.getByRole("group", { name: "Item b" });
    fireEvent.mouseDown(first, { button: 0 });
    fireEvent.mouseOver(second, { buttons: 1 });
    fireEvent.mouseUp(window);
    expect(
      screen
        .getByRole("checkbox", { name: "Deselect b" })
        .getAttribute("aria-checked")
    ).toBe("true");
    fireEvent.mouseDown(first, { button: 0 });
    fireEvent.mouseOver(second, { buttons: 1, shiftKey: true });
    fireEvent.mouseUp(window);
    expect(
      screen
        .getByRole("checkbox", { name: "Select a" })
        .getAttribute("aria-checked")
    ).toBe("false");
    expect(
      screen
        .getByRole("checkbox", { name: "Select b" })
        .getAttribute("aria-checked")
    ).toBe("false");
  });
});
