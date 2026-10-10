# @bezny/demo

A runnable editorial admin using `@bezny/admin`'s **registered entities**, not a parallel article-specific router and palette.

## Run

```sh
pnpm install
pnpm --filter @bezny/demo dev
```

The dev script builds base/admin first, then starts Vite (normally `http://localhost:5173`). The application starts on the login screen; after signing in, `/` opens the first registered entity, Articles. Pages is a second independent entity with the same UI/data shape. Rebuild the library packages after editing their source; demo edits update through Vite.

## Login and account demo

- **Email/password:** `editor@example.com` / `bezny-demo`. Incorrect credentials show a retryable error; required fields and email format use RHF validation.
- **Social login:** choose **Continue with Google** or **Continue with GitHub** to simulate that provider's user. No OAuth popup, network request, or real provider account is involved.
- The main header's **avatar menu** shows the current name/email, **Edit account**, language radio options, and **Log out**. Edit account updates the display name and email in an RHF form; Save updates avatar initials, and Cancel/Escape discards edits. Profile edits do not change the fixed demo login credentials.
- Deep-link URLs are retained through sign-in. Logout hides the admin screens, clears selection/notices/deletion requests, and returns to an empty login form. In-memory editorial records remain until reload.

Authentication is deliberately simulated, not a security boundary: there is no server-side authentication or authorization. Do not enter real credentials. Passwords are never put in the session atom or browser storage. The demo user/profile is application-scoped, kept only in memory, and reset on logout, disposal, or reload. Login and account labels support English, Czech, and Arabic/RTL.

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

Every listed entity record has its title rendered as a TanStack Router detail hyperlink, including Articles and Pages. Normal clicks/Enter navigate without reloading the in-memory application; native Ctrl/Cmd-click and new-tab link behavior remain available. Shared `EntityRowList` rows show actions only in Radix context menus (right-click, touch hold, or Shift+F10), not duplicated inline buttons. Rows highlight on hover/focus, and selection checkboxes appear on hover/focus or while selected; touch devices keep them visible. Single/unselected row menus and detail pages use the same `forRecord` commands as the palette. Menus opened on a selected row in a multi-selection instead use the same `selectionCommands` as the floating selection bar/palette. The bar appears only with a selection and stays in one fixed row at the bottom center of the viewport: a locale-formatted selected count, a SquareMenu button opening a Radix dropdown of shared actions, and an X button clearing selection. Both Lucide icons use Bezny's `Icon` wrapper; buttons have localized accessible names. The dropdown supports keyboard navigation and Escape/focus return; selecting Delete closes it before opening confirmation. Record delete targets that row even with another selection; bulk delete uses valid selected IDs. Cancelling bulk confirmation preserves selection. Both request the same Radix-backed confirmation dialog. Confirmation deletes the requested entity's records and navigates through the shared entity-location API.

## Real screen context and form callbacks

Collection create buttons sit beside the page heading, at the right in LTR, with descriptions below. Detail pages use the same header action slot for one localized **Actions** dropdown containing list, edit, and delete commands. The dropdown closes before executing a command so navigation and confirmation dialogs can take focus; cancelling deletion restores focus to the Actions trigger.

The application banner stays on one line with a `3rem` maximum height; the avatar and command-palette tools remain accessible when the title is truncated on narrow screens. Context appears in a fixed bottom status bar with `0.5rem` text, `0.75rem` line height, and `1.25rem` height. Page padding reserves its space, and the floating selection controls sit above it. Geometry and typography use the four-layer `shell-*` token chain, exposed through `--bezny-control-editorial-demo-<header-height|status-height|status-font-size|status-line-height>`. The round avatar trigger consumes `--bezny-control-editorial-demo-avatar-trigger-size` and `--bezny-control-editorial-demo-avatar-trigger-radius`, backed by structural icon-button size and avatar radius.

The status bar displays context from `useAdminEntityContext`: collection, decoded entity record ID, selected IDs, or unavailable target. Jotai selection is entity-scoped, so article `1` and page `1` cannot be confused. Leaving the collection or switching entities clears selection, including browser history navigation.

Create/edit screens use RHF and Bezny fields. They register Save/Cancel with `useAdminPageCommands`, binding actual form callbacks. The palette submits through the same RHF handler as the form, with the same validation and focus behavior. No hardcoded form ID or `requestSubmit()` DOM lookup is needed. Commands disappear when their owning screen leaves.

Open **Command palette** with its header button (mouse, Enter, or Space). Type to filter, Tab to a command, and Enter to execute. Escape closes it and restores focus. Radix owns modal focus, dismissal, and accessibility; native buttons supply command activation. The palette intentionally does not emulate arrow-key listbox behavior.

## Presentation and data boundaries

`AdminApplicationProvider` receives customized Layout/Page/PageHeader blocks. A parent `AdminLayout` contains one main landmark and an `Outlet`; entity screens use `AdminPage`. Styles consume demo control aliases backed by existing structural surface tokens and the base stylesheet. OS light/dark theming remains available.

Data adapters, complete record data, forms, and confirmation presentation are demo-owned. Generic routing, registry validation, entity context, selection state, action availability, and the command catalog are admin-owned. See [the entity API](../admin/ENTITIES.md) for reusable contracts.

The mock backend is deliberately **in memory and bounded**: three articles and one page are seeded, at most 200 records are retained with bounded field lengths, edits persist across routes, and reload resets everything. Jotai does not hold entire datasets: the admin session owns one active page/detail and an entry/byte/TTL-bounded cache, aborts stale requests, and clears data/timers/subscriptions on unmount. Permanent application disposal clears the mock repository too; Vite HMR unmounts and disposes the old application. Collection controls demonstrate search/status filters and pagination; the palette offers the same filters, previous/next, arbitrary page navigation, and page-size changes. Filters/page sizes reset pagination and selection consistently. There is no production backend, authentication, permissions service, or unsaved-change blocker. This demo proves shared entity infrastructure; it does not pretend to be a production content system.

For built `dist/` hosting, serve `index.html` for application deep links.

## Languages and localized content

The UI uses i18next/react-i18next with English, Czech, and Arabic resources. The header uses an icon-only Lucide Command button for the palette and a user avatar button with a localized accessible label. Language selection lives inside the avatar dropdown, using Bezny's Radix-backed radio items to indicate the current locale and preserve keyboard navigation/Escape focus return. Account-menu language controls and palette language commands share execution; Arabic switches the application and Radix primitives to RTL. Entity/action labels, filters, pagination, palette prompts, forms, validation, confirmations, and reactive notices are localized. Counts are locale-formatted; IDs and routes remain stable.

Record content is separate from UI resources. The first article has English/Czech/Arabic content; other seed records demonstrate English fallback. The RHF content-language selector (also in the palette) edits one locale independently of UI language and preserves other locales. New records retain their source language; missing content falls back to English or that source language through i18next. Title/body editing and publication toggling are actual registered form commands. Content resources are ephemeral per-record instances, not a growing global translation registry.

## Source map

- `src/demo-application.tsx`: creates/mounts the shared admin application; no per-entity routes.
- `src/editorial-entities.ts`: typed entity/adapter/action registrations; no palette entries.
- `src/editorial-records.ts`: bounded mock backend, typed adapters, DTO validation, and data-source descriptors.
- `src/editorial-content.ts`: localized-content contracts and standard i18next fallback.
- `src/editorial-translations.ts`: UI resource bundles; no record data.
- `src/editorial-pages.tsx`: entity-independent list/detail/form screens and real page callbacks.
- `src/editorial-dialogs.tsx`: palette presentation and entity-aware delete confirmation.
- `src/editorial-layout.tsx`: login/workspace presentation, registered navigation, matched context.
- `src/editorial-authentication.tsx`: simulated login callbacks and application-scoped user atom.
- `src/editorial-account-menu.tsx`: avatar dropdown and profile editor.
- `src/editorial-account-translations.ts`: localized login/account messages.
- `src/editorial-language-menu.tsx`: shared language commands as account-menu radio options.
- `src/editorial-appearance.scss`, `src/editorial-admin.module.scss`: scoped presentation using internal workspace Sass token accessors.

## Checks

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm exec ultracite check packages/admin packages/demo
```

Admin tests verify arbitrary/renamed entity registrations, generic routing and encoded IDs, route/capability-command parity, permission updates, missing targets, scoped selection, real screen command registration/cleanup, and invalid registrations. Demo tests exercise LCRUD, two independent entities, shared palette/UI actions, forms, history, and modal keyboard/focus behavior. Sass tests verify pure accessors and emitted token references.
