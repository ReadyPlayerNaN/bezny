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
| `@bezny/admin/entities` | Entity/action/command contracts, registry validation, entity-scoped selection |
| `@bezny/admin/application` | `createAdminApplication`, `AdminApplicationProvider` |
| `@bezny/admin/context` | Matched entity context and registry hooks |
| `@bezny/admin/commands` | Shared entity/navigation commands, domain navigation, active-screen command registration |
| `@bezny/admin/adapters` | Typed `defineAdminEntity`, LCRUD adapter/configuration contracts |
| `@bezny/admin/data` | Bounded data-session contracts, cache policy, and diagnostics |
| `@bezny/admin/list` | Shared filter/pagination controls and parameterized commands |
| `@bezny/admin/i18n` | App-scoped i18next setup and default English/Czech/Arabic resources |

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

Import the base stylesheet once at the application entrypoint. Admin adds no stylesheet and does not duplicate or re-export base components. Its layout/page defaults are semantic compositions without a visual theme. The default page header uses a flex row with the heading first and actions at the inline end (right in LTR), with the description below. Keep collection create buttons and detail action menus in the `actions` slot for consistent placement. Use root `className`/`style` props or replace a block to implement your application design.

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
    navigation={<Link to="/dashboard">Dashboard</Link>}
  >
    <Outlet />
  </AdminLayout>
);

const Dashboard = () => (
  <AdminPage heading="Dashboard" description="Publication overview">
    <p>Your dashboard goes here.</p>
  </AdminPage>
);

const rootRoute = createRootRoute({ component: Root });
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: Dashboard,
});
const router = createRouter({
  routeTree: rootRoute.addChildren([dashboardRoute]),
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
- `header`, `navigation`, `footer`, `description`, and `actions` are caller-supplied React content, not a second action-registration or navigation system. These presentation blocks do not themselves own LCRUD or palette commands. Use the entity application's command catalog for those workflows and preserve the parity requirements below.
- Presentation configuration is distinct from entity UI context, Jotai state, and TanStack router dependency context.

## Registered entity applications

Use [registered entity applications](ENTITIES.md) when building an entity-oriented admin. Typed entity/adapter definitions and an application-owned bounded data session drive the generic `/$entity`, `/$entity/create`, `/$entity/$recordId`, and `/$entity/$recordId/edit` routes and the shared command catalog. Context comes from route matches, not pathname parsing. Form screens register real callbacks for the palette rather than hardcoding form IDs. The low-level provider above remains useful when owning a different route tree.

## Runnable application example

[`@bezny/demo`](../demo/README.md) registers Articles and Pages using the shared entity application API. It supplies customized presentation, a bounded adapter-backed mock repository, RHF forms, and deletion confirmation; generic routes, entity context, bounded data/cache lifetimes, selection, localization/direction integration, and the command catalog come from `@bezny/admin`. Run `pnpm --filter @bezny/demo dev` from the repository root.

## Required direction for future development

The following are ongoing implementation requirements. Registered entities now share routes, context, selection, and commands; additional entity controls, data adapters, and reusable palette presentation must preserve these contracts.

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
