import { adminSelectionAtom } from "@bezny/admin/entities";
import { createMemoryHistory } from "@tanstack/react-router";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { atom } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDemoApplication, DemoApp } from "../src/demo-application.js";
import type { DemoApplication } from "../src/demo-application.js";

const applications: DemoApplication[] = [];

const selectedArticleIdsAtom = atom(
  (get) => get(adminSelectionAtom)?.ids ?? []
);

const renderDemo = async (pathname = "/articles") => {
  const history = createMemoryHistory({ initialEntries: [pathname] });
  const application = createDemoApplication(history);
  applications.push(application);
  render(<DemoApp application={application} />);
  await screen.findByRole("heading", { level: 1 });
  return {
    application,
    history,
    main: within(screen.getByRole("main")),
    user: userEvent.setup(),
  };
};

const openPalette = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Command palette" }));
  return within(await screen.findByRole("dialog", { name: "Command palette" }));
};

const runCommand = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string
) => {
  const palette = await openPalette(user);
  await user.type(
    palette.getByRole("textbox", { name: "Search commands" }),
    label
  );
  await user.click(palette.getByRole("button", { name: label }));
};

describe("editorial admin", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    for (const application of applications.splice(0)) {
      application.dispose();
    }
    vi.restoreAllMocks();
  });

  it("renders a customized admin shell and redirects the root to the article collection", async () => {
    const { application, main } = await renderDemo("/");
    expect(application.router.state.location.pathname).toBe("/articles");
    expect(
      main.getByRole("region", { name: "Articles in this workspace" })
    ).toBeDefined();
    expect(
      screen.getByRole("navigation", { name: "Editorial navigation" })
    ).toBeDefined();
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Articles");
    expect(screen.getByRole("main").parentElement?.className).toContain(
      "application"
    );
  });

  it("moves live context out of the banner into the bottom status bar", async () => {
    await renderDemo();
    const banner = within(screen.getByRole("banner"));
    const context = screen.getByRole("status", { name: "Current context" });
    expect(
      banner.queryByRole("status", { name: "Current context" })
    ).toBeNull();
    expect(
      within(screen.getByRole("contentinfo")).getByRole("status", {
        name: "Current context",
      })
    ).toBe(context);
    expect(context.className).toContain("statusBar");
    expect(context.textContent).toBe("Context: Articles");
  });

  it("uses icon-only header tools with languages before the command palette and keyboard dropdown focus", async () => {
    const { user } = await renderDemo();
    const language = screen.getByRole("button", { name: "UI language" });
    const palette = screen.getByRole("button", { name: "Command palette" });
    expect([language.textContent, palette.textContent]).toStrictEqual(["", ""]);
    expect(
      language.parentElement?.querySelectorAll(
        'svg[role="graphics-symbol"][aria-hidden="true"]'
      )
    ).toHaveLength(2);
    expect(language.nextElementSibling).toBe(palette);
    language.focus();
    await user.keyboard("{ArrowDown}");
    const current = await screen.findByRole("menuitemradio", {
      name: "Change language to English",
    });
    expect(current.getAttribute("aria-checked")).toBe("true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(language));
  });

  it("limits page navigation to lists while retaining creation in page headers and the palette", async () => {
    const { user, main } = await renderDemo();
    const navigation = within(
      screen.getByRole("navigation", { name: "Editorial navigation" })
    );
    expect(
      navigation.getAllByRole("button").map((button) => button.textContent)
    ).toStrictEqual(["List articles", "List pages"]);
    expect(main.getByRole("button", { name: "Create article" })).toBeDefined();
    const palette = await openPalette(user);
    expect(
      palette.getByRole("button", { name: "Create article" })
    ).toBeDefined();
    expect(palette.getByRole("button", { name: "Create page" })).toBeDefined();
  });

  it.each([
    { create: "Create article", entity: "articles", heading: "Articles" },
    { create: "Create page", entity: "pages", heading: "Pages" },
  ])(
    "places $create beside its collection heading",
    async ({ entity, heading, create }) => {
      const { main } = await renderDemo(`/${entity}`);
      const title = main.getByRole("heading", { level: 1, name: heading });
      const row = title.parentElement;
      const button = main.getByRole("button", { name: create });
      expect(row?.dataset.adminPageHeadingRow).toBe("true");
      expect(row?.lastElementChild?.contains(button)).toBeTruthy();
      expect(row?.nextElementSibling?.textContent).toBe(
        `Write, publish, and manage your ${entity}.`
      );
    }
  );

  it.each([
    { entity: "articles", title: "Welcome to Bezny" },
    { entity: "pages", title: "About us" },
  ])(
    "provides a detail hyperlink on every $entity row and supports keyboard navigation",
    async ({ entity, title }) => {
      const { user, main, application } = await renderDemo(`/${entity}`);
      for (const row of main.getAllByRole("group")) {
        expect(within(row).getByRole("link").getAttribute("href")).toBe(
          `/${entity}/${row.dataset.selectionId}`
        );
      }
      const link = main.getByRole("link", { name: title });
      link.focus();
      await user.keyboard("{Enter}");
      await main.findByRole("heading", { level: 1, name: title });
      expect(application.router.state.location.pathname).toBe(`/${entity}/1`);
    }
  );

  it("uses shared EntityRow menus without changing a row action's target to the selection", async () => {
    const { user, main, application } = await renderDemo();
    await user.click(
      main.getByRole("checkbox", { name: "Select Planning the next release" })
    );
    const row = main.getByRole("group", { name: "Item 1" });
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await screen.findByRole("menu");
    expect(
      screen.queryByRole("menuitem", {
        name: "Delete Planning the next release",
      })
    ).toBeNull();
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(row);
    fireEvent.contextMenu(row);
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete Welcome to Bezny" })
    );
    const dialog = within(await screen.findByRole("alertdialog"));
    expect(
      dialog.getByText(/This permanently deletes Welcome to Bezny/u)
    ).toBeDefined();
    await user.click(dialog.getByRole("button", { name: "Confirm deletion" }));
    await waitFor(() =>
      expect(
        application.repository.inspect("articles").map((record) => record.id)
      ).toStrictEqual(["2", "3"])
    );
  });

  it("hides inline row actions and confirms shared selection actions from selected-row menus", async () => {
    const { user, main, application } = await renderDemo();
    const row = main.getByRole("group", { name: "Item 1" });
    expect(
      within(row).queryByRole("button", { name: "Delete Welcome to Bezny" })
    ).toBeNull();
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    await user.click(
      main.getByRole("checkbox", { name: "Select Planning the next release" })
    );
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    expect(
      screen.queryByRole("menuitem", { name: "Edit Welcome to Bezny" })
    ).toBeNull();
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete selected articles" })
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Cancel deletion",
      })
    );
    expect(application.store.get(selectedArticleIdsAtom)).toStrictEqual([
      "1",
      "2",
    ]);
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete selected articles" })
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Confirm deletion",
      })
    );
    await waitFor(() =>
      expect(
        application.repository.inspect("articles").map((record) => record.id)
      ).toStrictEqual(["3"])
    );
    expect(application.store.get(selectedArticleIdsAtom)).toStrictEqual([]);
  });

  it("shows a compact selection bar with wrapped Lucide icons and keyboard-operated shared actions", async () => {
    const { user, main } = await renderDemo();
    expect(main.queryByRole("group", { name: "Selected items" })).toBeNull();
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    await user.click(
      main.getByRole("checkbox", { name: "Select Planning the next release" })
    );
    const bar = main.getByRole("group", { name: "Selected items" });
    expect(bar.textContent).toBe("2 selected");
    expect(
      bar.querySelectorAll('svg[role="graphics-symbol"][aria-hidden="true"]')
    ).toHaveLength(2);
    const trigger = within(bar).getByRole("button", {
      name: "Selection actions",
    });
    trigger.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menuitem", { name: "Delete selected articles" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await user.click(
      within(bar).getByRole("button", { name: "Clear selection" })
    );
    expect(main.queryByRole("group", { name: "Selected items" })).toBeNull();
  });

  it("restores selection-menu trigger focus after cancelling shared deletion", async () => {
    const { user, main, application } = await renderDemo();
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    const trigger = main.getByRole("button", { name: "Selection actions" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const item = await screen.findByRole("menuitem", {
      name: "Delete selected articles",
    });
    expect(document.activeElement).toBe(item);
    await user.keyboard("{Enter}");
    const dialog = within(await screen.findByRole("alertdialog"));
    expect(document.activeElement).toBe(
      dialog.getByRole("button", { name: "Cancel deletion" })
    );
    await user.click(dialog.getByRole("button", { name: "Cancel deletion" }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(application.store.get(selectedArticleIdsAtom)).toStrictEqual(["1"]);
  });

  it("shares filter execution between ordinary controls and parameterized palette commands", async () => {
    const { user, main } = await renderDemo();
    await user.click(main.getByRole("button", { name: "Search: All" }));
    await user.type(
      screen.getByRole("textbox", { name: "Search" }),
      "Planning"
    );
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() =>
      expect(
        main.queryByRole("heading", { name: "Welcome to Bezny" })
      ).toBeNull()
    );
    await user.click(screen.getByRole("button", { name: "Command palette" }));
    await user.click(screen.getByRole("button", { name: "Filter by Search" }));
    const input = screen.getByRole("textbox", { name: "Search" });
    await user.clear(input);
    await user.type(input, "Welcome");
    await user.click(screen.getByRole("button", { name: "Apply command" }));
    await main.findByRole("heading", { name: "Welcome to Bezny" });
    expect(main.getByLabelText("Pagination").textContent).toBe(
      "Page 1 of 1 · 1 records"
    );
  });

  it("configures choice filters and page size through parameterized palette commands", async () => {
    const { application, user, main } = await renderDemo();
    await user.click(screen.getByRole("button", { name: "Command palette" }));
    await user.click(screen.getByRole("button", { name: "Filter by Status" }));
    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Draft" }));
    await user.click(screen.getByRole("button", { name: "Apply command" }));
    await waitFor(() =>
      expect(main.getByLabelText("Pagination").textContent).toBe(
        "Page 1 of 1 · 1 records"
      )
    );
    await user.click(screen.getByRole("button", { name: "Command palette" }));
    await user.click(screen.getByRole("button", { name: "Change page size" }));
    await user.click(
      screen.getByRole("combobox", { name: "Records per page" })
    );
    await user.click(await screen.findByRole("option", { name: "10" }));
    await user.click(screen.getByRole("button", { name: "Apply command" }));
    await waitFor(() =>
      expect(
        application.store.get(application.session.snapshotAtom).query.pageSize
      ).toBe(10)
    );
  });

  it("paginates through the palette and resets page/selection when filtering", async () => {
    const { application, user, main } = await renderDemo();
    await act(async () => {
      await application.session.create("articles", {
        body: "Additional content",
        published: false,
        title: "Fourth article",
      });
    });
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    await user.click(screen.getByRole("button", { name: "Command palette" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await main.findByRole("heading", { name: "Fourth article" });
    expect(main.getByLabelText("Pagination").textContent).toBe(
      "Page 2 of 2 · 4 records"
    );
    expect(application.store.get(adminSelectionAtom)).toBeNull();
    await user.click(main.getByRole("button", { name: "Search: All" }));
    await user.type(screen.getByRole("textbox", { name: "Search" }), "Welcome");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    await main.findByRole("heading", { name: "Welcome to Bezny" });
    expect(main.getByLabelText("Pagination").textContent).toBe(
      "Page 1 of 1 · 1 records"
    );
  });

  it("clamps pagination after deleting the last record on a later page", async () => {
    const { application, user, main } = await renderDemo();
    await act(async () => {
      await application.session.create("articles", {
        body: "Page boundary",
        published: false,
        title: "Fourth article",
      });
    });
    await user.click(await main.findByRole("button", { name: "Next page" }));
    fireEvent.contextMenu(await main.findByRole("group", { name: "Item 4" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete Fourth article" })
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Confirm deletion",
      })
    );
    await waitFor(() =>
      expect(main.getByLabelText("Pagination").textContent).toBe(
        "Page 1 of 1 · 3 records"
      )
    );
    expect(main.queryByRole("heading", { name: "Fourth article" })).toBeNull();
  });

  it("restores keyboard focus to the owning entity row after cancelling its menu confirmation", async () => {
    const { user, main } = await renderDemo();
    const row = main.getByRole("group", { name: "Item 1" });
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    const item = await screen.findByRole("menuitem", {
      name: "Delete Welcome to Bezny",
    });
    item.focus();
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(
      screen.getByRole("menuitem", { name: "Edit Welcome to Bezny" })
    );
    await user.keyboard("{ArrowDown}{Enter}");
    const dialog = within(await screen.findByRole("alertdialog"));
    await user.click(dialog.getByRole("button", { name: "Cancel deletion" }));
    await waitFor(() => expect(document.activeElement).toBe(row));
  });

  it("creates an article using RHF fields, validation, submission, and focus refs", async () => {
    const { user, main, application } = await renderDemo("/articles/create");
    await user.click(main.getByRole("button", { name: "Save article" }));
    await expect(main.findByText("Enter a title.")).resolves.toBeDefined();
    expect(document.activeElement).toBe(
      main.getByRole("textbox", { name: "Title" })
    );
    await user.type(
      main.getByRole("textbox", { name: "Title" }),
      "New article"
    );
    await user.type(
      main.getByRole("textbox", { name: "Body" }),
      "A new publication."
    );
    await user.click(main.getByRole("checkbox", { name: "Published" }));
    await user.click(main.getByRole("button", { name: "Save article" }));
    await main.findByRole("heading", { level: 1, name: "New article" });
    expect(application.router.state.location.pathname).toBe("/articles/4");
    expect(
      application.repository
        .inspect("articles")
        .find((article) => article.id === "4")
    ).toStrictEqual({
      body: "A new publication.",
      content: { en: { body: "A new publication.", title: "New article" } },
      id: "4",
      published: true,
      sourceLocale: "en",
      title: "New article",
    });
    expect(
      screen.getByRole("status", { name: "Notifications" }).textContent
    ).toBe("Article created.");
  });

  it("opens row detail and edit actions and persists changes in the same workspace", async () => {
    const { user, main, application } = await renderDemo();
    const row = main.getByRole("group", { name: "Item 1" });
    fireEvent.contextMenu(row);
    await user.click(
      await screen.findByRole("menuitem", { name: "View Welcome to Bezny" })
    );
    await main.findByRole("heading", { level: 1, name: "Welcome to Bezny" });
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Article 1");
    await user.click(
      main.getByRole("button", { name: "Actions for Welcome to Bezny" })
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Edit Welcome to Bezny" })
    );
    const title = await main.findByRole("textbox", { name: "Title" });
    await user.clear(title);
    await user.type(title, "Updated welcome");
    await user.click(main.getByRole("button", { name: "Save article" }));
    await expect(
      main.findByRole("heading", { level: 1, name: "Updated welcome" })
    ).resolves.toBeDefined();
    expect(
      application.repository
        .inspect("articles")
        .find((article) => article.id === "1")?.title
    ).toBe("Updated welcome");
  });

  it("does not save a cancelled edit", async () => {
    const { user, main, application } = await renderDemo("/articles/1/edit");
    await user.clear(main.getByRole("textbox", { name: "Title" }));
    await user.type(
      main.getByRole("textbox", { name: "Title" }),
      "Unsaved title"
    );
    await user.click(main.getByRole("button", { name: "Cancel editing" }));
    await expect(
      main.findByRole("heading", { level: 1, name: "Articles" })
    ).resolves.toBeDefined();
    expect(application.repository.inspect("articles")[0]?.title).toBe(
      "Welcome to Bezny"
    );
  });

  it("derives selection context and clears it when navigating away and back", async () => {
    const { user, main, history, application } = await renderDemo();
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    await user.click(
      main.getByRole("checkbox", { name: "Select Planning the next release" })
    );
    await user.click(
      main.getByRole("checkbox", { name: "Select Working with articles" })
    );
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Selected articles: 1, 2, 3");
    await runCommand(user, "View Welcome to Bezny");
    await main.findByRole("heading", { level: 1, name: "Welcome to Bezny" });
    expect(application.store.get(selectedArticleIdsAtom)).toStrictEqual([]);
    act(() => {
      history.back();
    });
    await main.findByRole("heading", { level: 1, name: "Articles" });
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Articles");
    act(() => {
      history.forward();
    });
    await main.findByRole("heading", { level: 1, name: "Welcome to Bezny" });
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Article 1");
  });

  it("keeps a row deletion separate from the selection and restores focus on cancel", async () => {
    const { user, main, application } = await renderDemo();
    await user.click(
      main.getByRole("checkbox", { name: "Select Planning the next release" })
    );
    const row = main.getByRole("group", { name: "Item 1" });
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete Welcome to Bezny" })
    );
    const dialog = within(
      await screen.findByRole("alertdialog", { name: "Delete articles?" })
    );
    expect(
      dialog.getByText(/This permanently deletes Welcome to Bezny/u)
    ).toBeDefined();
    expect(document.activeElement).toBe(
      dialog.getByRole("button", { name: "Cancel deletion" })
    );
    await user.click(dialog.getByRole("button", { name: "Cancel deletion" }));
    await waitFor(() => {
      expect(document.activeElement).toBe(row);
    });
    expect(application.repository.inspect("articles")).toHaveLength(3);
    expect(application.store.get(selectedArticleIdsAtom)).toStrictEqual(["2"]);
  });

  it("offers detail actions next to the title and restores menu focus after dismissal", async () => {
    const { user, main } = await renderDemo("/articles/1");
    const heading = main.getByRole("heading", {
      level: 1,
      name: "Welcome to Bezny",
    });
    const trigger = main.getByRole("button", {
      name: "Actions for Welcome to Bezny",
    });
    expect(
      heading.parentElement?.lastElementChild?.contains(trigger)
    ).toBeTruthy();
    expect(
      main.queryByRole("button", { name: "Edit Welcome to Bezny" })
    ).toBeNull();
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    const menu = within(
      await screen.findByRole("menu", { name: "Actions for Welcome to Bezny" })
    );
    expect(
      menu.getAllByRole("menuitem").map((item) => item.textContent)
    ).toStrictEqual([
      "List articles",
      "Edit Welcome to Bezny",
      "Delete Welcome to Bezny",
    ]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    await user.click(trigger);
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete Welcome to Bezny" })
    );
    const dialog = within(await screen.findByRole("alertdialog"));
    await user.click(dialog.getByRole("button", { name: "Cancel deletion" }));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("confirms deletion from a detail page and navigates to the collection", async () => {
    const { user, main, application } = await renderDemo("/articles/1");
    await user.click(
      main.getByRole("button", { name: "Actions for Welcome to Bezny" })
    );
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete Welcome to Bezny" })
    );
    const dialog = within(await screen.findByRole("alertdialog"));
    await user.click(dialog.getByRole("button", { name: "Confirm deletion" }));
    await main.findByRole("heading", { level: 1, name: "Articles" });
    expect(
      application.repository.inspect("articles").map((article) => article.id)
    ).toStrictEqual(["2", "3"]);
    expect(
      screen.getByRole("status", { name: "Notifications" }).textContent
    ).toBe("1 article deleted.");
    expect(application.router.state.location.pathname).toBe("/articles");
  });

  it("offers row and collection actions in the searchable palette and executes selection commands", async () => {
    const { user, main } = await renderDemo();
    fireEvent.contextMenu(main.getByRole("group", { name: "Item 1" }));
    await screen.findByRole("menu");
    const labels = screen
      .getAllByRole("menuitem")
      .map((item) => item.textContent);
    await user.keyboard("{Escape}");
    const palette = await openPalette(user);
    expect(
      labels.every(
        (label) => palette.queryByRole("button", { name: label ?? "" }) !== null
      )
    ).toBeTruthy();
    expect(
      palette.getByRole("button", { name: "Create article" })
    ).toBeDefined();
    await user.type(
      palette.getByRole("textbox", { name: "Search commands" }),
      "Select Welcome"
    );
    await user.click(
      palette.getByRole("button", { name: "Select Welcome to Bezny" })
    );
    await waitFor(() => {
      expect(
        screen.getByRole("status", { name: "Current context" }).textContent
      ).toBe("Context: Selected articles: 1");
    });
    await runCommand(user, "Clear selection");
    await waitFor(() => {
      expect(
        screen.getByRole("status", { name: "Current context" }).textContent
      ).toBe("Context: Articles");
    });
  });

  it("opens the same confirmation dialog for palette bulk deletion and cleans selection", async () => {
    const { user, main, application } = await renderDemo();
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    await user.click(
      main.getByRole("checkbox", { name: "Select Planning the next release" })
    );
    await runCommand(user, "Delete selected articles");
    const dialog = within(await screen.findByRole("alertdialog"));
    expect(
      dialog.getByText(/Welcome to Bezny, Planning the next release/u)
    ).toBeDefined();
    expect(application.repository.inspect("articles")).toHaveLength(3);
    await user.click(dialog.getByRole("button", { name: "Confirm deletion" }));
    await waitFor(() => {
      expect(application.repository.inspect("articles")).toHaveLength(1);
    });
    expect(application.store.get(selectedArticleIdsAtom)).toStrictEqual([]);
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Articles");
  });

  it("creates and saves through the palette using the same RHF submission path", async () => {
    const { user, main, application } = await renderDemo();
    await runCommand(user, "Create article");
    await main.findByRole("heading", { level: 1, name: "Create article" });
    await user.type(
      main.getByRole("textbox", { name: "Title" }),
      "Palette article"
    );
    await user.type(
      main.getByRole("textbox", { name: "Body" }),
      "Created with commands."
    );
    await runCommand(user, "Save article");
    await expect(
      main.findByRole("heading", { level: 1, name: "Palette article" })
    ).resolves.toBeDefined();
    expect(application.repository.inspect("articles")).toHaveLength(4);
  });

  it("supports keyboard palette search, execution, Escape, and focus restoration", async () => {
    const { user, main } = await renderDemo();
    const trigger = screen.getByRole("button", { name: "Command palette" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const dialog = within(await screen.findByRole("dialog"));
    expect(document.activeElement).toBe(
      dialog.getByRole("textbox", { name: "Search commands" })
    );
    await user.keyboard("No such command");
    expect(dialog.getByText("No matching commands.")).toBeDefined();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
    await user.keyboard("{Enter}");
    await user.keyboard("Create article");
    await user.tab();
    await user.keyboard("{Enter}");
    await expect(
      main.findByRole("heading", { level: 1, name: "Create article" })
    ).resolves.toBeDefined();
  });

  it("traps focus in deletion confirmation and Escape restores the row action", async () => {
    const { user, main } = await renderDemo();
    const trigger = main.getByRole("group", { name: "Item 1" });
    trigger.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete Welcome to Bezny" })
    );
    const dialog = within(await screen.findByRole("alertdialog"));
    await user.tab();
    expect(document.activeElement).toBe(
      dialog.getByRole("button", { name: "Confirm deletion" })
    );
    await user.tab();
    expect(document.activeElement).toBe(
      dialog.getByRole("button", { name: "Cancel deletion" })
    );
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("deletes the full selection from the ordinary toolbar and shows an empty collection", async () => {
    const { user, main, application } = await renderDemo();
    for (const checkbox of main.getAllByRole("checkbox")) {
      // oxlint-disable-next-line eslint/no-await-in-loop -- User interactions must settle sequentially, not race.
      await user.click(checkbox);
    }
    await user.click(main.getByRole("button", { name: "Selection actions" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete selected articles" })
    );
    const dialog = within(await screen.findByRole("alertdialog"));
    await user.click(dialog.getByRole("button", { name: "Confirm deletion" }));
    await expect(
      main.findByText("No articles yet. Create your first article.")
    ).resolves.toBeDefined();
    expect(application.repository.inspect("articles")).toStrictEqual([]);
    expect(application.store.get(selectedArticleIdsAtom)).toStrictEqual([]);
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Articles");
  });

  it("routes and commands a second registered entity without article-specific routing", async () => {
    const { user, main, application } = await renderDemo();
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    await runCommand(user, "List pages");
    await main.findByRole("heading", { level: 1, name: "Pages" });
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Pages");
    expect(application.store.get(adminSelectionAtom)).toBeNull();
    await runCommand(user, "Create page");
    await main.findByRole("heading", { level: 1, name: "Create page" });
    await user.type(main.getByRole("textbox", { name: "Title" }), "Contact");
    await user.type(
      main.getByRole("textbox", { name: "Body" }),
      "Contact our publication."
    );
    await runCommand(user, "Save page");
    await main.findByRole("heading", { level: 1, name: "Contact" });
    expect(application.router.state.location.pathname).toBe("/pages/2");
    expect(application.repository.inspect("pages")).toHaveLength(2);
    expect(application.repository.inspect("articles")).toHaveLength(3);
  });

  it("resets form state when the same generic create route changes entities", async () => {
    const { user, main } = await renderDemo("/articles/create");
    await user.type(
      main.getByRole("textbox", { name: "Title" }),
      "Unsaved article"
    );
    await user.type(
      main.getByRole("textbox", { name: "Body" }),
      "Article body"
    );
    await runCommand(user, "Create page");
    await main.findByRole("heading", { level: 1, name: "Create page" });
    expect(main.getByRole("textbox", { name: "Title" })).toHaveProperty(
      "value",
      ""
    );
    expect(main.getByRole("textbox", { name: "Body" })).toHaveProperty(
      "value",
      ""
    );
    await runCommand(user, "Save page");
    await expect(main.findByText("Enter page content.")).resolves.toBeDefined();
  });

  it("handles direct missing-entity URLs without stale entity actions", async () => {
    const { user, main } = await renderDemo("/articles/999/edit");
    expect(
      main.getByRole("heading", { level: 1, name: "Article not found" })
    ).toBeDefined();
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: No available article");
    const palette = await openPalette(user);
    expect(palette.queryByRole("button", { name: /^Delete/u })).toBeNull();
    expect(palette.queryByRole("button", { name: "Save article" })).toBeNull();
  });
});
