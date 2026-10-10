# @bezny/demo

A runnable editorial admin using `@bezny/admin`'s **registered entities**, not a parallel article-specific router and palette.

## Run

```sh
pnpm install
pnpm --filter @bezny/demo dev
```

The dev script builds base/admin first, then starts Vite (normally `http://localhost:5173`). `/` opens the first registered entity, Articles. Pages is a second independent entity with the same UI/data shape. Rebuild the library packages after editing their source; demo edits update through Vite.

## One registration drives routes and commands

`editorialResources` describes Articles and Pages without retaining dataset atoms. `createEditorialEntities` uses typed `defineAdminEntity` configurations to register their adapters, references, screens, and record/bulk delete actions with `createAdminApplication`.

The application has no entity-specific route definitions:

| Generic route             | Article instance   | Page instance   |
| ------------------------- | ------------------ | --------------- |
| `/$entity`                | `/articles`        | `/pages`        |
| `/$entity/create`         | `/articles/create` | `/pages/create` |
| `/$entity/$recordId`      | `/articles/1`      | `/pages/1`      |
| `/$entity/$recordId/edit` | `/articles/1/edit` | `/pages/1/edit` |

The sidebar/navigation and searchable palette both consume `useAdminEntityCommands`. The palette does not reconstruct routes, parse pathname strings, or maintain a separate action list. Adding another entity registration makes its collection/create commands available automatically; supported record screens provide View/Edit commands automatically.

Shared `EntityRowList` rows, their Radix context menus, and detail pages render the same `forRecord` commands as the palette. Record delete targets that row even with another selection; bulk delete uses valid selected IDs. Both request the same Radix-backed confirmation dialog. Confirmation deletes the requested entity's records and navigates through the shared entity-location API.

## Real screen context and form callbacks

The header displays context from `useAdminEntityContext`: collection, decoded entity record ID, selected IDs, or unavailable target. Jotai selection is entity-scoped, so article `1` and page `1` cannot be confused. Leaving the collection or switching entities clears selection, including browser history navigation.

Create/edit screens use RHF and Bezny fields. They register Save/Cancel with `useAdminPageCommands`, binding actual form callbacks. The palette submits through the same RHF handler as the form, with the same validation and focus behavior. No hardcoded form ID or `requestSubmit()` DOM lookup is needed. Commands disappear when their owning screen leaves.

Open **Command palette** with its header button (mouse, Enter, or Space). Type to filter, Tab to a command, and Enter to execute. Escape closes it and restores focus. Radix owns modal focus, dismissal, and accessibility; native buttons supply command activation. The palette intentionally does not emulate arrow-key listbox behavior.

## Presentation and data boundaries

`AdminApplicationProvider` receives customized Layout/Page/PageHeader blocks. A parent `AdminLayout` contains one main landmark and an `Outlet`; entity screens use `AdminPage`. Styles consume demo control aliases backed by existing structural surface tokens and the base stylesheet. OS light/dark theming remains available.

Data adapters, complete record data, forms, and confirmation presentation are demo-owned. Generic routing, registry validation, entity context, selection state, action availability, and the command catalog are admin-owned. See [the entity API](../admin/ENTITIES.md) for reusable contracts.

The mock backend is deliberately **in memory and bounded**: three articles and one page are seeded, at most 200 records are retained with bounded field lengths, edits persist across routes, and reload resets everything. Jotai does not hold entire datasets: the admin session owns one active page/detail and an entry/byte/TTL-bounded cache, aborts stale requests, and clears data/timers/subscriptions on unmount. Permanent application disposal clears the mock repository too; Vite HMR unmounts and disposes the old application. Collection controls demonstrate search/status filters and pagination; the palette offers the same filters, previous/next, arbitrary page navigation, and page-size changes. Filters/page sizes reset pagination and selection consistently. There is no production backend, authentication, permissions service, or unsaved-change blocker. This demo proves shared entity infrastructure; it does not pretend to be a production content system.

For built `dist/` hosting, serve `index.html` for application deep links.

## Source map

- `src/demo-application.tsx`: creates/mounts the shared admin application; no per-entity routes.
- `src/editorial-entities.ts`: typed entity/adapter/action registrations; no palette entries.
- `src/editorial-records.ts`: bounded mock backend, typed adapters, DTO validation, and data-source descriptors.
- `src/editorial-pages.tsx`: entity-independent list/detail/form screens and real page callbacks.
- `src/editorial-dialogs.tsx`: palette presentation and entity-aware delete confirmation.
- `src/editorial-layout.tsx`: presentation replacements, registered navigation, matched context.
- `src/editorial-appearance.scss`, `src/editorial-admin.module.scss`: scoped presentation using internal workspace Sass token accessors.

## Checks

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm exec ultracite check packages/admin packages/demo
```

Admin tests verify arbitrary/renamed entity registrations, generic routing and encoded IDs, route/capability-command parity, permission updates, missing targets, scoped selection, real screen command registration/cleanup, and invalid registrations. Demo tests exercise LCRUD, two independent entities, shared palette/UI actions, forms, history, and modal keyboard/focus behavior. Sass tests verify pure accessors and emitted token references.
