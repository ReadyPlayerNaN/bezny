import { TextField } from "@bezny/base";
import { createMemoryHistory, Outlet } from "@tanstack/react-router";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defineAdminEntity } from "../src/admin-data-adapter.js";
import type {
  AdminEntityForm,
  AdminFieldComponentProps,
  AdminFormValues,
} from "../src/admin-data-adapter.js";
import { useAdminEntityCommands } from "../src/admin-entity-commands.js";
import type { AdminCommand } from "../src/admin-entity-model.js";
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "../src/admin-entity-routing.js";
import type { AdminApplication } from "../src/admin-entity-routing.js";

let catalog: readonly AdminCommand[] = [];
const Root = () => {
  const commands = useAdminEntityCommands().pageCommands;
  useEffect(() => {
    catalog = commands;
  });
  return <Outlet />;
};
const CustomField = ({
  field,
  disabled,
  onValueChange,
}: AdminFieldComponentProps) => (
  <TextField
    name={field.key}
    label={field.label}
    disabled={disabled}
    rules={onValueChange ? { onChange: onValueChange } : {}}
  />
);
const applications: AdminApplication[] = [];
const create =
  vi.fn<(values: AdminFormValues) => Promise<{ id: string; label: string }>>();
const setup = async (form: AdminEntityForm, path = "/documents/create") => {
  const entity = defineAdminEntity({
    adapter: {
      create,
      get: () =>
        Promise.resolve({
          id: "1",
          label: "Document",
          password: "server-secret",
        }),
      list: () => Promise.resolve({ items: [], total: 0 }),
      update: (_id, values) => create(values),
    },
    form,
    key: "documents",
    label: "Documents",
    parseValues: (v: unknown) => {
      if (!v || typeof v !== "object") {
        throw new Error("Invalid form");
      }
      return Object.fromEntries(
        Object.entries(v).filter(
          (entry): entry is [string, string | number | boolean] =>
            ["string", "number", "boolean"].includes(typeof entry[1])
        )
      );
    },
    reference: (r: { id: string; label: string }) => r,
    singularLabel: "Document",
  });
  const app = createAdminApplication({
    Root,
    entities: [entity],
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  applications.push(app);
  await app.router.load();
  render(<AdminApplicationProvider application={app} />);
  return app;
};
describe("registered form extensions", () => {
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
    create.mockResolvedValue({ id: "1", label: "Saved" });
  });
  afterEach(() => {
    cleanup();
    for (const app of applications.splice(0)) {
      app.dispose();
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    create.mockReset();
    catalog = [];
  });

  it("uses a host resolver for cross-field feedback, focus and transformed values", async () => {
    await setup({
      fields: [
        { key: "title", label: "Title" },
        { key: "confirm", label: "Confirm" },
      ],
      resolver: (values) =>
        values.title === values.confirm
          ? {
              errors: {},
              values: { ...values, title: String(values.title).trim() },
            }
          : {
              errors: {
                confirm: { message: "Values differ", type: "validate" },
              },
              values: {},
            },
    });
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole("textbox", { name: "Title" }),
      "  Guide  "
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await expect(screen.findByText("Values differ")).resolves.toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Confirm" })
    );
    expect(create).not.toHaveBeenCalled();
    await user.type(
      screen.getByRole("textbox", { name: "Confirm" }),
      "  Guide  "
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        { confirm: "  Guide  ", title: "Guide" },
        expect.anything()
      )
    );
  });

  it("maps host errors to registered fields and keeps drafts retryable", async () => {
    create.mockRejectedValueOnce(new Error("conflict"));
    await setup({
      errors: () => ({ title: "Already used", unknown: "Do not display" }),
      fields: [{ key: "title", label: "Title" }],
    });
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole("textbox", { name: "Title" }),
      "Guide"
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await expect(screen.findByText("Already used")).resolves.toBeTruthy();
    expect(screen.queryByText("Do not display")).toBeNull();
    expect(
      screen
        .getByRole("textbox", { name: "Title" })
        .getAttribute("aria-invalid")
    ).toBe("true");
    await user.clear(screen.getByRole("textbox", { name: "Title" }));
    await user.type(screen.getByRole("textbox", { name: "Title" }), "Revised");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(create).toHaveBeenCalledTimes(2));
  });

  it.each(["/documents/create", "/documents/1/edit"])(
    "focuses mapped server errors only after %s fields are enabled",
    async (path) => {
      const { promise, reject } = Promise.withResolvers<{
        id: string;
        label: string;
      }>();
      create.mockReturnValueOnce(promise);
      await setup(
        {
          errors: () => ({ confirm: "Review this too", title: "Already used" }),
          fields: [
            { key: "title", label: "Title" },
            { key: "confirm", label: "Confirm" },
          ],
        },
        path
      );
      const user = userEvent.setup();
      const title = await screen.findByRole("textbox", { name: "Title" });
      await user.type(title, "Draft");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() =>
        expect(title.closest("fieldset")?.disabled).toBeTruthy()
      );
      act(() => reject(new Error("conflict")));
      await screen.findByText("Already used");
      await waitFor(() => expect(document.activeElement).toBe(title));
      expect(title.closest("fieldset")?.disabled).toBeFalsy();
      expect(title.getAttribute("aria-invalid")).toBe("true");
      expect((title as HTMLInputElement).value).toBe("Draft");
      // A later unrelated render must not steal focus back to the server error.
      const confirm = screen.getByRole("textbox", { name: "Confirm" });
      await user.type(confirm, "Reviewed");
      expect(document.activeElement).toBe(confirm);
    }
  );

  it("skips disabled mapped fields when choosing the first server-error focus target", async () => {
    const { promise, reject } = Promise.withResolvers<{
      id: string;
      label: string;
    }>();
    create.mockReturnValueOnce(promise);
    await setup({
      errors: () => ({ locked: "Unavailable", title: "Already used" }),
      fields: [
        { disabled: true, key: "locked", label: "Locked" },
        { key: "title", label: "Title" },
      ],
    });
    const user = userEvent.setup();
    const title = await screen.findByRole("textbox", { name: "Title" });
    await user.type(title, "Draft");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(title.closest("fieldset")?.disabled).toBeTruthy()
    );
    act(() => reject(new Error("conflict")));
    await screen.findByText("Already used");
    await waitFor(() => expect(document.activeElement).toBe(title));
  });

  it("does not focus a server error after the submitting form was abandoned", async () => {
    const { promise, reject } = Promise.withResolvers<{
      id: string;
      label: string;
    }>();
    create.mockReturnValueOnce(promise);
    const app = await setup({
      errors: () => ({ title: "Too late" }),
      fields: [{ key: "title", label: "Title" }],
    });
    const user = userEvent.setup();
    const title = await screen.findByRole("textbox", { name: "Title" });
    const focus = vi.spyOn(title, "focus");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(title.closest("fieldset")?.disabled).toBeTruthy()
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await screen.findByRole("heading", { name: "Documents" });
    focus.mockClear();
    await act(async () => {
      reject(new Error("conflict"));
      await Promise.resolve();
    });
    expect(focus).not.toHaveBeenCalled();
    expect(screen.queryByText("Too late")).toBeNull();
    expect(app.router.state.location.pathname).toBe("/documents");
  });

  it("masks password inputs and never copies their values into palette editors", async () => {
    await setup({
      fields: [
        { key: "password", label: "Password", minLength: 8, type: "password" },
      ],
    });
    const input = await screen.findByLabelText("Password");
    await userEvent.type(input, "a-private-password");
    expect(input.getAttribute("type")).toBe("password");
    await waitFor(() =>
      expect(catalog.find((c) => c.id.endsWith(".password"))).toBeTruthy()
    );
    expect(
      catalog.find((c) => c.id.endsWith(".password"))?.input
    ).toBeUndefined();
  });

  it("omits sensitive values from automatic detail presentation", async () => {
    await setup(
      { fields: [{ key: "password", label: "Password", type: "password" }] },
      "/documents/1"
    );
    await expect(
      screen.findByRole("heading", { name: "Document" })
    ).resolves.toBeTruthy();
    expect(screen.queryByText("server-secret")).toBeNull();
    expect(screen.queryByText("Password")).toBeNull();
  });

  it("composes custom RHF fields and fences retained commands when disabled", async () => {
    await setup({
      fields: [
        { key: "locked", label: "Locked", type: "checkbox" },
        {
          component: CustomField,
          disabled: ({ values }) => values.locked === true,
          key: "category",
          label: "Category",
        },
      ],
    });
    await screen.findByRole("textbox", { name: "Category" });
    await waitFor(() =>
      expect(catalog.find((c) => c.id.endsWith(".category"))).toBeTruthy()
    );
    const retained = catalog.find((c) => c.id.endsWith(".category"));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Category" }),
      "News"
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Locked" }));
    expect(
      screen.getByRole("textbox", { name: "Category" }).hasAttribute("disabled")
    ).toBeTruthy();
    expect(catalog.find((c) => c.id.endsWith(".category"))).toBeUndefined();
    await act(async () => {
      await retained?.execute();
    });
    expect(document.activeElement).not.toBe(
      screen.getByRole("textbox", { name: "Category" })
    );
  });

  it("omits a conditionally disabled select and restores its value when re-enabled", async () => {
    create.mockRejectedValueOnce(new Error("retry"));
    await setup({
      defaultValues: { category: "news", locked: false },
      fields: [
        { key: "locked", label: "Locked", type: "checkbox" },
        {
          disabled: ({ values }) => values.locked === true,
          key: "category",
          label: "Category",
          options: [{ label: "News", value: "news" }],
          required: true,
          type: "select",
        },
      ],
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole("checkbox", { name: "Locked" }));
    expect(
      screen
        .getByRole("combobox", { name: "Category" })
        .hasAttribute("disabled")
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ locked: true }, expect.anything())
    );
    await screen.findByRole("alert");
    await user.click(screen.getByRole("checkbox", { name: "Locked" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(create).toHaveBeenLastCalledWith(
        { category: "news", locked: false },
        expect.anything()
      )
    );
  });

  it.each(["email", "url"] as const)(
    "validates native %s semantics without a schema dependency",
    async (type) => {
      await setup({
        fields: [{ key: "contact", label: "Contact", required: true, type }],
      });
      const user = userEvent.setup();
      const input = await screen.findByRole("textbox", { name: "Contact" });
      await user.type(input, "invalid");
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(create).not.toHaveBeenCalled();
      expect(input.getAttribute("type")).toBe(type);
      expect(input.getAttribute("aria-invalid")).toBe("true");
      await user.clear(input);
      await user.type(
        input,
        type === "email" ? "reader@example.test" : "https://example.test"
      );
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(create).toHaveBeenCalledOnce());
    }
  );

  it("validates numeric steps before submitting fractional values", async () => {
    await setup({
      fields: [
        { key: "weight", label: "Weight", min: 0, step: 0.25, type: "number" },
      ],
    });
    const user = userEvent.setup();
    const input = await screen.findByRole("spinbutton", { name: "Weight" });
    await user.type(input, "0.3");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(create).not.toHaveBeenCalled();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    await user.clear(input);
    await user.type(input, "0.5");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ weight: 0.5 }, expect.anything())
    );
  });
});
