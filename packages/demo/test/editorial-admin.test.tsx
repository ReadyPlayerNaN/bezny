import {
  AdminDefaultListPage,
  AdminDefaultDetailPage,
  AdminDefaultFormPage,
} from "@bezny/admin/application";
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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDemoApplication, DemoApp } from "../src/demo-application.js";
import type { DemoApplication } from "../src/demo-application.js";

const applications: DemoApplication[] = [];
const renderDemo = async (pathname = "/articles") => {
  const history = createMemoryHistory({ initialEntries: [pathname] });
  const application = createDemoApplication(history);
  await application.authenticationReady;
  await application.authentication.signIn({
    email: "editor@example.com",
    password: "bezny-demo",
  });
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
    palette.getByRole("combobox", { name: "Search commands" }),
    label
  );
  await user.click(palette.getByRole("option", { name: label }));
};
const applySearch = async (
  user: ReturnType<typeof userEvent.setup>,
  value: string
) => {
  await user.click(screen.getByRole("button", { name: /^Search:/u }));
  const input = screen.getByRole("textbox", { name: "Search" });
  await user.clear(input);
  await user.type(input, value);
  await user.click(screen.getByRole("button", { name: "Apply" }));
};

describe("registration-driven editorial admin", () => {
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

  it("uses package-owned CRUD pages for every entity and redirects the root", async () => {
    const { application, main } = await renderDemo("/");
    expect(application.router.state.location.pathname).toBe("/articles");
    expect(
      application.registry.entities.map((entity) => entity.screens)
    ).toStrictEqual(
      ["articles", "pages"].map(() => ({
        create: AdminDefaultFormPage,
        detail: AdminDefaultDetailPage,
        list: AdminDefaultListPage,
        update: AdminDefaultFormPage,
      }))
    );
    expect(
      main.getByRole("heading", { level: 1, name: "Articles" })
    ).toBeDefined();
    expect(screen.getByRole("navigation", { name: "Entities" })).toBeDefined();
    expect(screen.getByRole("main").parentElement?.className).toContain(
      "application"
    );
  });

  it("keeps the custom shell context in the bottom status bar, not the banner", async () => {
    await renderDemo();
    const context = screen.getByRole("status", { name: "Current context" });
    expect(
      within(screen.getByRole("banner")).queryByRole("status", {
        name: "Current context",
      })
    ).toBeNull();
    expect(
      within(screen.getByRole("contentinfo")).getByRole("status", {
        name: "Current context",
      })
    ).toBe(context);
    expect(context.className).toContain("statusBar");
    expect(context.textContent).toBe("Context: Articles");
  });

  it("preserves shared header tool styling and account-language keyboard focus", async () => {
    const { user } = await renderDemo();
    const account = screen.getByRole("button", { name: "Account menu" });
    expect(account.className).toBe(
      screen.getByRole("button", { name: "Command palette" }).className
    );
    expect(within(account).getByText("DE").getAttribute("class")).toBeNull();
    expect(screen.queryByRole("button", { name: "UI language" })).toBeNull();
    account.focus();
    await user.keyboard("{ArrowDown}");
    const current = await screen.findByRole("menuitemradio", {
      name: "Change language to English",
    });
    expect(current.getAttribute("aria-checked")).toBe("true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(account));
  });

  it("derives one collection navigation and creation commands from the registry", async () => {
    const { user, main, application } = await renderDemo();
    const nav = screen.getByRole("navigation", { name: "Entities" });
    expect(
      screen
        .getByRole("button", { name: /Open entities/u })
        .getAttribute("popovertarget")
    ).toBe(nav.id);
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent)
    ).toStrictEqual(["Articles", "Pages"]);
    expect(main.getByRole("button", { name: "Create article" })).toBeDefined();
    await user.click(within(nav).getByRole("link", { name: "Pages" }));
    await waitFor(() =>
      expect(application.router.state.location.pathname).toBe("/pages")
    );
    const palette = await openPalette(user);
    expect(palette.getByRole("option", { name: "Create page" })).toBeDefined();
  });

  it.each([
    { create: "Create article", entity: "articles", heading: "Articles" },
    { create: "Create page", entity: "pages", heading: "Pages" },
  ])(
    "places default $create next to its collection heading",
    async ({ entity, heading, create }) => {
      const { main } = await renderDemo(`/${entity}`);
      const row = main.getByRole("heading", {
        level: 1,
        name: heading,
      }).parentElement;
      expect(row?.dataset.adminPageHeadingRow).toBe("true");
      expect(
        row?.lastElementChild?.contains(
          main.getByRole("button", { name: create })
        )
      ).toBeTruthy();
    }
  );

  it("keeps unselected row actions independent of selection", async () => {
    const { user, main, application } = await renderDemo();
    await user.click(
      main.getByRole("checkbox", { name: "Select Planning the next release" })
    );
    const row = main.getByRole("group", { name: "Item 1" });
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    const menu = within(
      await screen.findByRole("menu", { name: "Actions for Welcome to Bezny" })
    );
    expect(
      menu.queryByRole("menuitem", { name: /Delete selected/u })
    ).toBeNull();
    await user.click(
      menu.getByRole("menuitem", { name: "Delete Welcome to Bezny" })
    );
    const dialog = within(await screen.findByRole("alertdialog"));
    expect(dialog.getByText(/Welcome to Bezny/u)).toBeDefined();
    expect(document.activeElement).toBe(
      dialog.getByRole("button", { name: "Cancel" })
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(row));
    expect(application.store.get(adminSelectionAtom)?.ids).toStrictEqual(["2"]);
  });

  it("uses shared selection actions in selected-row menus and keeps cancellation non-destructive", async () => {
    const { user, main, application } = await renderDemo();
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    await user.click(
      main.getByRole("checkbox", { name: "Select Planning the next release" })
    );
    const row = main.getByRole("group", { name: "Item 1" });
    fireEvent.contextMenu(row);
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete selected (2)" })
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      })
    );
    expect(application.store.get(adminSelectionAtom)?.ids).toStrictEqual([
      "1",
      "2",
    ]);
    expect(application.repository.inspect("articles")).toHaveLength(3);
    fireEvent.contextMenu(row);
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete selected (2)" })
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      })
    );
    await waitFor(() =>
      expect(
        application.repository.inspect("articles").map((record) => record.id)
      ).toStrictEqual(["3"])
    );
    expect(application.store.get(adminSelectionAtom)).toBeNull();
  });

  it("presents compact summaries and status badges while keeping the full body on detail", async () => {
    const { application, main, user } = await renderDemo();
    const row = main.getByRole("group", { name: "Item 1" });
    expect(within(row).getByText("Summary:")).toBeTruthy();
    expect(within(row).getByText("Published").dataset.type).toBe("success");
    const body = "Long body ".repeat(40).trim();
    await act(async () => {
      await application.session.update("articles", "1", {
        body,
        published: true,
        title: "Welcome to Bezny",
      });
    });
    const updatedRow = main.getByRole("group", { name: "Item 1" });
    const summary = within(updatedRow).getByText(/^Long body.*…$/u);
    expect(summary.textContent?.length).toBeLessThanOrEqual(141);
    await user.click(
      within(updatedRow).getByRole("link", { name: "Welcome to Bezny" })
    );
    await expect(main.findByText(body)).resolves.toBeTruthy();
  });

  it("provides a shared floating selection menu and restores its focus after cancellation", async () => {
    const { user, main, application } = await renderDemo();
    expect(main.queryByRole("button", { name: /Delete selected/u })).toBeNull();
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    const trigger = main.getByRole("button", { name: "Selection actions" });
    await user.click(trigger);
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete selected (1)" })
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(application.store.get(adminSelectionAtom)?.ids).toStrictEqual(["1"]);
    await user.click(main.getByRole("button", { name: "Clear selection" }));
    expect(main.queryByRole("button", { name: /Delete selected/u })).toBeNull();
  });

  it("shares registered search filters between ordinary controls and palette inputs", async () => {
    const { user, main, application } = await renderDemo();
    await applySearch(user, "Planning");
    await waitFor(() =>
      expect(
        main.queryByRole("heading", { name: "Welcome to Bezny" })
      ).toBeNull()
    );
    expect(application.router.state.location.search.filters).toStrictEqual({
      search: "Planning",
    });
    await runCommand(user, "Filter by Search");
    const input = within(screen.getByRole("dialog")).getByRole("textbox", {
      name: "Search",
    });
    await user.clear(input);
    await user.type(input, "Welcome");
    await user.click(screen.getByRole("button", { name: "Apply command" }));
    await main.findByRole("heading", { name: "Welcome to Bezny" });
    expect(application.store.get(application.session.snapshotAtom).total).toBe(
      1
    );
    expect(application.router.state.location.search.filters).toStrictEqual({
      search: "Welcome",
    });
  });

  it("configures choice filters and page size through shared palette commands", async () => {
    const { user, application } = await renderDemo();
    await runCommand(user, "Filter by Status");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("combobox", {
        name: "Status",
      })
    );
    await user.click(await screen.findByRole("option", { name: "Draft" }));
    await user.click(screen.getByRole("button", { name: "Apply command" }));
    await waitFor(() =>
      expect(
        application.store.get(application.session.snapshotAtom).total
      ).toBe(1)
    );
    expect(application.router.state.location.search.filters).toStrictEqual({
      status: "draft",
    });
    await runCommand(user, "Change page size");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("combobox", {
        name: "Records per page",
      })
    );
    await user.click(await screen.findByRole("option", { name: "10" }));
    await user.click(screen.getByRole("button", { name: "Apply command" }));
    await waitFor(() =>
      expect(
        application.store.get(application.session.snapshotAtom).query.pageSize
      ).toBe(10)
    );
    expect(application.router.state.location.search.pageSize).toBe(10);
  });

  it("paginates, resets selection on filtering, and clamps after later-page deletion", async () => {
    const { user, main, application } = await renderDemo();
    await act(async () => {
      await application.session.create("articles", {
        body: "Page boundary",
        published: false,
        title: "Fourth article",
      });
    });
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    await runCommand(user, "Next page");
    await main.findByRole("heading", { name: "Fourth article" });
    expect(application.router.state.location.search.page).toBe(2);
    expect(application.store.get(adminSelectionAtom)).toBeNull();
    fireEvent.contextMenu(main.getByRole("group", { name: "Item 4" }));
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete Fourth article" })
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      })
    );
    await main.findByRole("heading", { name: "Welcome to Bezny" });
    expect(
      application.store.get(application.session.snapshotAtom).query.page
    ).toBe(1);
    expect(application.router.state.location.search.page).toBeUndefined();
    await applySearch(user, "Planning");
    await waitFor(() =>
      expect(
        application.store.get(application.session.snapshotAtom).total
      ).toBe(1)
    );
  });

  it("creates through the default RHF form with validation, focus refs and reactive notices", async () => {
    const { user, main, application } = await renderDemo("/articles/create");
    await user.click(main.getByRole("button", { name: "Save" }));
    await expect(
      main.findAllByText("This field is required.")
    ).resolves.toHaveLength(2);
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
    await user.click(main.getByRole("button", { name: "Save" }));
    await main.findByRole("heading", { level: 1, name: "New article" });
    expect(application.router.state.location.pathname).toBe("/articles/4");
    expect(
      application.repository
        .inspect("articles")
        .find((record) => record.id === "4")
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

  it("opens row detail and updates through the default page actions", async () => {
    const { user, main, application } = await renderDemo();
    await user.click(main.getByRole("link", { name: "Welcome to Bezny" }));
    await main.findByRole("heading", { level: 1, name: "Welcome to Bezny" });
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Article 1");
    await user.click(
      main.getByRole("button", { name: "Edit Welcome to Bezny" })
    );
    const title = await main.findByRole("textbox", { name: "Title" });
    await user.clear(title);
    await user.type(title, "Updated welcome");
    await user.click(main.getByRole("button", { name: "Save" }));
    await main.findByRole("heading", { level: 1, name: "Updated welcome" });
    expect(application.repository.inspect("articles")[0]?.title).toBe(
      "Updated welcome"
    );
  });

  it("does not save a cancelled edit", async () => {
    const { user, main, application } = await renderDemo("/articles/1/edit");
    const title = main.getByRole("textbox", { name: "Title" });
    await user.clear(title);
    await user.type(title, "Unsaved title");
    await user.click(main.getByRole("button", { name: "Cancel" }));
    await main.findByRole("heading", { level: 1, name: "Articles" });
    expect(application.repository.inspect("articles")[0]?.title).toBe(
      "Welcome to Bezny"
    );
  });

  it("clears selection on collection navigation, including browser history", async () => {
    const { user, main, history, application } = await renderDemo();
    await user.click(
      main.getByRole("checkbox", { name: "Select Welcome to Bezny" })
    );
    await user.click(
      within(screen.getByRole("navigation", { name: "Entities" })).getByRole(
        "link",
        {
          name: "Pages",
        }
      )
    );
    await main.findByRole("heading", { level: 1, name: "Pages" });
    expect(application.store.get(adminSelectionAtom)).toBeNull();
    await act(async () => {
      history.back();
      await application.router.load();
    });
    await main.findByRole("heading", { level: 1, name: "Articles" });
    expect(application.store.get(adminSelectionAtom)).toBeNull();
  });

  it("confirms detail deletion through the package dialog and returns to the list", async () => {
    const { user, main, application } = await renderDemo("/articles/1");
    await user.click(
      main.getByRole("button", { name: "Delete Welcome to Bezny" })
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      })
    );
    await main.findByRole("heading", { level: 1, name: "Articles" });
    expect(
      application.repository.inspect("articles").map((record) => record.id)
    ).toStrictEqual(["2", "3"]);
    expect(
      screen.getByRole("status", { name: "Notifications" }).textContent
    ).toBe("1 article deleted.");
    expect(application.router.state.location.pathname).toBe("/articles");
  });

  it("uses the same row commands and selection commands in the searchable palette", async () => {
    const { user, main } = await renderDemo();
    fireEvent.contextMenu(main.getByRole("group", { name: "Item 1" }));
    const menu = await screen.findByRole("menu");
    const labels = within(menu)
      .getAllByRole("menuitem")
      .map((item) => item.textContent);
    await user.keyboard("{Escape}");
    const palette = await openPalette(user);
    expect(
      labels.every((label) =>
        palette.queryByRole("option", { name: label ?? "" })
      )
    ).toBeTruthy();
    await user.type(
      palette.getByRole("combobox", { name: "Search commands" }),
      "Select Welcome"
    );
    await user.click(
      palette.getByRole("option", { name: "Select Welcome to Bezny" })
    );
    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Current context" }).textContent
      ).toBe("Context: Selected articles: 1")
    );
    await runCommand(user, "Clear selection");
    await waitFor(() =>
      expect(
        screen.getByRole("status", { name: "Current context" }).textContent
      ).toBe("Context: Articles")
    );
  });

  it("opens shared bulk confirmation from the palette and displays an empty collection", async () => {
    const { user, main, application } = await renderDemo();
    for (const checkbox of main.getAllByRole("checkbox")) {
      // oxlint-disable-next-line eslint/no-await-in-loop -- Sequential user interactions must settle.
      await user.click(checkbox);
    }
    await runCommand(user, "Delete selected (3)");
    const dialog = within(await screen.findByRole("alertdialog"));
    expect(
      dialog.getByText(
        /Welcome to Bezny, Planning the next release, Working with articles/u
      )
    ).toBeDefined();
    await user.click(dialog.getByRole("button", { name: "Delete" }));
    await main.findByText("No records found.");
    expect(application.repository.inspect("articles")).toStrictEqual([]);
    expect(application.store.get(adminSelectionAtom)).toBeNull();
  });

  it("creates and edits fields through registration-generated palette callbacks", async () => {
    const { user, main, application } = await renderDemo();
    await runCommand(user, "Create article");
    await main.findByRole("heading", { level: 1, name: "Create Article" });
    await runCommand(user, "Title");
    await user.type(
      within(screen.getByRole("dialog")).getByRole("textbox", {
        name: "Title",
      }),
      "Palette article"
    );
    await user.click(screen.getByRole("button", { name: "Apply command" }));
    await user.type(
      main.getByRole("textbox", { name: "Body" }),
      "Created with commands."
    );
    await runCommand(user, "Published");
    await runCommand(user, "Save");
    await main.findByRole("heading", { level: 1, name: "Palette article" });
    expect(
      application.repository
        .inspect("articles")
        .find((record) => record.id === "4")?.published
    ).toBeTruthy();
  });

  it("keeps the compact accessible palette and keyboard navigation in search", async () => {
    const { user } = await renderDemo();
    const palette = await openPalette(user);
    const input = palette.getByRole("combobox", { name: "Search commands" });
    const list = palette.getByRole("listbox", { name: "Available commands" });
    expect(input.getAttribute("aria-controls")).toBe(list.id);
    expect(
      screen.getByRole("dialog").getAttribute("aria-describedby")
    ).toBeNull();
    expect(palette.getAllByRole("button")).toHaveLength(1);
    const options = palette.getAllByRole("option");
    await user.keyboard("{End}{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe(options[0]?.id);
    expect(document.activeElement).toBe(input);
  });

  it("toggles palette shortcuts, resets search and preserves composition safety", async () => {
    const { user } = await renderDemo();
    await user.keyboard("{Control>}k{/Control}");
    const input = await screen.findByRole("combobox", {
      name: "Search commands",
    });
    await user.type(input, "No such command");
    expect(screen.getByRole("status").textContent).toBe(
      "No matching commands."
    );
    fireEvent.keyDown(input, { ctrlKey: true, isComposing: true, key: "k" });
    expect(document.activeElement).toBe(input);
    await user.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await user.keyboard("{Meta>}k{/Meta}");
    expect(
      screen
        .getByRole("combobox", { name: "Search commands" })
        .getAttribute("value")
    ).toBe("");
  });

  it("focuses parameterized command inputs and restores search focus on Back", async () => {
    const { user } = await renderDemo();
    await runCommand(user, "Filter by Search");
    expect(document.activeElement).toBe(
      within(screen.getByRole("dialog")).getByRole("textbox", {
        name: "Search",
      })
    );
    await user.click(screen.getByRole("button", { name: "Back to commands" }));
    expect(document.activeElement).toBe(
      screen.getByRole("combobox", { name: "Search commands" })
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("traps confirmation focus, prevents a second palette and restores the row on Escape", async () => {
    const { user, main } = await renderDemo();
    const row = main.getByRole("group", { name: "Item 1" });
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    await user.click(
      await screen.findByRole("menuitem", { name: "Delete Welcome to Bezny" })
    );
    const dialog = within(await screen.findByRole("alertdialog"));
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.tab();
    expect(document.activeElement).toBe(
      dialog.getByRole("button", { name: "Delete" })
    );
    await user.tab();
    expect(document.activeElement).toBe(
      dialog.getByRole("button", { name: "Cancel" })
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(row));
  });

  it("routes and saves a second entity without entity-specific screens", async () => {
    const { user, main, application } = await renderDemo();
    await runCommand(user, "Create page");
    await main.findByRole("heading", { level: 1, name: "Create Page" });
    await user.type(main.getByRole("textbox", { name: "Title" }), "Contact");
    await user.type(
      main.getByRole("textbox", { name: "Body" }),
      "Contact our publication."
    );
    await runCommand(user, "Save");
    await main.findByRole("heading", { level: 1, name: "Contact" });
    expect(application.router.state.location.pathname).toBe("/pages/2");
    expect(application.repository.inspect("pages")).toHaveLength(2);
    expect(application.repository.inspect("articles")).toHaveLength(3);
  });

  it("resets generic form state between entities and drops stale form commands", async () => {
    const { user, main } = await renderDemo("/articles/create");
    await user.type(
      main.getByRole("textbox", { name: "Title" }),
      "Unsaved article"
    );
    await runCommand(user, "Create page");
    await main.findByRole("heading", { level: 1, name: "Create Page" });
    expect(main.getByRole("textbox", { name: "Title" })).toHaveProperty(
      "value",
      ""
    );
    await runCommand(user, "Save");
    await expect(
      main.findAllByText("This field is required.")
    ).resolves.toHaveLength(2);
  });

  it("uses the default unavailable page without stale record or form commands", async () => {
    const { user, main } = await renderDemo("/articles/999/edit");
    expect(
      main.getByRole("heading", { level: 1, name: "Entity unavailable." })
    ).toBeDefined();
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: No available article");
    const palette = await openPalette(user);
    expect(palette.queryByRole("option", { name: /^Delete/u })).toBeNull();
    expect(palette.queryByRole("option", { name: "Save" })).toBeNull();
  });
});
