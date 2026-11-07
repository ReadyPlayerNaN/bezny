import { createMemoryHistory, Outlet } from "@tanstack/react-router";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type {
  AdminEntityDefinition,
  AdminEntityForm,
  AdminFormValues,
} from "../src/admin-data-adapter.js";
import { useAdminEntityCommands } from "../src/admin-entity-commands.js";
import type { AdminCommand } from "../src/admin-entity-model.js";
import { createAdminEntityRegistry } from "../src/admin-entity-model.js";
import {
  AdminApplicationProvider,
  createAdminApplication,
} from "../src/admin-entity-routing.js";
import type { AdminApplication } from "../src/admin-entity-routing.js";

const applications: AdminApplication[] = [];
let commands: readonly AdminCommand[] = [];
const Root = () => {
  const catalog = useAdminEntityCommands().pageCommands;
  useEffect(() => {
    commands = catalog;
  }, [catalog]);
  return <Outlet />;
};
const record = { id: "1", label: "Document", score: 7, title: "Stored title" };
const create = vi.fn<(values: AdminFormValues) => Promise<typeof record>>();
const update =
  vi.fn<(id: string, values: AdminFormValues) => Promise<typeof record>>();
const createForm: AdminEntityForm = {
  defaultValues: { confirmation: "", password: "", title: "New title" },
  errors: () => ({ score: "Wrong view", title: "Creation rejected" }),
  fields: [
    { key: "title", label: "Create title" },
    { key: "password", label: "Password", type: "password" },
    {
      key: "confirmation",
      label: "Confirmation",
      sensitive: true,
      type: "password",
    },
  ],
  resolver: (values) =>
    String(values.password).length < 8 ||
    values.password !== values.confirmation
      ? {
          errors: {
            confirmation: {
              message: "Enter matching credentials",
              type: "validate",
            },
          },
          values: {},
        }
      : {
          errors: {},
          values: { ...values, title: String(values.title).trim() },
        },
};
const updateForm: AdminEntityForm = {
  defaultValues: { score: 1, title: "Edit default" },
  errors: () => ({ confirmation: "Wrong view", title: "Update rejected" }),
  fields: [
    { key: "title", label: "Edit title" },
    { key: "score", label: "Score", type: "number" },
  ],
  readValues: (data) => {
    if (!data || typeof data !== "object" || !("title" in data)) {
      throw new Error("Missing title");
    }
    return { score: "7", title: `Edit ${String(data.title)}` };
  },
  resolver: (values) =>
    values.title === ""
      ? {
          errors: {
            title: { message: "Supply an edit title", type: "required" },
          },
          values: {},
        }
      : {
          errors: {},
          values: { ...values, title: String(values.title).trim() },
        },
};
const definition = (
  configuration: Pick<AdminEntityDefinition, "form" | "forms" | "columns"> = {}
) =>
  defineAdminEntity({
    ...configuration,
    adapter: {
      create,
      get: (id) =>
        Promise.resolve({
          ...record,
          id,
          title: id === "1" ? record.title : "Other title",
        }),
      list: () => Promise.resolve({ items: [record], total: 1 }),
      update,
    },
    key: "documents",
    label: "Documents",
    parseValues: (value: unknown) => {
      if (!value || typeof value !== "object") {
        throw new Error("Missing values");
      }
      return Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, string | number | boolean] =>
            ["string", "number", "boolean"].includes(typeof entry[1])
        )
      );
    },
    reference: (value: typeof record) => ({ id: value.id, label: value.label }),
    singularLabel: "Document",
  });
const formsConfiguration = {
  forms: { create: createForm, update: updateForm },
};
const setup = async (
  path: string,
  configuration: Parameters<typeof definition>[0] = formsConfiguration
) => {
  const app = createAdminApplication({
    Root,
    entities: [definition(configuration)],
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  applications.push(app);
  await act(async () => {
    await app.router.load();
    render(<AdminApplicationProvider application={app} />);
  });
  return app;
};
const command = async (id: string) => {
  await waitFor(() =>
    expect(commands.some((entry) => entry.id === id)).toBeTruthy()
  );
  const found = commands.find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`Missing command ${id}`);
  }
  return found;
};

describe("view-specific registered forms", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockReturnValue();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn<() => void>();
        unobserve = vi.fn<() => void>();
        disconnect = vi.fn<() => void>();
      }
    );
    create.mockResolvedValue(record);
    update.mockResolvedValue(record);
  });
  afterEach(() => {
    cleanup();
    for (const app of applications.splice(0)) {
      app.dispose();
    }
    create.mockReset();
    update.mockReset();
    commands = [];
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("registers default screens without a shared form and applies creation-only validation", async () => {
    await setup("/documents/create");
    const user = userEvent.setup();
    expect(
      (
        (await screen.findByRole("textbox", {
          name: "Create title",
        })) as HTMLInputElement
      ).value
    ).toBe("New title");
    expect(screen.queryByRole("spinbutton")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Enter matching credentials");
    expect(create).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Password"), "secret-value");
    await user.type(screen.getByLabelText("Confirmation"), "secret-value");
    const secretCommand = await command("documents.field.password");
    expect(secretCommand.input).toBeUndefined();
    const save = await command("documents.save");
    await act(async () => {
      await save.execute();
    });
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        {
          confirmation: "secret-value",
          password: "secret-value",
          title: "New title",
        },
        expect.anything()
      )
    );
  });

  it("projects and submits only update fields using its own resolver and numeric metadata", async () => {
    await setup("/documents/1/edit", {
      form: { fields: [{ key: "score", label: "Shared text score" }] },
      forms: { update: updateForm },
    });
    const user = userEvent.setup();
    const title = await screen.findByRole("textbox", { name: "Edit title" });
    expect((title as HTMLInputElement).value).toBe("Edit Stored title");
    expect(screen.queryByLabelText("Password")).toBeNull();
    expect(
      screen.queryByRole("textbox", { name: "Shared text score" })
    ).toBeNull();
    await user.clear(title);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Supply an edit title");
    expect(update).not.toHaveBeenCalled();
    await user.type(title, "  Changed  ");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        "1",
        { score: 7, title: "Changed" },
        expect.anything()
      )
    );
    expect(create).not.toHaveBeenCalled();
  });

  it.each(["create", "update"] as const)(
    "uses the shared form for the omitted %s override",
    async (view) => {
      await setup(
        view === "create" ? "/documents/create" : "/documents/1/edit",
        {
          form: { fields: [{ key: "title", label: "Shared title" }] },
          forms:
            view === "create" ? { update: updateForm } : { create: createForm },
        }
      );
      await screen.findByRole("textbox", { name: "Shared title" });
      expect(screen.queryByLabelText("Password")).toBeNull();
    }
  );

  it.each(["create", "update"] as const)(
    "maps only %s errors and keeps that draft retryable",
    async (view) => {
      const mutation = view === "create" ? create : update;
      mutation.mockRejectedValueOnce(new Error("conflict"));
      await setup(
        view === "create" ? "/documents/create" : "/documents/1/edit"
      );
      const user = userEvent.setup();
      const label = view === "create" ? "Create title" : "Edit title";
      const title = await screen.findByRole("textbox", { name: label });
      await user.clear(title);
      await user.type(title, "Retained draft");
      if (view === "create") {
        await user.type(screen.getByLabelText("Password"), "secret-value");
        await user.type(screen.getByLabelText("Confirmation"), "secret-value");
      }
      await user.click(screen.getByRole("button", { name: "Save" }));
      await screen.findByText(
        view === "create" ? "Creation rejected" : "Update rejected"
      );
      expect(screen.queryByText("Wrong view")).toBeNull();
      expect((title as HTMLInputElement).value).toBe("Retained draft");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
    }
  );

  it("replaces drafts and palette commands across create/update and history navigation", async () => {
    const app = await setup("/documents/create");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Password"), "discard-me");
    const staleSave = await command("documents.save");
    const staleTitle = await command("documents.field.title");
    await act(async () => {
      await app.router.navigate({
        params: { entity: "documents", recordId: "1" },
        to: "/$entity/$recordId/edit",
      });
    });
    await screen.findByRole("textbox", { name: "Edit title" });
    expect(
      commands.some((entry) => entry.id === "documents.field.password")
    ).toBeFalsy();
    await act(async () => {
      await staleTitle.input?.execute("Stale title");
      await staleSave.execute();
    });
    expect([update.mock.calls, create.mock.calls]).toStrictEqual([[], []]);
    expect(
      (screen.getByRole("textbox", { name: "Edit title" }) as HTMLInputElement)
        .value
    ).toBe("Edit Stored title");
    await act(() => {
      app.router.history.back();
    });
    const password = await screen.findByLabelText("Password");
    expect({
      password: (password as HTMLInputElement).value,
      title: (
        screen.getByRole("textbox", {
          name: "Create title",
        }) as HTMLInputElement
      ).value,
    }).toStrictEqual({ password: "", title: "New title" });
    expect(
      JSON.stringify(app.store.get(app.session.snapshotAtom))
    ).not.toContain("discard-me");
  });

  it("resets the selected update form and fences retained commands on a record change", async () => {
    const app = await setup("/documents/1/edit");
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole("textbox", { name: "Edit title" }),
      " abandoned"
    );
    const oldSave = await command("documents.save");
    const oldTitle = await command("documents.field.title");
    await act(async () => {
      await app.router.navigate({
        params: { entity: "documents", recordId: "2" },
        to: "/$entity/$recordId/edit",
      });
    });
    await waitFor(() =>
      expect(
        (
          screen.getByRole("textbox", {
            name: "Edit title",
          }) as HTMLInputElement
        ).value
      ).toBe("Edit Other title")
    );
    await act(async () => {
      await oldTitle.input?.execute("Late draft");
      await oldSave.execute();
    });
    expect(
      (screen.getByRole("textbox", { name: "Edit title" }) as HTMLInputElement)
        .value
    ).toBe("Edit Other title");
    expect([create.mock.calls, update.mock.calls]).toStrictEqual([[], []]);
    expect(app.store.get(app.session.snapshotAtom).items[0]?.id).toBe("2");
  });

  it("uses the update form for detail fallback but never a create-only form", async () => {
    const app = await setup("/documents/1");
    await screen.findByText("Edit Stored title");
    expect(screen.queryByText("Create title")).toBeNull();
    expect(screen.queryByText("Password")).toBeNull();
    cleanup();
    app.dispose();
    await setup("/documents/1", { forms: { create: createForm } });
    await screen.findByRole("heading", { name: "Document" });
    expect(screen.queryByText("Create title")).toBeNull();
  });

  it("keeps shared detail fallback and explicit columns authoritative, excluding sensitive fields", async () => {
    const form: AdminEntityForm = {
      fields: [
        { key: "title", label: "Shared detail title" },
        { key: "secret", label: "Hidden secret", sensitive: true },
      ],
      readValues: () => ({
        secret: "Never display",
        title: "Shared detail value",
      }),
    };
    const app = await setup("/documents/1", {
      form,
      forms: { update: updateForm },
    });
    await screen.findByText("Shared detail value");
    expect(screen.queryByText("Hidden secret")).toBeNull();
    expect(screen.queryByText("Never display")).toBeNull();
    expect(screen.queryByText("Edit title")).toBeNull();
    cleanup();
    app.dispose();
    await setup("/documents/1", {
      columns: [
        {
          key: "explicit",
          label: "Explicit column",
          render: () => "Column value",
        },
      ],
      forms: {
        update: {
          ...updateForm,
          readValues: () => {
            throw new Error(
              "Form projection must not run for explicit columns"
            );
          },
        },
      },
    });
    await screen.findByText("Column value");
    expect(screen.queryByText("Shared detail title")).toBeNull();
  });

  it("does not expose creation when only the update form is registered", async () => {
    const app = await setup("/documents", { forms: { update: updateForm } });
    await screen.findByRole("link", { name: "Document" });
    expect(app.registry.get("documents")?.screens.create).toBeUndefined();
    expect(app.registry.get("documents")?.screens.update).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Create document" })
    ).toBeNull();
  });

  it("fences late derivations when the same field key belongs to a new view", async () => {
    const pending = Promise.withResolvers<Partial<AdminFormValues>>();
    const derive = vi.fn<() => Promise<Partial<AdminFormValues>>>(
      () => pending.promise
    );
    const app = await setup("/documents/create", {
      forms: {
        create: {
          fields: [
            { deriveValues: derive, key: "trigger", label: "Trigger" },
            { key: "title", label: "Create title" },
          ],
        },
        update: updateForm,
      },
    });
    await userEvent
      .setup()
      .type(await screen.findByRole("textbox", { name: "Trigger" }), "x");
    await waitFor(() => expect(derive).toHaveBeenCalledOnce());
    await act(async () => {
      await app.router.navigate({
        params: { entity: "documents", recordId: "1" },
        to: "/$entity/$recordId/edit",
      });
    });
    const title = await screen.findByRole("textbox", { name: "Edit title" });
    await act(async () => {
      pending.resolve({ title: "Abandoned draft" });
      await pending.promise;
    });
    expect((title as HTMLInputElement).value).toBe("Edit Stored title");
    expect(title.closest("fieldset")?.disabled).toBeFalsy();
  });

  it("ignores an old view's late server error and keeps the new form usable", async () => {
    const pending = Promise.withResolvers<typeof record>();
    create.mockReturnValueOnce(pending.promise);
    const app = await setup("/documents/create", {
      forms: {
        create: {
          ...createForm,
          resolver: (values) => ({ errors: {}, values }),
        },
        update: updateForm,
      },
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(() => expect(create).toHaveBeenCalledOnce());
    await act(async () => {
      await app.router.navigate({
        params: { entity: "documents", recordId: "1" },
        to: "/$entity/$recordId/edit",
      });
    });
    const title = await screen.findByRole("textbox", { name: "Edit title" });
    await user.click(title);
    await act(async () => {
      pending.reject(new Error("Late conflict"));
      await pending.promise.catch(() => {});
    });
    expect(screen.queryByText("Creation rejected")).toBeNull();
    expect(screen.queryByText("Update rejected")).toBeNull();
    expect(document.activeElement).toBe(title);
    expect(title.closest("fieldset")?.disabled).toBeFalsy();
    const save = await command("documents.save");
    await act(async () => {
      await save.execute();
    });
    await waitFor(() => expect(update).toHaveBeenCalledOnce());
  });

  it.each(["form", "create", "update"] as const)(
    "rejects duplicate fields in %s independently",
    (view) => {
      const invalid: AdminEntityForm = {
        fields: [
          { key: "title", label: "One" },
          { key: "title", label: "Two" },
        ],
      };
      const config =
        view === "form" ? { form: invalid } : { forms: { [view]: invalid } };
      expect(() => createAdminEntityRegistry([definition(config)])).toThrow(
        "Invalid or duplicate field"
      );
    }
  );

  it("does not grant missing adapter operations just because a view form exists", () => {
    const entity = definition({
      forms: { create: createForm, update: updateForm },
    });
    const registry = createAdminEntityRegistry([
      { ...entity, adapter: { list: entity.adapter.list } },
    ]);
    expect(registry.get("documents")?.screens.create).toBeUndefined();
    expect(registry.get("documents")?.screens.update).toBeUndefined();
  });
});
