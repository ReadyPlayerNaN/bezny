import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from "@tanstack/react-router";
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AdminApplicationProvider,
  createAdminApplication,
} from "../src/admin-entity-routing.js";
import { AdminProvider } from "../src/admin-provider.js";
import { AdminToastProvider, useAdminToasts } from "../src/admin-toasts.js";

const ToastControls = () => {
  const { publish, dismiss, clear } = useAdminToasts();
  const latest = useRef<string | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          latest.current = publish({
            description: "Article saved",
            title: "Saved",
          });
        }}
      >
        Publish
      </button>
      <button
        type="button"
        onClick={() => {
          if (latest.current) {
            dismiss(latest.current);
          }
        }}
      >
        Dismiss latest
      </button>
      <button type="button" onClick={clear}>
        Clear
      </button>
    </>
  );
};
const List = () => (
  <>
    <ToastControls />
    <Link to="/detail">Details</Link>
  </>
);
const Detail = () => <h1>Detail page</h1>;
const createTestRouter = () => {
  const root = createRootRoute({ component: Outlet });
  const list = createRoute({
    component: List,
    getParentRoute: () => root,
    path: "/",
  });
  const detail = createRoute({
    component: Detail,
    getParentRoute: () => root,
    path: "/detail",
  });
  return createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: root.addChildren([list, detail]),
  });
};

describe("admin toasts", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("publishes from routes, survives navigation, and dismisses with the keyboard", async () => {
    const user = userEvent.setup();
    const router = createTestRouter();
    render(<AdminProvider router={router} toasts={{ duration: Infinity }} />);
    await user.click(await screen.findByRole("button", { name: "Publish" }));
    await screen.findByText("Article saved");
    await user.click(screen.getByRole("link", { name: "Details" }));
    await screen.findByRole("heading", { name: "Detail page" });
    expect(screen.getByText("Article saved")).toBeDefined();
    screen.getByRole("button", { name: "Dismiss" }).focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByText("Article saved")).toBeNull());
  });

  it("isolates roots and preserves notifications when provider options rerender", async () => {
    const user = userEvent.setup();
    const first = createTestRouter();
    const second = createTestRouter();
    const { rerender } = render(
      <>
        <section aria-label="First">
          <AdminProvider router={first} toasts={{ duration: Infinity }} />
        </section>
        <section aria-label="Second">
          <AdminProvider router={second} />
        </section>
      </>
    );
    const firstRoot = within(screen.getByRole("region", { name: "First" }));
    const secondRoot = within(screen.getByRole("region", { name: "Second" }));
    await user.click(await firstRoot.findByRole("button", { name: "Publish" }));
    await expect(firstRoot.findByText("Article saved")).resolves.toBeDefined();
    expect(secondRoot.queryByText("Article saved")).toBeNull();
    rerender(
      <>
        <section aria-label="First">
          <AdminProvider
            router={first}
            toasts={{ dismissLabel: "Close notice", duration: Infinity }}
          />
        </section>
        <section aria-label="Second">
          <AdminProvider router={second} />
        </section>
      </>
    );
    expect(
      firstRoot.getByRole("button", { name: "Close notice" })
    ).toBeDefined();
  });

  it("keeps duplicate messages distinct and supports targeted dismissal and clearing", async () => {
    const user = userEvent.setup();
    render(
      <AdminToastProvider options={{ duration: Infinity }}>
        <ToastControls />
      </AdminToastProvider>
    );
    await user.click(screen.getByRole("button", { name: "Publish" }));
    await user.click(screen.getByRole("button", { name: "Publish" }));
    expect(screen.getAllByText("Article saved")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Dismiss latest" }));
    expect(screen.getAllByText("Article saved")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText("Article saved")).toBeNull();
  });

  it("removes automatically dismissed messages and resets the queue on remount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <AdminToastProvider options={{ duration: 100 }}>
        <ToastControls />
      </AdminToastProvider>
    );
    await user.click(screen.getByRole("button", { name: "Publish" }));
    await screen.findByText("Article saved");
    await waitFor(() => expect(screen.queryByText("Article saved")).toBeNull());
    await user.click(screen.getByRole("button", { name: "Publish" }));
    unmount();
    render(
      <AdminToastProvider>
        <ToastControls />
      </AdminToastProvider>
    );
    expect(screen.queryByText("Article saved")).toBeNull();
  });

  it("localizes application notifications and updates labels when language changes", async () => {
    const user = userEvent.setup();
    const application = createAdminApplication({
      NotFound: Detail,
      Root: Outlet,
      entities: [
        {
          adapter: {
            get: () => Promise.resolve(null),
            list: () => Promise.resolve({ items: [], total: 0 }),
          },
          key: "articles",
          label: "Articles",
          screens: { list: ToastControls },
          singularLabel: "Article",
        },
      ],
      history: createMemoryHistory({ initialEntries: ["/articles"] }),
    });
    const { unmount } = render(
      <AdminApplicationProvider
        application={application}
        toasts={{ duration: Infinity }}
      />
    );
    await user.click(await screen.findByRole("button", { name: "Publish" }));
    await act(async () => {
      await application.i18n.changeLanguage("cs");
    });
    await expect(
      screen.findByRole("button", { name: "Zavřít" })
    ).resolves.toBeDefined();
    expect(screen.getByRole("region", { name: "Oznámení (F8)" })).toBeDefined();
    await act(async () => {
      await application.i18n.changeLanguage("ar");
    });
    await expect(
      screen.findByRole("button", { name: "إغلاق" })
    ).resolves.toBeDefined();
    expect(
      screen.getByText("Article saved").closest('[dir="rtl"]')
    ).not.toBeNull();
    unmount();
    application.dispose();
  });
});
