import { RouterProvider } from "@tanstack/react-router";
import type { AnyRouter, RegisteredRouter } from "@tanstack/react-router";
import { Provider } from "jotai";
import type { ComponentProps } from "react";

import { AdminBuildingBlocksProvider } from "./admin-building-blocks.js";
import type { AdminBuildingBlockOverrides } from "./admin-building-blocks.js";

export type AdminProviderProps<TRouter extends AnyRouter = RegisteredRouter> = {
  router: TRouter;
  components?: AdminBuildingBlockOverrides | undefined;
} & Pick<ComponentProps<typeof Provider>, "store">;

/** Provides isolated Jotai state to the application's TanStack route tree. */
export const AdminProvider = <TRouter extends AnyRouter = RegisteredRouter>({
  router,
  components,
  ...storeProps
}: AdminProviderProps<TRouter>) => (
  <Provider {...storeProps}>
    <AdminBuildingBlocksProvider components={components}>
      <RouterProvider router={router} />
    </AdminBuildingBlocksProvider>
  </Provider>
);
