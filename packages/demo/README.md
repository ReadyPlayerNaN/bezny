# @bezny/demo

A runnable editorial admin using `@bezny/admin`'s **registration-derived default CRUD pages**, not custom entity screens or a parallel router/palette.

## Run

```sh
pnpm install
pnpm --filter @bezny/demo dev
```

The dev script builds base/admin first, then starts Vite (normally `http://localhost:5173`). Authentication is simulated entirely in the browser. Without a valid session, the application starts on the login screen; after signing in, `/` opens the first registered entity, Articles. Pages is a second independent entity with the same UI/data shape. Rebuild the library packages after editing their source; demo edits update through Vite.

## Framework header and tools

The header title/tool arrangement, command palette/input editor, avatar/account dropdown/profile form, and language-menu UI are supplied by `@bezny/admin/header`, with styles from `@bezny/admin/style.css`. The demo uses `AdminHeader`; its account wrapper only binds the mock session, persistence callbacks and logout cleanup. No palette or account UI implementation remains in the demo. Applications can reuse these components with their own title, user data, services and registered command catalog.

The workspace also mounts [`AdminKeyboardNavigation`](../admin/README.md#optional-letter-hint-navigation). Press **F**, then type a visible hint code to activate a control or focus an editor. The localized keyboard icon toggles this optional character shortcut; it is enabled initially and does not intercept typing or Ctrl/Cmd+K. Open menus/dialogs/navigation popovers scope hints, and the first Escape cancels hints without closing the underlying layer.

## Login and account demo

- **Email/password:** `editor@example.com` / `bezny-demo`. Incorrect credentials show a retryable error; required fields and email format use RHF validation.
- **Social login:** choose **Continue with Google** or **Continue with GitHub** to simulate that provider's user. The browser simulation issues a mock token for that identity; no authentication server, network request, OAuth popup, or real provider account is involved.
- The main header's **avatar menu** shows the current name/email, **Edit account**, language radio options, and **Log out**. Edit account updates the display name and email in an RHF form; Save updates avatar initials, and Cancel/Escape discards edits. Profile edits do not change the fixed demo login credentials.
- Deep-link URLs are retained through sign-in. Logout hides the admin screens, clears selection/notices/deletion requests, and returns to an empty login form. In-memory editorial records remain until reload.

The browser-only simulation keeps an opaque mock token in `sessionStorage` (`bezny.demo.session-token.v1`) and its mock session record separately (`bezny.demo.simulated-session.v1`). The record represents the simulated authentication provider's state: token, profile, and eight-hour expiry. Passwords are never stored. Refresh matches the token to that record and restores the profile; account edits survive refresh. Logout removes both entries. Disposal/HMR clears in-memory state without ending the simulated session. Missing, corrupt, mismatched, or expired sessions return to login. Closing the tab ends the browser session; if browser storage is blocked, login still works in memory but cannot survive refresh.

These are simulated tokens, not real authentication or a security boundary. All authentication runs locally, without HTTP endpoints or server middleware. Do not enter real credentials. Login/account labels support English, Czech, and Arabic/RTL.

## One registration drives routes and commands

`editorialResources` describes Articles and Pages without retaining dataset atoms. `createEditorialEntities` uses typed `defineAdminEntity` configurations to register adapters, references, columns, fields, defaults, and filters with `createAdminApplication`. It supplies no `screens`, `NotFound`, or custom deletion actions: list/detail/create/update/loading/unavailable pages and confirmation UI all come from the package. See [default pages](../admin/DEFAULT-PAGES.md).

The application has no entity-specific route definitions:

| Generic route             | Article instance   | Page instance   |
| ------------------------- | ------------------ | --------------- |
| `/$entity`                | `/articles`        | `/pages`        |
| `/$entity/create`         | `/articles/create` | `/pages/create` |
| `/$entity/$recordId`      | `/articles/1`      | `/pages/1`      |
| `/$entity/$recordId/edit` | `/articles/1/edit` | `/pages/1/edit` |

The vertical **Entities** navigation is generated from `useAdminEntityRegistry().entities`, using each entity's localized plural label and a typed TanStack collection link. It has no manually listed Articles/Pages entries. The searchable palette derives its navigation commands from the same registry through `useAdminEntityCommands`. The palette does not reconstruct routes, parse pathname strings, or maintain a separate action list. Adding another entity registration makes its collection/create commands available automatically; supported record screens provide View/Edit commands automatically.

Every listed entity record has its title rendered as a TanStack Router detail hyperlink, including Articles and Pages. Shared default rows use compact, wrapping inline metadata rather than browser-indented definition lists. The registrations provide whitespace-normalized summaries limited to 140 Unicode code points for list previews and shared success/neutral status badges; detail pages retain the complete body. No custom card or CRUD page is introduced. Normal clicks/Enter navigate without reloading the in-memory application; native Ctrl/Cmd-click and new-tab link behavior remain available. Shared `EntityRowList` rows show actions only in Radix context menus (right-click, touch hold, or Shift+F10), not duplicated inline buttons. Rows highlight on hover/focus, and selection checkboxes appear on hover/focus or while selected; touch devices keep them visible. Single/unselected row menus and detail pages use the same `forRecord` commands as the palette. Menus opened on a selected row in a multi-selection instead use the same `selectionCommands` as the default bulk controls and palette. The package renders a compact fixed bottom-center selection bar with the selected count, an icon-triggered action menu, and a clear-selection icon. Delete selected lives in that menu, not a full-width inline button. The bar is shared admin UI, not demo-owned presentation. Record delete targets that row even with another selection; bulk delete uses valid selected IDs. Cancelling bulk confirmation preserves selection. Both request the same Radix-backed confirmation dialog. Confirmation deletes the requested entity's records and navigates through the shared entity-location API.

## Real screen context and form callbacks

Default collection create buttons sit beside the page heading. Refresh/retry is a labeled icon button in the application header immediately left of the command-palette icon, not an individual page button. Default detail pages group list navigation and available record actions in an Actions dropdown beside the heading; record menu items use concise View, Edit, and Delete labels. The shared deletion dialog preserves selection on cancellation and restores focus to the invoking control or row.

The framework `Shell` provides a persistent left sidebar at `>=64rem` (mirrored in RTL). Below that, a localized `PanelLeft` icon button in the navbar opens navigation. At `40rem`–`<64rem`, the non-modal sidebar slides in below the navbar and pushes the full-width main content sideways beyond the viewport, without shrinking it. The navbar stays usable to toggle it closed; reduced motion disables the transitions. Below `40rem`, that same navigation element fills the viewport. There is only one navigation tree: native HTML popover buttons handle toggling, Escape and outside dismissal without a Dialog, portal or application event handlers. Native link modifiers/new tabs are preserved; client-side link activation does not automatically dismiss it. CSS viewport queries, backed by four-layer tokens in base, choose all three variants without JavaScript viewport detection. The fullscreen presentation is navigation, not an ARIA modal dialog. No page content is duplicated. The application banner stays on one line with a `3rem` maximum height; the avatar and command-palette tools remain accessible when the title is truncated on narrow screens. Context appears in a fixed bottom status bar with `0.5rem` text, `0.75rem` line height, and `1.25rem` height. Page padding reserves the status bar's space. Geometry and typography use the four-layer `shell-*` token chain, exposed through `--bezny-control-editorial-demo-<header-height|status-height|status-font-size|status-line-height>`. The avatar trigger reuses `IconButton` styling and tooltip behavior without demo-specific button tokens.

The status bar displays context from `useAdminEntityContext`: collection, decoded entity record ID, selected IDs, or unavailable target. Jotai selection is entity-scoped, so article `1` and page `1` cannot be confused. Leaving the collection or switching entities clears selection, including browser history navigation.

Package-owned create/edit screens derive RHF and Bezny fields from entity registration. They register Save/Cancel with `useAdminPageCommands`, binding actual form callbacks. The palette submits through the same RHF handler as the form, with the same validation and focus behavior. No hardcoded form ID or `requestSubmit()` DOM lookup is needed. Commands disappear when their owning screen leaves.

Open **Command palette** with its header button or **Ctrl/Cmd+K** (also toggles it closed). Type to search; **↑/↓** move between commands with wraparound, **Home/End** jump to the first/last, and **Enter** executes the highlighted command without leaving search. **Escape** closes it and restores focus. Parameterized commands focus their RHF field; Back returns to the focused search. Destructive commands still open confirmation after the palette closes. The shortcut does not open another modal over an existing dialog.

`cmdk` owns search ranking, listbox selection, and command keyboard navigation; Bezny's Radix Dialog owns modal focus, dismissal, portals, and naming. Flat compact rows replace the button grid, and the introductory paragraph is removed. The search stays at a fixed viewport-relative position while results change. The list scrolls within `min(50dvh, 20rem)`, with the four-layer `--bezny-control-admin-chrome-palette-list-max-height` → `--bezny-structural-command-list-max-height` → `--bezny-logical-command-list-max-height` → `--bezny-foundation-size-320` chain. Override the structural alias at `:root` or a theme boundary after loading base CSS, or override the admin chrome control alias directly on the command list.

## Presentation and data boundaries

`AdminApplicationProvider` receives customized Layout/Page/PageHeader blocks. A parent `AdminLayout` contains one main landmark and an `Outlet`; entity screens use `AdminPage`. Styles consume demo control aliases backed by existing structural surface tokens and the base stylesheet. OS light/dark theming remains available.

The demo owns only its domain adapter, bounded data, validation/projection callbacks, authentication bindings, translations, and shell branding. CRUD pages, forms, filter/pagination controls, deletion confirmation, routing, registry validation, entity context, selection state, and the command catalog are admin-owned. Repository mutation notifications update the shell's notice state without custom CRUD pages. See [the entity API](../admin/ENTITIES.md) for reusable contracts.

The mock backend is deliberately **in memory and bounded**: three articles and one page are seeded, at most 200 records are retained with bounded field lengths, edits persist across routes, and reload resets everything. Jotai does not hold entire datasets: the admin session owns one active page/detail and an entry/byte/TTL-bounded cache, aborts stale requests, and clears data/timers/subscriptions on unmount. Permanent application disposal clears the mock repository too; Vite HMR unmounts and disposes the old application. Collection controls use shared `ValueFilter`/`ChoiceFilter` chips above the list and one integrated pagination navigation below it (numbered TanStack hyperlinks, Previous/Next icons, summary, and records-per-page selector); the palette offers the same filters, previous/next, arbitrary page navigation, and page-size changes. Page, page size, search, and filters are shareable URL search parameters (`page`, `pageSize`, JSON `filters`), synchronized with Jotai after route guards. Numbered-page links preserve the complete query for copying/new tabs; reload and Back/Forward restore it. Palette and ordinary controls use the same URL updates. Filters/page sizes reset pagination and selection consistently; out-of-range pages use replacement history when clamped. There is no production backend, authentication, permissions service, or unsaved-change blocker. This demo proves shared entity infrastructure; it does not pretend to be a production content system.

For built `dist/` hosting, serve `index.html` for application deep links. No authentication backend is required.

## Languages and localized content

The UI uses i18next/react-i18next with English, Czech, and Arabic resources. The header uses an icon-only Lucide Command button for the palette and a user avatar button with a localized accessible label. Language selection lives inside the avatar dropdown, using Bezny's Radix-backed radio items to indicate the current locale and preserve keyboard navigation/Escape focus return. Account-menu language controls and palette language commands share execution; Arabic switches the application and Radix primitives to RTL. Entity/action labels, filters, pagination, palette prompts, forms, validation, confirmations, and reactive notices are localized. IDs and routes remain stable across locale changes.

Record content is separate from UI resources. The first article has English/Czech/Arabic content; other seed records demonstrate English fallback. The registered content-language field (also exposed in the palette) edits one locale independently of UI language and preserves other locales. Its `deriveValues` callback projects localized title/body values; the package owns the RHF binding and pending/error behavior. New records retain their source language; missing content falls back to English or that source language through i18next. Title/body editing and publication toggling are actual registered form commands. Content resources are ephemeral per-record instances, not a growing global translation registry.

## Source map

- `src/demo-application.tsx`: creates/mounts the shared admin application; no per-entity routes.
- `src/editorial-entities.ts`: typed adapter, column, filter, and form metadata; no custom pages or command catalog.
- `src/editorial-records.ts`: bounded mock backend, typed adapters, DTO validation, and data-source descriptors.
- `src/editorial-content.ts`: localized-content contracts and standard i18next fallback.
- `src/editorial-translations.ts`: UI resource bundles; no record data.
- `@bezny/admin/application`: default CRUD, loading/unavailable pages, field commands, and shared delete confirmation.
- `src/editorial-layout.tsx`: login/workspace presentation, registered navigation, matched context.
- `src/editorial-authentication.tsx`: login screen callbacks to the authentication service.
- `src/editorial-auth-contract.ts`: session/profile DTOs and fixed demo identity.
- `src/editorial-auth-state.ts`: application-scoped user and restoration state.
- `src/editorial-auth-session.ts`: browser-only token/session simulation, persistence, restoration, profile updates, and logout.
- `src/editorial-account-menu.tsx`: mock-authentication/account callback bindings for `AdminAccountMenu`.
- `src/editorial-account-translations.ts`: localized login/account messages.
- `@bezny/admin/header`: shared header, palette, account editor and `AdminLanguageMenuItems`.
- `src/editorial-appearance.scss`, `src/editorial-admin.module.scss`: scoped presentation using internal workspace Sass token accessors.

## Checks

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm exec ultracite check packages/admin packages/demo
```

Admin tests verify arbitrary/renamed entity registrations, generic routing and encoded IDs, route/capability-command parity, permission updates, missing targets, scoped selection, real screen command registration/cleanup, and invalid registrations. Demo tests exercise LCRUD, two independent entities, shared palette/UI actions, forms, history, and modal keyboard/focus behavior. Sass tests verify pure accessors and emitted token references.
