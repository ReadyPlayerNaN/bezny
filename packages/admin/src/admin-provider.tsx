import { RouterProvider } from "@tanstack/react-router";
import type { AnyRouter, RegisteredRouter } from "@tanstack/react-router";
import { Provider } from "jotai";
import type { ComponentProps } from "react";

import { AdminBuildingBlocksProvider } from "./admin-building-blocks.js";
import type { AdminBuildingBlockOverrides } from "./admin-building-blocks.js";
import { AdminToastProvider } from "./admin-toasts.js";
import type { AdminToastOptions } from "./admin-toasts.js";

export type AdminProviderProps<TRouter extends AnyRouter = RegisteredRouter> = {
  router: TRouter;
  components?: AdminBuildingBlockOverrides | undefined;
  toasts?: AdminToastOptions | undefined;
} & Pick<ComponentProps<typeof Provider>, "store">;

/** Provides isolated Jotai state to the application's TanStack route tree. */
export const AdminProvider = <TRouter extends AnyRouter = RegisteredRouter>({
  router,
  components,
  toasts,
  ...storeProps
}: AdminProviderProps<TRouter>) => (
  <Provider {...storeProps}>
    <AdminBuildingBlocksProvider components={components}>
      <AdminToastProvider options={toasts}>
        <RouterProvider router={router} />
      </AdminToastProvider>
    </AdminBuildingBlocksProvider>
  </Provider>
);
