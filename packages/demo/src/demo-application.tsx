import { AdminProvider } from "@bezny/admin";
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";
import { createStore } from "jotai";

import {
  ArticleCreatePage,
  ArticleDetailPage,
  ArticleListPage,
  ArticleUpdatePage,
  MissingArticlePage,
} from "./article-pages.js";
import {
  normalizeArticlePathname,
  selectedArticleIdsAtom,
} from "./article-state.js";
import { editorialComponents, EditorialShell } from "./editorial-layout.js";

const rootRoute = createRootRoute({
  component: EditorialShell,
  notFoundComponent: MissingArticlePage,
});
const indexRoute = createRoute({
  beforeLoad: () => {
    throw redirect({ to: "/articles" });
  },
  getParentRoute: () => rootRoute,
  path: "/",
});
const listRoute = createRoute({
  component: ArticleListPage,
  getParentRoute: () => rootRoute,
  path: "/articles",
});
const createArticleRoute = createRoute({
  component: ArticleCreatePage,
  getParentRoute: () => rootRoute,
  path: "/articles/create",
});
const detailRoute = createRoute({
  component: ArticleDetailPage,
  getParentRoute: () => rootRoute,
  path: "/articles/$articleId",
});
const updateRoute = createRoute({
  component: ArticleUpdatePage,
  getParentRoute: () => rootRoute,
  path: "/articles/$articleId/edit",
});
const routeTree = rootRoute.addChildren([
  indexRoute,
  listRoute,
  createArticleRoute,
  detailRoute,
  updateRoute,
]);

/** Each demo instance has its own router/history and Jotai workspace. */
export const createDemoApplication = (
  history: RouterHistory = createBrowserHistory()
) => {
  const store = createStore();
  const router = createRouter({ history, routeTree });
  // Clear selection before leaving the collection, including browser history.
  router.subscribe("onBeforeNavigate", ({ toLocation }) => {
    if (normalizeArticlePathname(toLocation.pathname) !== "/articles") {
      store.set(selectedArticleIdsAtom, []);
    }
  });
  return { router, store };
};
export type DemoApplication = ReturnType<typeof createDemoApplication>;

export const DemoApp = ({ application }: { application: DemoApplication }) => (
  <AdminProvider
    router={application.router}
    store={application.store}
    components={editorialComponents}
  />
);

declare module "@tanstack/react-router" {
  interface Register {
    router: DemoApplication["router"];
  }
}
