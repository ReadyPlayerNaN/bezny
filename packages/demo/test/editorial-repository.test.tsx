import { createMemoryHistory } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { createDemoApplication } from "../src/demo-application.js";
import {
  createEditorialRepository,
  editorialTextLimits,
} from "../src/editorial-records.js";

describe("editorial adapter lifecycle", () => {
  it("bounds the demo backend's record count and releases all data on disposal", async () => {
    const repository = createEditorialRepository();
    const adapter = repository.adapter("articles");
    const request = { signal: new AbortController().signal };
    if (!adapter.create) {
      throw new Error("Expected writable demo adapter.");
    }
    const remaining =
      repository.diagnostics().maxRecords - repository.diagnostics().records;
    await Promise.all(
      Array.from({ length: remaining }, (_, index) =>
        adapter.create?.(
          { body: "Example", published: false, title: `Record ${index}` },
          request
        )
      )
    );
    expect(repository.diagnostics().records).toBe(
      repository.diagnostics().maxRecords
    );
    await expect(
      adapter.create(
        { body: "Example", published: false, title: "Overflow" },
        request
      )
    ).rejects.toThrow("bounded demo backend is full");
    repository.dispose();
    repository.dispose();
    expect(repository.diagnostics()).toMatchObject({
      disposed: true,
      records: 0,
    });
  });

  it("bounds field lengths independently of frontend form validation", async () => {
    const repository = createEditorialRepository();
    const adapter = repository.adapter("articles");
    if (!adapter.create) {
      throw new Error("Expected writable demo adapter.");
    }
    await expect(
      adapter.create(
        {
          body: "Body",
          published: false,
          title: "x".repeat(editorialTextLimits.title + 1),
        },
        { signal: new AbortController().signal }
      )
    ).rejects.toThrow("configured length limit");
    expect(repository.diagnostics().records).toBe(4);
    repository.dispose();
  });

  it("disposes the mock backend through the public application lifecycle", () => {
    const application = createDemoApplication(
      createMemoryHistory({ initialEntries: ["/articles"] })
    );
    application.dispose();
    application.dispose();
    expect(application.repository.diagnostics()).toMatchObject({
      disposed: true,
      records: 0,
    });
    expect(application.session.diagnostics()).toMatchObject({
      activeRecords: 0,
      cacheEntries: 0,
      disposed: true,
      expiryScheduled: false,
      pendingRequests: 0,
    });
  });
});
