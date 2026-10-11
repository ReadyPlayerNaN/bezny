import { createMemoryHistory } from "@tanstack/react-router";
import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { createDemoApplication, DemoApp } from "../src/demo-application.js";
import type { DemoApplication } from "../src/demo-application.js";
import { readEditorialContent } from "../src/editorial-content.js";

const applications: DemoApplication[] = [];
const renderLocalizedDemo = async (locale: string, path = "/articles") => {
  const application = createDemoApplication(
    createMemoryHistory({ initialEntries: [path] }),
    locale
  );
  await application.authenticationReady;
  await application.authentication.signIn({
    email: "editor@example.com",
    password: "bezny-demo",
  });
  applications.push(application);
  const result = render(<DemoApp application={application} />);
  const user = userEvent.setup();
  await waitFor(() =>
    expect(
      application.store.get(application.session.snapshotAtom).status
    ).not.toBe("loading")
  );
  return { application, user, ...result };
};

describe("editorial localization", () => {
  afterEach(() => {
    cleanup();
    for (const application of applications) {
      application.dispose();
    }
    applications.length = 0;
  });

  it.each([
    {
      direction: "ltr",
      heading: "Articles",
      locale: "en",
      record: "Welcome to Bezny",
    },
    {
      direction: "ltr",
      heading: "Články",
      locale: "cs",
      record: "Vítejte v Bezny",
    },
    {
      direction: "rtl",
      heading: "المقالات",
      locale: "ar",
      record: "مرحبًا ببيزني",
    },
  ])(
    "localizes entity/content labels and direction in $locale",
    async ({ locale, heading, record, direction }) => {
      const { container, application } = await renderLocalizedDemo(locale);
      await screen.findByRole("heading", { name: record });
      expect(screen.getByRole("heading", { name: heading })).toBeTruthy();
      expect(
        container.querySelector(`[lang="${locale}"]`)?.getAttribute("dir")
      ).toBe(direction);
      expect(document.documentElement.dir).toBe(direction);
      expect(application.i18n.hasResourceBundle(locale, "content")).toBeFalsy();
    }
  );

  it("localizes default selection commands and inherits RTL confirmation direction", async () => {
    const { user } = await renderLocalizedDemo("ar");
    await screen.findByRole("heading", { name: "مرحبًا ببيزني" });
    await user.click(
      screen.getByRole("checkbox", { name: "تحديد مرحبًا ببيزني" })
    );
    const trigger = screen.getByRole("button", { name: "حذف المحدد (1)" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog.getAttribute("dir")).toBe("rtl");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("switches locale through the palette using the same language action as ordinary UI", async () => {
    const { user } = await renderLocalizedDemo("en");
    await screen.findByRole("heading", { name: "Welcome to Bezny" });
    await user.click(screen.getByRole("button", { name: "Command palette" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("option", {
        name: "Change language to Čeština",
      })
    );
    await screen.findByRole("heading", { name: "Vítejte v Bezny" });
    expect(screen.getByRole("button", { name: "Paleta příkazů" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Nabídka účtu" }));
    await user.click(
      await screen.findByRole("menuitemradio", {
        name: "Změnit jazyk na العربية",
      })
    );
    await screen.findByRole("heading", { name: "مرحبًا ببيزني" });
    expect(
      within(
        screen.getByRole("navigation", { name: "ترقيم الصفحات" })
      ).getByRole("status").textContent
    ).toBe("الصفحة ١ من ١ · ٣ سجلًا");
  });

  it("localizes RHF validation, submission, and focus refs", async () => {
    const { user, application } = await renderLocalizedDemo(
      "cs",
      "/articles/create"
    );
    await user.click(screen.getByRole("button", { name: "Uložit" }));
    await expect(
      screen.findAllByText("Toto pole je povinné.")
    ).resolves.toHaveLength(2);
    const title = screen.getByRole("textbox", { name: "Název" });
    expect(document.activeElement).toBe(title);
    await user.type(title, "Nový článek");
    await user.type(
      screen.getByRole("textbox", { name: "Obsah" }),
      "Český obsah"
    );
    await user.click(screen.getByRole("button", { name: "Uložit" }));
    await screen.findByRole("heading", { name: "Nový článek" });
    expect(
      application.repository
        .inspect("articles")
        .find((record) => record.id === "4")?.content
    ).toStrictEqual({ cs: { body: "Český obsah", title: "Nový článek" } });
  });

  it("edits localized content independently of UI language and preserves other content locales", async () => {
    const { user, application } = await renderLocalizedDemo(
      "en",
      "/articles/1/edit"
    );
    await screen.findByRole("textbox", { name: "Title" });
    await user.click(
      screen.getByRole("combobox", { name: "Content language" })
    );
    await user.click(await screen.findByRole("option", { name: "Čeština" }));
    const title = screen.getByRole("textbox", { name: "Title" });
    await waitFor(() =>
      expect((title as HTMLInputElement).value).toBe("Vítejte v Bezny")
    );
    await user.clear(title);
    await user.type(title, "Nový název");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("heading", { name: "Welcome to Bezny" });
    const record = application.repository
      .inspect("articles")
      .find((item) => item.id === "1");
    expect(record?.content?.cs?.title).toBe("Nový název");
    expect(record?.content?.en?.title).toBe("Welcome to Bezny");
    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(
      await screen.findByRole("menuitemradio", {
        name: "Change language to Čeština",
      })
    );
    await screen.findByRole("heading", { name: "Nový název" });
    expect(screen.getByRole("status", { name: "Oznámení" }).textContent).toBe(
      "Aktualizováno: Článek."
    );
  });

  it("inherits RTL menu direction and retains Radix keyboard/focus behavior", async () => {
    const { user } = await renderLocalizedDemo("ar");
    const row = await screen.findByRole("group", { name: "العنصر 1" });
    row.focus();
    await user.keyboard("{Shift>}{F10}{/Shift}");
    const menu = await screen.findByRole("menu", {
      name: "إجراءات مرحبًا ببيزني",
    });
    expect(menu.getAttribute("dir")).toBe("rtl");
    within(menu).getByRole("menuitem", { name: "عرض مرحبًا ببيزني" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(
      within(menu).getByRole("menuitem", { name: "تعديل مرحبًا ببيزني" })
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(row));
  });

  it("uses i18next fallback for missing UI resources", async () => {
    const { application } = await renderLocalizedDemo("cs");
    application.i18n.removeResourceBundle("cs", "editorial");
    expect(application.i18n.t("editorial:title")).toBe("Title");
    expect(application.i18n.t("beznyAdmin:loading")).toBe("Načítání záznamů…");
  });

  it("uses library fallback for missing content and preserves literal user interpolation syntax", async () => {
    await renderLocalizedDemo("cs");
    await screen.findByRole("heading", { name: "Planning the next release" });
    const content = await readEditorialContent(
      {
        body: "User {{content}}",
        content: {
          en: { body: "User {{content}}", title: "Literal {{name}}" },
        },
        title: "Literal {{name}}",
      },
      "ar"
    );
    expect(content).toStrictEqual({
      body: "User {{content}}",
      title: "Literal {{name}}",
    });
  });
});
