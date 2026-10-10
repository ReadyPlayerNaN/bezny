import { RouterProvider } from "@tanstack/react-router";
import type { AnyRouter, RegisteredRouter } from "@tanstack/react-router";
import { Provider } from "jotai";
import type { ComponentProps } from "react";

export type AdminProviderProps<TRouter extends AnyRouter = RegisteredRouter> = {
  router: TRouter;
} & Pick<ComponentProps<typeof Provider>, "store">;

/** Provides isolated Jotai state to the application's TanStack route tree. */
export const AdminProvider = <TRouter extends AnyRouter = RegisteredRouter>({
  router,
  ...storeProps
}: AdminProviderProps<TRouter>) => (
  <Provider {...storeProps}>
    <RouterProvider router={router} />
  </Provider>
);
