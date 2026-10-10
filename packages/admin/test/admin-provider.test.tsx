import { Button } from "@bezny/base";
import {
  createMemoryHistory,
  createRootRoute,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { cleanup, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { atom, createStore, useAtom } from "jotai";
import { afterEach, describe, expect, it } from "vitest";

import { AdminProvider } from "../src/admin-provider.js";

const countAtom = atom(0);
const contextRootRoute = createRootRouteWithContext<{ title: string }>()({
  component: Outlet,
});

const ContextTitle = () => {
  const { title } = contextRootRoute.useRouteContext();
  return <h1>{title}</h1>;
};

const SelectionCounter = () => {
  const [count, setCount] = useAtom(countAtom);
  return <Button onClick={() => setCount(count + 1)}>Selected: {count}</Button>;
};

const ArticleList = () => (
  <>
    <h1>Articles</h1>
    <SelectionCounter />
    <Link to="/articles/1">Article 1</Link>
  </>
);

const ArticleDetail = () => (
  <>
    <h1>Article 1</h1>
    <SelectionCounter />
  </>
);

const createArticleRouter = () => {
  const rootRoute = createRootRoute({ component: Outlet });
  const listRoute = createRoute({
    component: ArticleList,
    getParentRoute: () => rootRoute,
    path: "/articles",
  });
  const detailRoute = createRoute({
    component: ArticleDetail,
    getParentRoute: () => rootRoute,
    path: "/articles/$articleId",
  });
  return createRouter({
    history: createMemoryHistory({ initialEntries: ["/articles"] }),
    routeTree: rootRoute.addChildren([listRoute, detailRoute]),
  });
};

describe(AdminProvider, () => {
  afterEach(cleanup);

  it("renders base controls inside routes and retains Jotai state across navigation", async () => {
    const user = userEvent.setup();
    render(<AdminProvider router={createArticleRouter()} />);
    await screen.findByRole("heading", { name: "Articles" });
    await user.click(screen.getByRole("button", { name: "Selected: 0" }));
    await user.click(screen.getByRole("link", { name: "Article 1" }));
    await screen.findByRole("heading", { name: "Article 1" });
    expect(screen.getByRole("button", { name: "Selected: 1" })).toBeDefined();
  });

  it("isolates implicit stores between admin roots and preserves state on rerender", async () => {
    const user = userEvent.setup();
    const firstRouter = createArticleRouter();
    const secondRouter = createArticleRouter();
    const { rerender } = render(
      <>
        <section aria-label="First admin">
          <AdminProvider router={firstRouter} />
        </section>
        <section aria-label="Second admin">
          <AdminProvider router={secondRouter} />
        </section>
      </>
    );
    const first = within(screen.getByRole("region", { name: "First admin" }));
    const second = within(screen.getByRole("region", { name: "Second admin" }));
    await user.click(await first.findByRole("button", { name: "Selected: 0" }));
    await expect(
      second.findByRole("button", { name: "Selected: 0" })
    ).resolves.toBeDefined();
    rerender(
      <>
        <section aria-label="First admin">
          <AdminProvider router={firstRouter} />
        </section>
        <section aria-label="Second admin">
          <AdminProvider router={secondRouter} />
        </section>
      </>
    );
    expect(first.getByRole("button", { name: "Selected: 1" })).toBeDefined();
  });

  it("uses an explicit store for initialization and external access", async () => {
    const store = createStore();
    store.set(countAtom, 3);
    const user = userEvent.setup();
    render(<AdminProvider router={createArticleRouter()} store={store} />);
    await user.click(
      await screen.findByRole("button", { name: "Selected: 3" })
    );
    expect(store.get(countAtom)).toBe(4);
  });

  it("preserves typed application router context", async () => {
    const indexRoute = createRoute({
      component: ContextTitle,
      getParentRoute: () => contextRootRoute,
      path: "/",
    });
    const router = createRouter({
      context: { title: "Administration" },
      history: createMemoryHistory({ initialEntries: ["/"] }),
      routeTree: contextRootRoute.addChildren([indexRoute]),
    });
    render(<AdminProvider router={router} />);
    await expect(
      screen.findByRole("heading", { name: "Administration" })
    ).resolves.toBeDefined();
  });
});
