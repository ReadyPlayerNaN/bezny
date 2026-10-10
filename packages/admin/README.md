# @bezny/admin

Building blocks for administration interfaces, composing **Jotai** for shared UI state, **TanStack Router** for typed navigation, and **@bezny/base** for controls, fields, styling, and accessibility.

## Available building blocks

This private workspace package builds ESM JavaScript and TypeScript declarations into `dist/`.

| Import | Exports |
| --- | --- |
| `@bezny/admin` | `AdminProvider`, `AdminProviderProps` |
| `@bezny/admin/layout` | `AdminLayout` |
| `@bezny/admin/page` | `AdminPage` |
| `@bezny/admin/building-blocks` | `AdminBuildingBlocksProvider`, `useAdminBuildingBlocks`, default implementations, and their prop/override types |

`AdminProvider` places a Jotai provider around TanStack's `RouterProvider`, so route components can use atoms and Bezny controls together. It accepts:

- `router`: an application-created TanStack router. Configure routes, history, loaders, router context, and other options when creating this router; the admin package does not create or register a global router.
- `store` (optional): a Jotai store created with `createStore`. Without it, each mounted admin root owns an isolated store that survives rerenders and navigation. Remounting resets that implicit store. Supply a store when loaders or other non-React code need access to the same state.
- `components` (optional): typed replacements for `Layout`, `Page`, and `PageHeader`. Partial overrides inherit the surrounding configuration or built-in defaults. All route components see the configured blocks.

Applications own their data fetching and persistence. React and React DOM 19 are peer dependencies. Jotai and TanStack Router are runtime dependencies, not bundled copies or re-exported APIs; import their APIs directly when defining atoms and routes. Declare those direct dependencies in consuming packages as well.

### Usage

Add `@bezny/admin` with `workspace:*` to an application in this repository and build the workspace with `pnpm build`.

```tsx
import { AdminProvider } from "@bezny/admin";
import { Button } from "@bezny/base";

import "@bezny/base/style.css";
import { createRootRoute, createRouter } from "@tanstack/react-router";
import { atom, useAtom } from "jotai";

const selectedCountAtom = atom(0);

function Articles() {
  const [count, setCount] = useAtom(selectedCountAtom);
  return <Button onClick={() => setCount(count + 1)}>Selected: {count}</Button>;
}

const rootRoute = createRootRoute({ component: Articles });
const router = createRouter({ routeTree: rootRoute });

export function App() {
  return <AdminProvider router={router} />;
}
```

Import the base stylesheet once at the application entrypoint. Admin adds no stylesheet and does not duplicate or re-export base components. Its layout/page defaults are deliberately **unstyled semantic compositions**; use root `className`/`style` props or replace a block to implement your application design.

## Composition and customization

`AdminLayout` composes an optional header, named navigation (`navigationLabel` defaults to `Administration`), one main landmark, route content, and an optional footer. Pass navigation links as content, not a nested `<nav>`. Put the layout in a parent route around TanStack's `Outlet`; the provider does not impose a route tree or wrap every page in another main landmark.

`AdminPage` composes a named section, an explicit level-one Bezny heading, optional description and action content, and page children. Heading IDs are unique and automatically associated with the section. Both blocks forward native root props and React 19 refs. A page belongs inside the layout's main landmark; compose sub-sections with appropriate heading levels rather than using another page for every panel.

### Application-wide replacements

```tsx
import { AdminProvider } from "@bezny/admin";
import {
  DefaultAdminLayout,
  DefaultAdminPageHeader,
} from "@bezny/admin/building-blocks";
import type {
  AdminBuildingBlockOverrides,
  AdminLayoutProps,
  AdminPageHeaderProps,
} from "@bezny/admin/building-blocks";
import { AdminLayout } from "@bezny/admin/layout";
import { AdminPage } from "@bezny/admin/page";
import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from "@tanstack/react-router";

const BrandedLayout = (props: AdminLayoutProps) => (
  <DefaultAdminLayout {...props} className="my-admin-layout" />
);

const BrandedPageHeader = (props: AdminPageHeaderProps) => (
  <div className="my-page-header">
    <DefaultAdminPageHeader {...props} />
  </div>
);

const components = {
  Layout: BrandedLayout,
  PageHeader: BrandedPageHeader,
} satisfies AdminBuildingBlockOverrides;

const Root = () => (
  <AdminLayout
    header="Editorial"
    navigation={<Link to="/articles">Articles</Link>}
  >
    <Outlet />
  </AdminLayout>
);

const Articles = () => (
  <AdminPage heading="Articles" description="Manage your publication">
    <p>Your article list goes here.</p>
  </AdminPage>
);

const rootRoute = createRootRoute({ component: Root });
const articlesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/articles",
  component: Articles,
});
const router = createRouter({
  routeTree: rootRoute.addChildren([articlesRoute]),
});

export const App = () => (
  <AdminProvider router={router} components={components} />
);
```

You may replace the entire `Layout` or `Page`, or just `PageHeader`. Use the `DefaultAdmin*` implementation when decorating an existing block; calling `AdminLayout` from its own replacement would recurse into itself. The default page still resolves the configured `PageHeader` when used inside a custom page wrapper.

### Scoped replacements and standalone composition

`AdminBuildingBlocksProvider` can be nested around a route subtree to override only its presentation without creating another router or resetting Jotai state:

```tsx
<AdminBuildingBlocksProvider components={{ PageHeader: BrandedPageHeader }}>
  <AdminPage heading="Articles">Content</AdminPage>
</AdminBuildingBlocksProvider>
```

Unspecified or `undefined` blocks inherit the nearest configuration. Siblings outside the provider remain unchanged. Layout/page components also work outside any provider with defaults, useful in tests and standalone screens. `useAdminBuildingBlocks()` exposes the same resolved component map for custom compositions.

Define replacements at module scope. Changing the override object alone does not remount a block; replacing its component type intentionally follows React's normal remount behavior. Changing presentation configuration does not recreate the admin store.

### Replacement contracts

- Preserve forwarded native props, refs, children, and supplied content slots where appropriate. `AdminLayoutProps`, `AdminPageProps`, and `AdminPageHeaderProps` describe these contracts.
- Keep exactly one main landmark in the shell and maintain accessible navigation names and heading hierarchy.
- A custom page header must apply `headingId` to its heading; the default page uses that ID for its accessible name. A whole-page replacement owns that association itself.
- `header`, `navigation`, `footer`, `description`, and `actions` are caller-supplied React content, not a second action-registration or navigation system. These blocks do not implement LCRUD or palette commands yet. Future action building blocks must obey the parity requirements below.
- Presentation configuration is distinct from entity UI context, Jotai state, and TanStack router dependency context.

## Runnable application example

[`@bezny/demo`](../demo/README.md) implements an editorial administration application with customized layout/page/header blocks, article LCRUD pages, Jotai-backed data and selection, and a searchable palette sharing commands with the ordinary UI. Run `pnpm --filter @bezny/demo dev` from the repository root. Entity/context/action code in that application remains demo-owned; the requirements below still guide reusable framework APIs.

## Required direction for future development

The following are implementation requirements, **not features already implemented by this foundation**. Public entity, action, palette, and context APIs remain to be designed.

### 1. Command-palette parity

Every available action must be achievable through the command palette **as well as its ordinary UI entrypoint**. This includes navigation, entity operations, row/detail actions, and selection/bulk actions. No mouse-only or palette-only business operation.

Use shared action definitions and execution paths for the palette and visible controls. Apply the same permissions, availability, current context, and confirmation requirements everywhere. The palette must be keyboard accessible; choosing a destructive action must open its confirmation dialog rather than bypass it.

### 2. Entity LCRUD

Every entity interface follows **LCRUD**:

| Operation | Presentation | Illustrative article URL |
| --- | --- | --- |
| List | Collection page | `/articles` |
| Create | Creation page | `/articles/create` |
| Read | Entity detail page | `/articles/1` |
| Update | Editing page | `/articles/1/edit` |
| Delete | Confirmation dialog | Opened against the current entity or selection; no standalone delete page required |

These URLs illustrate the intended navigation, not a route convention imposed by today's package. Static create routes must not be mistaken for entity identifiers. List, create, detail, and update pages must support direct URL entry. Deletion requires explicit confirmation and consistent post-delete navigation/selection cleanup.

### 3. Referential UI context

The UI exposes a context that actions and other building blocks can refer to. It describes **what the user is currently working with**, not merely which component has focus:

- `/articles` supplies the Articles collection context.
- `/articles/1` supplies the context of article `1`, including when entered directly or restored through browser history.
- Selecting three articles on `/articles` supplies the context of those three selected articles, retaining the owning Articles collection.
- Clearing that selection returns to the collection context. Navigating elsewhere must not leave unrelated selected entities as the active context.

Context must carry stable entity-type and entity-ID references, not depend on row component instances or labels. Route context identifies the collection/entity; Jotai holds transient selection state. Palette commands, row actions, and detail actions resolve their targets against this common model. An explicit row action targets that row, even when other rows are selected; bulk actions target the selection.

This **admin UI context** is distinct from TanStack Router's dependency-injection `context` option and React provider context. Future integration should connect them deliberately, not treat them as interchangeable. Loading or missing entities must not expose actions against a stale target.

### 4. Entity action entrypoints

Entity actions are accessible from **both entity list rows and the entity detail page**, and also through the palette. These surfaces share action identity, permission checks, availability rules, target resolution, and execution logic. Updates navigate to the update page; deletion opens the same confirmation flow. Collection/create and selection/bulk actions use their respective contexts rather than pretending to be single-entity actions.

### Implementation and acceptance expectations

- Compose `@bezny/base` controls and RHF-bound fields rather than introducing a second component or form system. Use Radix primitives where suitable when implementing interactive UI; add only dependencies needed by that feature.
- Verify palette/UI action parity, row versus selection targeting, direct URLs and back/forward context updates, selection cleanup, and permission consistency.
- Verify LCRUD navigation, form validation/submission, and delete confirm/cancel behavior.
- Verify keyboard interaction, focus restoration, and accessible semantics for the palette and dialogs.
- Deliver each future feature with its implementation, relevant tests, and documentation in a complete functional slice.

## Development checks

From the repository root, `pnpm build`, `pnpm typecheck`, and `pnpm test` include this package through the existing workspace task graph. Provider tests cover routing with base controls, state continuity and isolation, explicit stores, typed router context, and customized pages across navigation. Building-block tests cover default semantics, content/prop/ref forwarding, heading associations, full and partial replacements, nested inheritance, sibling isolation, and rerender continuity. A build smoke check imports every emitted public entrypoint in native Node.

Reference documentation: [Jotai Provider](https://jotai.org/docs/core/provider) and [TanStack Router context](https://tanstack.com/router/latest/docs/framework/react/guide/router-context).
