import { createMemoryHistory } from "@tanstack/react-router";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { articlesAtom, selectedArticleIdsAtom } from "../src/article-state.js";
import { createDemoApplication, DemoApp } from "../src/demo-application.js";

const renderDemo = async (pathname = "/articles") => {
  const history = createMemoryHistory({ initialEntries: [pathname] });
  const application = createDemoApplication(history);
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
    vi.restoreAllMocks();
  });

  it("renders a customized admin shell and redirects the root to the article collection", async () => {
    const { application, main } = await renderDemo("/");
    expect(application.router.state.location.pathname).toBe("/articles");
    expect(
      main.getByRole("table", { name: "Articles in this workspace" })
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
      application.store.get(articlesAtom).find((article) => article.id === "4")
    ).toStrictEqual({
      body: "A new publication.",
      id: "4",
      published: true,
      title: "New article",
    });
    expect(
      screen.getByRole("status", { name: "Notifications" }).textContent
    ).toBe("Article created.");
  });

  it("opens row detail and edit actions and persists changes in the same workspace", async () => {
    const { user, main, application } = await renderDemo();
    await user.click(
      main.getByRole("button", { name: "View Welcome to Bezny" })
    );
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
    await user.click(main.getByRole("button", { name: "Save article" }));
    await expect(
      main.findByRole("heading", { level: 1, name: "Updated welcome" })
    ).resolves.toBeDefined();
    expect(
      application.store.get(articlesAtom).find((article) => article.id === "1")
        ?.title
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
    expect(application.store.get(articlesAtom)[0]?.title).toBe(
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
    await user.click(
      main.getByRole("button", { name: "View Welcome to Bezny" })
    );
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
    const deleteButton = main.getByRole("button", {
      name: "Delete Welcome to Bezny",
    });
    await user.click(deleteButton);
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
      expect(document.activeElement).toBe(deleteButton);
    });
    expect(application.store.get(articlesAtom)).toHaveLength(3);
    expect(application.store.get(selectedArticleIdsAtom)).toStrictEqual(["2"]);
  });

  it("confirms deletion from a detail page and navigates to the collection", async () => {
    const { user, main, application } = await renderDemo("/articles/1");
    await user.click(
      main.getByRole("button", { name: "Delete Welcome to Bezny" })
    );
    const dialog = within(await screen.findByRole("alertdialog"));
    await user.click(dialog.getByRole("button", { name: "Confirm deletion" }));
    await main.findByRole("heading", { level: 1, name: "Articles" });
    expect(
      application.store.get(articlesAtom).map((article) => article.id)
    ).toStrictEqual(["2", "3"]);
    expect(
      screen.getByRole("status", { name: "Notifications" }).textContent
    ).toBe("1 article deleted.");
    expect(application.router.state.location.pathname).toBe("/articles");
  });

  it("offers row and collection actions in the searchable palette and executes selection commands", async () => {
    const { user, main } = await renderDemo();
    const labels = within(main.getByRole("table"))
      .getAllByRole("button")
      .map((button) => button.textContent);
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
    expect(application.store.get(articlesAtom)).toHaveLength(3);
    await user.click(dialog.getByRole("button", { name: "Confirm deletion" }));
    await waitFor(() => {
      expect(application.store.get(articlesAtom)).toHaveLength(1);
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
    expect(application.store.get(articlesAtom)).toHaveLength(4);
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
    const trigger = main.getByRole("button", {
      name: "Delete Welcome to Bezny",
    });
    await user.click(trigger);
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
    await user.click(
      main.getByRole("button", { name: "Delete selected articles" })
    );
    const dialog = within(await screen.findByRole("alertdialog"));
    await user.click(dialog.getByRole("button", { name: "Confirm deletion" }));
    await expect(
      main.findByText("No articles yet. Create your first article.")
    ).resolves.toBeDefined();
    expect(application.store.get(articlesAtom)).toStrictEqual([]);
    expect(application.store.get(selectedArticleIdsAtom)).toStrictEqual([]);
    expect(
      screen.getByRole("status", { name: "Current context" }).textContent
    ).toBe("Context: Articles");
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
