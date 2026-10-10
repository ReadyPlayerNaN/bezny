# Registered entity applications

One entity configuration drives screens, generic URLs, route context, and commands. Entity definitions describe a resource; **they do not own permanent collection data atoms**.

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

`list` is a required screen; `create`, `detail`, and `update` are optional capabilities. Create/update screens require corresponding adapter operations. Omitted screens mean omitted route commands, not pretend operations. Entity keys are unique lowercase slugs; record IDs are non-empty, unique within each returned page, and cannot be `create` (case-insensitively reserved for the create route). Get/update adapters must return the requested ID. Invalid async data becomes a recoverable loading error rather than retained invalid state.

## Route contract

| Operation | TanStack pattern          | Example instances                   |
| --------- | ------------------------- | ----------------------------------- |
| List      | `/$entity`                | `/articles`, `/pages`               |
| Create    | `/$entity/create`         | `/articles/create`, `/pages/create` |
| Detail    | `/$entity/$recordId`      | `/articles/1`, `/pages/1`           |
| Update    | `/$entity/$recordId/edit` | `/articles/1/edit`, `/pages/1/edit` |

The detail URL is conventionally `/:entity/:id`. Context reads actual matches and decoded parameters, never pathname regexes/string splitting. Navigation uses typed domain locations and TanStack encoding. Unsupported entities, records, and operations render `NotFound` within the application shell. `/` redirects to the first collection.

Create an application once, outside render. Supply `history` for custom routing/testing, `store` for explicit Jotai ownership, and `cache` to configure data bounds. `AdminApplicationProvider` accepts existing presentation `components` overrides. The low-level `AdminProvider` remains available for unrelated application-owned routing.

## Data ownership and lifecycle

`useAdminDataSession()` exposes `create`, `update`, `remove`, `refresh`, and `invalidate`, plus the active `snapshotAtom` and diagnostic counters. Backend changes invalidate the entity's cached pages/details and refresh the active request. Screens own RHF forms and schemas; they do not duplicate mutation/cache logic. Parse `context.data.items[n].data` with your domain schema when reading complete record payloads.

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

## Demo and verification

[`@bezny/demo`](../demo/README.md) registers Articles and Pages through this public API. Their adapter-backed LCRUD, shared `EntityRowList` context menus, and actual form callbacks demonstrate the same routing/command infrastructure without a second route or palette implementation.

Tests verify adapter validation, bounded navigation/cache growth, byte limits, LRU/TTL eviction, cancellation/late responses, mutation invalidation, repeated mount/unmount, idempotent disposal, generic/encoded routing, permissions, scoped selection, callback ownership, and demo workflows. Filter/pagination controls and multilingual presentation are tracked separately in the repository TODO.
