import { describe, expect, it } from "vitest";

import { createAdminI18n } from "../src/admin-i18n.js";

describe("app-scoped i18next configuration", () => {
  it("isolates language and resources between applications", async () => {
    const first = createAdminI18n();
    const second = createAdminI18n();
    first.addResource("en", "beznyAdmin", "list", "Browse {{entity}}");
    await first.changeLanguage("cs");
    expect(first.t("loading")).toBe("Načítání záznamů…");
    expect(second.t("list", { entity: "books" })).toBe("List books");
    expect(second.resolvedLanguage).toBe("en");
  });

  it("preserves custom namespaces/overrides and uses library fallback", async () => {
    const instance = createAdminI18n({
      lng: "cs",
      resources: {
        cs: { custom: { entity: "Knihy" } },
        en: {
          beznyAdmin: { list: "Browse {{entity}}" },
          custom: { title: "Default title" },
        },
      },
    });
    expect(instance.t("custom:entity")).toBe("Knihy");
    expect(instance.t("custom:title")).toBe("Default title");
    await instance.changeLanguage("en");
    expect(instance.t("list", { entity: "books" })).toBe("Browse books");
    expect(instance.t("loading")).toBe("Loading records…");
  });
});
