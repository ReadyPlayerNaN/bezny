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
import { EntityCard, EntityRowList, SelectableRow } from "../src/index.js";
import type { EntityRowData } from "../src/index.js";

describe("Entity rows", () => {
  afterEach(cleanup);

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
