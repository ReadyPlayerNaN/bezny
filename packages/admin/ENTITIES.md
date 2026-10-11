# Registered entity applications

One entity configuration drives screens, generic URLs, route context, and commands. Entity definitions describe a resource; **they do not own permanent collection data atoms**.

## Default pages

Entity registrations can derive all CRUD pages from adapter capabilities, field metadata, filters, and actions. `screens` is optional and overrides individual views. See [registration-driven default pages](DEFAULT-PAGES.md) for a no-custom-screens example, field configuration, and default deletion behavior.

## Typed adapters and entity definitions

```tsx
import { defineAdminEntity } from "@bezny/admin/adapters";
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "@bezny/admin/application";
import { useAdminEntityContext } from "@bezny/admin/context";
import { AdminLayout } from "@bezny/admin/layout";
import { AdminPage } from "@bezny/admin/page";
import { Outlet } from "@tanstack/react-router";

import { documentAdapter } from "./document-adapter";
import { parseDocumentValues } from "./document-validation";

const DocumentList = () => {
  const { entity, records } = useAdminEntityContext();
  return (
    <AdminPage heading={entity?.label}>
      {records.map((record) => (
        <p key={record.id}>{record.label}</p>
      ))}
    </AdminPage>
  );
};
const DocumentDetail = () => {
  const { recordId } = useAdminEntityContext();
  return <AdminPage heading={`Document ${recordId}`} />;
};
const documents = defineAdminEntity({
  key: "documents",
  label: "Documents",
  singularLabel: "Document",
  adapter: documentAdapter,
  reference: (record) => ({ id: record.id, label: record.title }),
  parseValues: parseDocumentValues,
  screens: { list: DocumentList, detail: DocumentDetail },
});
const Root = () => (
  <AdminLayout>
    <Outlet />
  </AdminLayout>
);
const NotFound = () => <AdminPage heading="Unavailable" />;
const application = createAdminApplication({
  entities: [documents],
  Root,
  NotFound,
  cache: {
    maxEntries: 8,
    maxBytes: 2_000_000,
    ttlMs: 30_000,
    maxPageSize: 100,
  },
});
export const App = () => <AdminApplicationProvider application={application} />;
```

`documentAdapter` implements `AdminDataAdapter<Document, DocumentValues>`:

- `list(query, { signal })` returns `{ items, total }`. Respect `query.page`, `pageSize`, `filters`, and `locale`; return only the requested page.
- `get(id, { signal })` returns that record or `null`.
- Optional `create(values, request)`, `update(id, values, request)`, and `remove(ids, request)` perform backend mutations.
- Optional `dispose()` releases adapter-owned resources when the application is permanently disposed. It must be safe if multiple definitions share a backend.

Honor cancellation signals and validate backend responses in your adapter. `defineAdminEntity` preserves record/value generics, validates references and list bounds, wraps complete records in `{ id, label, data }` envelopes, and parses unknown form values before passing typed values to mutations. The application independently limits cached payload size. Payloads must be plain JSON-compatible data, not class instances, DOM nodes, cycles, or subscriptions. The cache validates graph depth/node count, creates detached canonical copies, and freezes them so accidental backend/client mutation cannot bypass its bounds.

List and detail screens default to the package-owned pages. Default create/update screens require registered `form` metadata and corresponding adapter operations; custom create/update screens require their operations but may own their forms. `screens` optionally overrides each view. Missing adapter capabilities mean omitted operation commands, not pretend operations. Entity keys are unique lowercase slugs; record IDs are non-empty, unique within each returned page, and cannot be `create` (case-insensitively reserved for the create route). Get/update adapters must return the requested ID. Invalid async data becomes a recoverable loading error rather than retained invalid state.

## Route contract

| Operation | TanStack pattern          | Example instances                   |
| --------- | ------------------------- | ----------------------------------- |
| List      | `/$entity`                | `/articles`, `/pages`               |
| Create    | `/$entity/create`         | `/articles/create`, `/pages/create` |
| Detail    | `/$entity/$recordId`      | `/articles/1`, `/pages/1`           |
| Update    | `/$entity/$recordId/edit` | `/articles/1/edit`, `/pages/1/edit` |

The detail URL is conventionally `/:entity/:id`. Context reads actual matches and decoded parameters, never pathname regexes/string splitting. Navigation uses typed domain locations and TanStack encoding. Unsupported entities, records, and operations render `NotFound` within the application shell. `/` redirects to the first collection.

Create an application once, outside render. Supply `history` for custom routing/testing, `store` for explicit Jotai ownership, and `cache` to configure data bounds. `AdminApplicationProvider` accepts existing presentation `components` overrides. The low-level `AdminProvider` remains available for unrelated application-owned routing.

## File-based route integration

The application can create its own TanStack file-route tree and use all the same entity features without copying Bezny internals. Use the public runtime factory, then attach that runtime to exactly one host router **before** loading or mounting it:

```tsx
import { AdminApplicationProvider } from "@bezny/admin/application";
import { createAdminRuntime } from "@bezny/admin/runtime";
import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

const admin = createAdminRuntime({
  entities,
  NotFound,
  store, // optional explicit Jotai store, also used by route loaders
  routes: {
    list: { id: "/_admin/$entity", path: "/$entity" },
    create: { id: "/_admin/$entity_/create", path: "/$entity/create" },
    detail: { id: "/_admin/$entity_/$recordId", path: "/$entity/$recordId" },
    update: {
      id: "/_admin/$entity_/$recordId_/edit",
      path: "/$entity/$recordId/edit",
    },
  },
});
const router = createRouter({ routeTree, context: { admin } });
const application = admin.attach(router);
// Render <AdminApplicationProvider application={application} />.
```

Type the root's router context with `AdminRuntime` and put your normal layout and `Outlet` there. Each entity file route renders `AdminEntityScreen` and activates its view through the corresponding loader:

```tsx
import { AdminEntityScreen } from "@bezny/admin/application";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/$entity_/$recordId")({
  component: AdminEntityScreen,
  loader: (args) => args.context.admin.loader("detail")(args),
});
```

Use `list`, `create` and `update` loaders on the other three routes. The host owns `/` redirects, login/error/unknown routes and authentication `beforeLoad` guards. Do not activate data from component effects. Pass the complete loader arguments (including `preload` and `abortController`). Preloading never changes visible entity state; actual navigation waits for activation after route guards.

Bindings distinguish TanStack route **IDs** (which include pathless layouts and non-nesting markers) from navigation **paths**. Match IDs and paths against the generated tree; `attach` rejects mismatches. Paths must use `$entity` and, for record views, `$recordId`, as in the existing generic route contract. No pathname parsing or second command catalog is needed. The test fixture under `test/file-routes/` is generated by the real TanStack CLI and demonstrates this integration with a pathless layout and non-nested entity routes.

The runtime disables TanStack loader-result freshness on the four bound routes (`staleTime: 0`, `preloadStaleTime: 0`, `shouldReload: true`). Bezny's bounded session is the only entity-data cache; a cached speculative loader result must not skip activation on navigation. Do not override those options after attach. Other host routes are unaffected. Use one runtime per router/store ownership boundary; a runtime cannot be attached to a different router or reused after disposal.

Query and language changes activate the current request via Jotai/i18next subscriptions; response-driven page clamping also stays in the runtime. The provider keeps presentation overrides and language/direction behavior. Unmount pauses the session, clears data/selection/query/commands and removes subscriptions; remount invalidates host routes so loaders reconstruct state. Dispose after unmount when abandoning the application. Backend authorization remains required on every operation regardless of router guards or visible command permissions.

## Data ownership and lifecycle

`useAdminDataSession()` exposes `create`, `update`, `remove`, `refresh`, and `invalidate`, plus the active `snapshotAtom` and diagnostic counters. Backend changes invalidate the entity's cached pages/details and refresh the active request. Default screens derive RHF forms from registration metadata; custom screens can own RHF forms and schemas. Neither duplicates mutation/cache logic. Parse `context.data.items[n].data` with your domain schema when reading complete record payloads.

Jotai holds a single active page/detail snapshot and small UI state (selection, commands, queries). Runtime reference atoms hold only the active bounded page's `{ id, label }` values; they start empty and are explicitly cleared. The cache is application-owned, bounded by entry count **and serialized bytes**, and expires inactive entries automatically. One active page may remain visible after its cache entry expires; its own payload also respects the byte budget. Thus retained data is bounded by the cache budget plus one active snapshot, not the number of previously visited records.

The runtime:

- Cancels superseded reads and ignores late responses, even if an adapter neglects cancellation.
- Rejects oversized pages/payloads instead of retaining them.
- Clears active data, cache entries, timers, query state, selection, page callbacks, and router subscriptions when the provider unmounts.
- Allows remounting the same application with an empty cache and fresh reads.
- Permanently releases resources through idempotent `application.dispose()`, including adapter `dispose()` hooks. Dispose after unmounting when abandoning an application; disposed applications are not reusable.

Adapters own domain persistence separately. Do not close over unbounded client-side collections in production adapters; use a remote/persistent backend. The demo uses a capped application-owned mock repository (200 records, bounded field lengths), clears it on disposal, and disposes its application during Vite hot-module replacement. The immutable seed data is a small constant fixture, not cached runtime state.

## Shared commands and actions

`useAdminEntityCommands()` supplies:

- `navigationCommands` for all registered collection/create routes.
- Current entity `list`, nullable `create`, and nullable `refresh`/retry.
- `forRecord(id)` for supported View/Edit and registered record actions.
- `forSelection(id)` for a checkbox/palette selection toggle.
- `selectionCommands` for bulk actions and clear-selection.
- Registered `pageCommands` and a composed `paletteCommands` catalog.

Commands carry stable identity, labels, one execution function, and optional typed `location`. Use the same instances/execution paths for navigation, rows, details, menus, and palette presentation. `useAdminEntityNavigate()` accepts `{ entity, view, recordId? }` instead of handwritten URLs.

An entity action has an `id`, `target` (`record`/`selection`), label function, execution callback, optional destructive flag, reactive `enabled` boolean atom, and optional context-dependent `isAvailable(scope)`. The scope includes entity, matched view, target IDs/references, Jotai store, data session, and domain navigation. Use the session for mutations/cache invalidation; request confirmation before destructive changes. Actual backend authorization remains mandatory.

Targets/permissions are revalidated at execution. Bulk commands also revalidate their selection snapshot; stale selection commands cannot mutate a different entity. IDs in different entity namespaces never collide. Selection is limited to current visible references and clears when changing collections, queries, or leaving a list (including browser history).

`useAdminPageCommands(memoizedCommands)` registers real screen callbacks, such as RHF `handleSubmit(save)` and Cancel. These leave the palette when the screen leaves; superseded callback registrations become inert even on the same screen. Compose one registration per active screen rather than competing registrations from independent panels.

## Collection filters and pagination

Configure `filters: [{ key: "search", label: "Search" }, { key: "status", label: "Status", options: [{ value: "draft", label: "Draft" }] }]` and `pageSize` on the entity. Filter keys/options must be unique; an empty option is reserved for clearing. The adapter receives normalized string filters, a one-based page, and a bounded page size, and returns the filtered total (not merely the page length).

`useAdminListControls()` from `@bezny/admin/list` exposes `filterCommands`, `paginationCommands`, optional `clear`, `query`, `total`, and `pageCount`. These parameterized commands are automatically included in `useAdminEntityCommands().paletteCommands`. A command's optional `input` describes its current value, label, constraints/options, and validated `execute(value)` callback. Render the same callbacks in ordinary filters and a palette input editor; do not maintain separate query logic.

Changing a filter, clearing filters, or changing page size resets to page 1 and clears selection. Previous/Next are offered only within known bounds; Go to page validates integers/range. Empty collections have one empty page. Removing the last record on a later page clamps to the new last page. Stale query commands cannot overwrite a newer request. Queries persist across entity routes in small entity-keyed Jotai state, not in URLs; unmount clears them. List screens remain mounted while loading/error so controls stay usable; render loading, error/retry, and empty states distinctly.

## Localization and content

The application uses **i18next + react-i18next**, not a separate translation API. It owns an isolated instance by default; pass an initialized `i18n` instance to `createAdminApplication` to integrate existing resources/backends. `createAdminI18n(options)` from `@bezny/admin/i18n` initializes inline resources synchronously, merges the `beznyAdmin` English/Czech/Arabic defaults without overwriting caller translations, and uses English fallback. For asynchronous backends initialize an instance with i18next yourself and await initialization before creating the application.

Entity `labelKey`/`singularLabelKey`, filter `labelKey`, and option `labelKey` use normal i18next keys (including namespace prefixes such as `editorial:entities.articles.plural`). Existing literal labels are default values. Localized registry metadata preserves the same adapters and reference atoms; it never registers duplicate routes/entities. Translate custom action labels with your i18next instance; action scopes expose localized entity labels. Screens use the standard `useTranslation` hook for forms, validation, confirmations, and presentation.

The shared catalog exposes `languageCommands` and includes them in the palette. Commands use `supportedLngs` (excluding i18next's testing mode). UI language changes update adapter `query.locale`; list/get also receive `request.locale`. Locale participates in the bounded cache key, so content from one locale is not mistaken for another. The application boundary supplies `lang`/`dir` and Radix `DirectionProvider`; custom portalled content should also specify its own direction when it does not inherit a primitive's direction context.

**UI resources are not record storage.** Adapters own localized content and return projections appropriate to the requested locale. Forms submit an explicit content locale independently of the UI locale; the backend must preserve other locales. The demo stores at most three bounded content translations per record, uses ephemeral per-record i18next instances for library fallback, preserves literal user interpolation syntax, and never inserts record content into the long-lived UI resource store. Missing content falls back to English or the record's source language. Locale-aware counts use `Intl.NumberFormat` (Arabic numbering for Arabic); persisted IDs remain unchanged.

The demo's RHF Save/Cancel, title/body editing, publication toggle, and content-language switch are all registered screen commands. Optional command inputs support text, numbers, multiline text, and choices; input callbacks have the same registration ownership guards as ordinary callbacks. Keep namespace/resource loading and instance disposal under application ownership rather than introducing module-level record translation caches.

## Demo and verification

[`@bezny/demo`](../demo/README.md) registers Articles and Pages through this public API. Their adapter-backed LCRUD, shared `EntityRowList` context menus, and actual form callbacks demonstrate the same routing/command infrastructure without a second route or palette implementation.

Tests verify adapter validation, bounded navigation/cache growth, byte limits, LRU/TTL eviction, cancellation/late responses, mutation invalidation, repeated mount/unmount, idempotent disposal, generic/encoded routing, permissions, scoped selection, callback ownership, and demo workflows. The demo also renders shared text/choice filters, pagination buttons, and parameterized palette commands for arbitrary filters, page numbers, and page sizes. English/Czech/Arabic UI and content, independent localized-content editing, library fallback, locale switching from ordinary controls/palette, reactive notices, localized RHF errors/focus, and RTL keyboard/menu behavior are demonstrated and tested.
