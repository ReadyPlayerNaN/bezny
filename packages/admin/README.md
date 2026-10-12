# @bezny/admin

Building blocks for administration interfaces, composing **Jotai** for shared UI state, **TanStack Router** for typed navigation, and **@bezny/base** for controls, fields, styling, and accessibility.

## Available building blocks

This private workspace package builds ESM JavaScript and TypeScript declarations into `dist/`.

| Import | Exports |
| --- | --- |
| `@bezny/admin` | `AdminProvider`, `AdminProviderProps` |
| `@bezny/admin/layout` | `AdminLayout` |
| `@bezny/admin/keyboard-navigation` | `AdminKeyboardNavigation`, `AdminKeyboardNavigationProps` |
| `@bezny/admin/header` | `AdminHeader`, `AdminCommandPalette`, `AdminAccountMenu`, `AdminLanguageMenuItems`, their props, and `adminCommandPaletteTriggerId` |
| `@bezny/admin/style.css` | Package-owned header, palette, account-form, and collection-control styles |
| `@bezny/admin/toasts` | `useAdminToasts`, `AdminToastProvider`, message/options/API types |
| `@bezny/admin/page` | `AdminPage` |
| `@bezny/admin/building-blocks` | `AdminBuildingBlocksProvider`, `useAdminBuildingBlocks`, default implementations, and their prop/override types |
| `@bezny/admin/entities` | Entity/action/command contracts, registry validation, entity-scoped selection |
| `@bezny/admin/application` | `createAdminApplication`, `AdminApplicationProvider`, `AdminEntityScreen` |
| `@bezny/admin/runtime` | `createAdminRuntime`, runtime/options types |
| `@bezny/admin/routes` | Route binding types and matched-route resolution |
| `@bezny/admin/context` | Matched entity context and registry hooks |
| `@bezny/admin/commands` | Shared entity/navigation commands, domain navigation, active-screen command registration |
| `@bezny/admin/adapters` | Typed `defineAdminEntity`, LCRUD adapter/configuration contracts |
| `@bezny/admin/data` | Bounded data-session contracts, cache policy, and diagnostics |
| `@bezny/admin/list` | Shared filters, pagination hyperlinks, floating selection menu, URL query contract and parameterized commands |
| `@bezny/admin/i18n` | App-scoped i18next setup and default English/Czech/Arabic resources |

`AdminProvider` places a Jotai provider around TanStack's `RouterProvider`, so route components can use atoms and Bezny controls together. It accepts:

- `router`: an application-created TanStack router. Configure routes, history, loaders, router context, and other options when creating this router; the admin package does not create or register a global router.
- `store` (optional): a Jotai store created with `createStore`. Without it, each mounted admin root owns an isolated store that survives rerenders and navigation. Remounting resets that implicit store. Supply a store when loaders or other non-React code need access to the same state.
- `toasts` (optional): toast duration, swipe direction, viewport hotkey, and accessible/localized labels. A shared base toast provider and viewport are included automatically.
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

Import `@bezny/base/style.css` and `@bezny/admin/style.css` once at the application entrypoint. Admin owns composed header/palette/account styling without duplicating or re-exporting base primitives. Its default layout uses the responsive base Shell. The default page header uses a flex row with the heading first and actions at the inline end (right in LTR), with the description below. Keep collection create buttons and detail action menus in the `actions` slot for consistent placement. Use root `className`/`style` props or replace a block to implement your application design.

## Header, command palette and account menu

These are framework components, not demo UI. Import them from `@bezny/admin/header` and put `AdminHeader` in the layout's `header` slot:

```tsx
import { AdminHeader, AdminLanguageMenuItems } from "@bezny/admin/header";
import type { AdminAccountMenuProps } from "@bezny/admin/header";
import { AdminLayout } from "@bezny/admin/layout";
import { Outlet } from "@tanstack/react-router";

import "@bezny/base/style.css";
import "@bezny/admin/style.css";

export function Workspace({ account }: { account: AdminAccountMenuProps }) {
  return (
    <AdminLayout
      header={
        <AdminHeader
          title="My workspace"
          account={{ ...account, children: <AdminLanguageMenuItems /> }}
        />
      }
    >
      <Outlet />
    </AdminLayout>
  );
}
```

- `AdminHeader` owns the compact, non-wrapping title/tool arrangement and title truncation. Its default command palette consumes the registered entity/page/selection/language catalog. Immediately before that connected palette, a labeled refresh icon runs the current entity's shared refresh/retry command; it shows the shared animated loading spinner and stays disabled until both the request and a minimum **666 ms** feedback period finish (also on failure), and is omitted on create pages. The spinner respects reduced-motion preferences. Default pages do not render separate refresh/retry buttons. Pass `refresh={false}` to omit the icon or `refresh={command}` to supply an explicit command (including with an explicit or omitted palette). Standalone headers using explicit palette commands do not require an entity provider or automatically add refresh. Pass `commandPalette={false}` to omit the palette, a palette props object to configure it, and `tools` for additional host tools. Root props/classes/refs are forwarded.
- `AdminCommandPalette` owns cmdk search/ranking/keyboard selection, Ctrl/Cmd+K, Radix modal focus/dismissal, parameter editors bound to RHF, and deferred execution after dismissal. Supply `commands` for a standalone catalog without an entity provider; otherwise mount under the admin application/router providers. `shortcut={false}` disables the global shortcut, `triggerId` changes its target ID, and `container` selects a themed portal. Active confirmation/account dialogs block shortcut opening.
- `AdminAccountMenu` accepts `user: { name, email, avatarUrl? }`, optional async `onSave` and `onLogout` callbacks, optional description, extra menu children, and portal container. It owns initials/photo fallback, dropdown composition, edit dialog, RHF validation, pending state, failure announcements, retry, and focus restoration. Omitting a callback omits its action. Initials preserve the shared IconButton appearance; image avatars use the base Avatar primitive.
- `AdminLanguageMenuItems` renders account-menu language choices from the same registered commands as the palette. Use it under the application/router providers. Additional host-specific account actions remain composable menu children.

Authentication, authorization, account persistence, logout/session cleanup, application title and user data remain host-owned. The demo supplies only those bindings, its simulation-specific description and editorial content. No simulated-authentication logic is shipped as framework policy.

English, Czech and Arabic UI text lives in the package's `beznyAdmin.chrome` namespace; consumers can override the resource bundle through their app-scoped i18next setup. Styles consume `--bezny-control-admin-chrome-*` aliases of structural tokens, including header height, palette result height, typography, surfaces and focus states. Build output includes ESM entry points, declarations and `style.css`; React, base primitives, RHF, cmdk and state/router dependencies are not bundled copies.

## Optional letter-hint navigation

Mount `AdminKeyboardNavigation` once in your workspace to enable Vimium-like navigation:

```tsx
import { AdminKeyboardNavigation } from "@bezny/admin/keyboard-navigation";

import "@bezny/base/style.css";
import "@bezny/admin/style.css";

// Inside your shell, alongside the route outlet:
<AdminKeyboardNavigation enabled={keyboardNavigationEnabled} />;
```

Press **F**, then type the letters shown on an actionable control. Text inputs/editors receive focus; other controls activate through their ordinary handlers. Radix dropdowns and select-only comboboxes receive Enter through the primitive's keyboard contract. Open dialogs, menus, listboxes and native popovers scope hints, including root-owned portals. The first Escape dismisses hints without dismissing the underlying layer; a subsequent Escape retains the primitive's normal behavior. Backspace edits a partial code; Tab and other unrelated interactions cancel hint mode without blocking their normal behavior.

- Mounting is opt-in. `enabled` defaults to `true` when mounted. **Expose an accessible setting to turn off this global character shortcut**, as the demo does with its header keyboard toggle. It never starts while typing in inputs, textboxes or rich editors, during composition, or with Ctrl/Alt/Meta. Descendant handlers may reject entry using `preventDefault()` or stopped propagation. Browser-extension hotkeys remain user-configured; exclude the admin URL in Vimium if needed.
- `shortcut` defaults to `"f"` and accepts one ASCII letter, case-insensitively. `alphabet` defaults to `"asdfghjkl"` and requires at least two distinct ASCII letters. Codes are deterministic and prefix-free, expanding beyond two or three letters as necessary; no target-count limit is imposed by the code generator.
- `rootRef` optionally limits discovery to a connected container and its owned portals. Without it, the whole document is eligible. Buttons, links, inputs, summaries, editable regions and supported ARIA controls are discovered semantically. Disabled, hidden, inert, covered, offscreen and closing controls are excluded; labeled checkboxes/radios are deduplicated.
- Use `data-bezny-hint` to include a custom control, `data-bezny-hint="off"` to exclude one, or `data-bezny-hints="off"` to exclude a subtree and prevent entry there. A custom control must already implement its own behavior and accessibility. Set `data-bezny-hint-action="focus"`, `"click"` or `"enter"` when its activation contract differs from the semantic default; navigation does not invent or bypass action permissions or confirmation flows.
- Idle mode installs one bubbling key listener, with no observers, polling or geometry reads. Activation batches discovery and visibility reads before inserting one noninteractive, theme-inheriting overlay. Prefix filtering uses cached codes and performs no layout reads. Scrolling, resizing, focus/pointer interaction, navigation and relevant DOM changes invalidate the session; disable/unmount removes all session resources. Hint styles use four-layer tokens under `--bezny-control-admin-navigation-*`.

## Toast notifications

Both `AdminProvider` and `AdminApplicationProvider` include an app-scoped notification host that survives route navigation. Publish messages from route components or shared action callbacks with `useAdminToasts`:

```tsx
import { useAdminToasts } from "@bezny/admin/toasts";

function SaveArticle() {
  const { publish } = useAdminToasts();
  return (
    <button
      type="button"
      onClick={async () => {
        await saveArticle(); // Application-owned persistence and error handling.
        publish({ title: "Saved", description: "Your article was saved." });
      }}
    >
      Save
    </button>
  );
}
```

`publish({ description, title?, duration?, type? })` returns a unique string ID. `dismiss(id)` removes that notification; `clear()` removes all. Duplicate messages remain separate. Radix controls timeouts, hover/focus/window-blur pausing, swipe dismissal and keyboard behavior; dismissed messages leave the queue. Defaults are 5000ms and foreground announcements; use `type: "background"` for background tasks. Message text is caller-owned, including translations and success/error policy. The package does not emit automatic messages for every command or expose a global singleton.

Configure `<AdminProvider toasts={{ duration: 8000, dismissLabel: "Close", viewportLabel: "Notifications ({hotkey})" }} router={router} />`. Options also include `label`, `swipeDirection` and `hotkey`. Tell keyboard users that F8 focuses notifications, or document your custom shortcut. `AdminApplicationProvider` translates announcement, viewport and dismiss labels through the app's i18n instance (English/Czech/Arabic defaults), updates them on language changes, and preserves RTL/theme inheritance; explicit `toasts` labels override these defaults. Low-level `AdminProvider` defaults to English and accepts localized labels directly.

Each mounted root owns its own queue, even when roots share a Jotai store. Rerenders and navigation retain messages; unmounting discards them. The hook throws outside a notification provider. For standalone screens, wrap them in `<AdminToastProvider options={...}>`; do not add another host to ordinary admin routes. Import `@bezny/base/style.css` once. The viewport renders under the provider's DOM/theme boundary; place that boundary above the provider rather than only inside a route layout. No admin-specific styles or Radix dependencies are added. Use base toast parts directly when composing optional actions, or `AlertDialog` for responses that must not be ignored.

## Composition and customization

`AdminLayout` composes an optional header, named navigation (`navigationLabel` defaults to `Administration`), one main landmark, route content, and an optional footer. Its default building block uses Bezny's styled `Shell`: a persistent sidebar at `>=64rem`, a non-modal push sidebar at `40rem`–`<64rem`, and fullscreen navigation below `40rem`, all using one navigation element. The compact sidebar sits below the navbar and transitions the unchanged-width main content sideways beyond the viewport; the navbar stays usable. These viewport variants are exclusively SCSS. Native HTML popover controls handle toggling and dismissal without application JavaScript or a modal wrapper. Pass localized `openNavigationLabel`/`closeNavigationLabel`; navigation remains inside the shell and inherits its theme. Import `@bezny/base/style.css` once. See [Shell](../base/COMPONENTS.md#shell) for accessibility, RTL, resizing and token contracts. Pass navigation links as content, not a nested `<nav>`. Put the layout in a parent route around TanStack's `Outlet`; the provider does not impose a route tree or wrap every page in another main landmark.

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

Use [registered entity applications](ENTITIES.md) when building an entity-oriented admin. Typed entity/adapter definitions and an application-owned bounded data session drive the generic `/$entity`, `/$entity/create`, `/$entity/$recordId`, and `/$entity/$recordId/edit` routes and the shared command catalog. Context comes from route matches, not pathname parsing. Default CRUD pages derive fields, filters, columns, and commands from registration; custom screens remain optional per-view overrides. Shared filter chips sit above the list and one integrated pagination navigation sits below it. See [default pages](DEFAULT-PAGES.md) for configuration. Form screens register real callbacks for the palette rather than hardcoding form IDs. The low-level provider above remains useful when owning a different route tree.

## File-based routing

Use `createAdminRuntime` when your application owns a TanStack file-based routetree. It owns the **same** registry, commands, selection, bounded data session, Jotai store and i18n instance used by `createAdminApplication`; it does not create another router. See [file-route integration](ENTITIES.md#file-based-route-integration) for loader, route-ID, navigation and lifecycle wiring. The existing programmatic factory remains supported and now also activates data through route loaders.

Both routing modes run the admin behavior suite and the complete demo test journeys, including LCRUD, forms, palette/UI actions, selection, pagination, localization/RTL, authentication presentation and custom building blocks.

## Optional realtime backend integration

Entity adapters can provide `subscribe(observer, { signal, locale })`, returning an idempotent unsubscribe function. The session owns one active entity/locale stream, coalesces invalidations, refreshes active lists/details through the same bounded loading pipeline, protects drafts and ignores stale callbacks. Unmount/navigation/disposal clean up streams; transport failures are exposed separately through `session.realtimeAtom`, and explicit refresh retries them. Omit the hook for ordinary loading or pass `realtime: false` to either application factory. No backend transport is bundled. See [the subscription contract](ENTITIES.md#optional-backend-realtime-subscriptions).

## Runnable application example

[`@bezny/demo`](../demo/README.md) registers Articles and Pages using the shared entity application API. It supplies shell branding, authentication bindings, a bounded adapter-backed mock repository, and domain field/filter/column registrations. CRUD pages, RHF forms, shared filter chips, below-list pagination, deletion confirmation, generic routes, entity context, bounded data/cache lifetimes, selection, localization/direction integration, and the command catalog come from `@bezny/admin`; no custom entity pages remain in the demo. Run `pnpm --filter @bezny/demo dev` from the repository root.

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

Entity actions are accessible from **both entity list rows and the entity detail page**, and also through the palette. The default detail page groups its list navigation and available record actions in an **Actions** dropdown beside the heading, with an end-aligned popover menu. These surfaces share action identity, permission checks, availability rules, target resolution, and execution logic. Updates navigate to the update page; deletion opens the same confirmation flow. Collection/create and selection/bulk actions use their respective contexts rather than pretending to be single-entity actions.

### Implementation and acceptance expectations

- Compose `@bezny/base` controls and RHF-bound fields rather than introducing a second component or form system. Use Radix primitives where suitable when implementing interactive UI; add only dependencies needed by that feature.
- Verify palette/UI action parity, row versus selection targeting, direct URLs and back/forward context updates, selection cleanup, and permission consistency.
- Verify LCRUD navigation, form validation/submission, and delete confirm/cancel behavior.
- Verify keyboard interaction, focus restoration, and accessible semantics for the palette and dialogs.
- Deliver each future feature with its implementation, relevant tests, and documentation in a complete functional slice.

## Development checks

From the repository root, `pnpm build`, `pnpm typecheck`, and `pnpm test` include this package through the existing workspace task graph. Provider tests cover routing with base controls, state continuity and isolation, explicit stores, typed router context, and customized pages across navigation. Building-block tests cover default semantics, content/prop/ref forwarding, heading associations, full and partial replacements, nested inheritance, sibling isolation, and rerender continuity. A build smoke check imports every emitted public entrypoint in native Node.

Reference documentation: [Jotai Provider](https://jotai.org/docs/core/provider) and [TanStack Router context](https://tanstack.com/router/latest/docs/framework/react/guide/router-context).
