# @bezny/demo

A runnable editorial administration application built with **@bezny/admin**, rather than a standalone component showcase.

## Run it

From the repository root:

```sh
pnpm install
pnpm --filter @bezny/demo dev
```

The dev script builds `@bezny/base` and `@bezny/admin`, then starts Vite (normally `http://localhost:5173`). Open `/articles`, or enter any of the entity URLs directly. Rebuild the library packages after changing their source; demo source updates through Vite.

## What the application demonstrates

- `AdminProvider` owns a typed TanStack router, an isolated Jotai workspace, and application-wide `Layout`, `Page`, and `PageHeader` replacements.
- `AdminLayout` contains the editorial header, navigation, current-context display, one main landmark, and footer. A parent route renders `Outlet`; individual routes compose `AdminPage`.
- The article list has selectable rows, publication badges, and shared View/Edit/Delete actions. The detail page exposes the same edit/delete actions.
- Create and update forms use React Hook Form with Bezny fields, validation feedback, and invalid-field focus.
- Deletion uses Bezny's Radix-based alert dialog with explicit confirmation, cancel/escape behavior, focus restoration, post-delete navigation, and selection cleanup.
- A searchable command palette uses Bezny's Radix-based dialog. Collection, row/detail, selection, and form commands use the same action definitions or submission path as the ordinary UI. Deletion from the palette opens the same confirmation dialog; it never bypasses confirmation.

### Routes

| URL                | Screen                         |
| ------------------ | ------------------------------ |
| `/`                | Redirects to `/articles`       |
| `/articles`        | List and selection             |
| `/articles/create` | Create page                    |
| `/articles/1`      | Detail page (seed article `1`) |
| `/articles/1/edit` | Update page                    |

Missing records display a not-found page without stale entity actions. Static create routes are distinct from article IDs. Browser back/forward navigation updates context.

### Context and commands

The header reports `Articles` on the collection, `Article 1` on its detail/edit pages, and stable IDs for selected articles. Selecting all three seed articles gives `Selected articles: 1, 2, 3`. Clearing selection restores collection context; leaving the collection clears selection. Explicit row actions target that row, not whichever articles happen to be selected. Bulk deletion targets the selection.

Open **Command palette** with the header button (mouse, Enter, or Space). Focus starts in the search input. Type a command name, Tab to a result, and press Enter; Escape closes the palette and restores focus. This intentionally uses native buttons and Radix dialog focus behavior rather than emulating listbox keyboard behavior. Form commands submit through `requestSubmit()` and RHF, so validation cannot be bypassed.

The demo supplies application-specific entity/context/command code. These are **not yet reusable entity APIs exported by @bezny/admin**. It exercises the existing admin composition/customization API and gives future framework features a concrete integration example.

## Data and limitations

Three articles are seeded in an in-memory Jotai store. Creates, edits, deletes, and selections persist across routes in the current session only. Reloading resets the workspace. There is no backend, authentication, permissions system, storage synchronization, or unsaved-change blocker. All seed records are editable; a production application must add authorization to the common command execution path.

The Vite development server serves deep links through its SPA fallback. When hosting the built `dist/`, configure your server to serve `index.html` for application URLs such as `/articles/1/edit`.

## Source map

- `src/demo-application.tsx`: application factory, router, admin provider, and selection cleanup.
- `src/editorial-layout.tsx`: customized admin blocks and route shell.
- `src/article-state.ts`: seeded records and stable entity-context model.
- `src/article-actions.ts`: shared context-sensitive command definitions.
- `src/article-pages.tsx`: list, detail, create/update, and missing-record pages.
- `src/article-dialogs.tsx`: searchable palette and shared delete confirmation.
- `src/editorial-appearance.scss` and `src/editorial-admin.module.scss`: demo control tokens and scoped presentation. Control aliases reference existing structural surface tokens in the workspace's internal Sass modules; the base stylesheet supplies foundational, logical, and structural declarations. No new public Sass export is implied.

Override demo control aliases on the scope where they are declared (`.application`, `.actions`, `.commands`, or `.form`), or customize the admin replacement components. Import `@bezny/base/style.css` once at the application entrypoint to retain OS light/dark theming.

## Verification

From the repository root:

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm exec ultracite check packages/demo
```

The workspace task graph builds library dependencies before demo checks. Tests cover LCRUD, validation/submission/focus, row-versus-selection targeting, history context, action/palette parity, keyboard palette interaction, delete confirm/cancel, missing records, store isolation, and the complete Sass token reference chain.
