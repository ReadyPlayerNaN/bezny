# Registration-driven CRUD pages

Register an adapter and field metadata, not a set of screen components. `@bezny/admin` provides list, detail, create, update, loading, and unavailable pages. The application/runtime `NotFound` component is also an optional override. `screens` is an optional **per-view override**; overriding the list does not replace the default forms.

```tsx
import { defineAdminEntity } from "@bezny/admin/adapters";

const articles = defineAdminEntity({
  key: "articles",
  label: "Articles",
  singularLabel: "Article",
  adapter: articleAdapter,
  reference: (article) => ({ id: article.id, label: article.title }),
  parseValues: parseArticleValues,
  pageSize: 25,
  filters: [
    { key: "search", label: "Search" },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
    },
  ],
  form: {
    defaultValues: { status: "draft", published: false },
    fields: [
      { key: "title", label: "Title", required: true, maxLength: 160 },
      { key: "body", label: "Body", type: "textarea" },
      { key: "published", label: "Published", type: "checkbox" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
        ],
      },
    ],
  },
  // Optional: replace only the detail page.
  // screens: { detail: ArticlePreview },
});
```

Pass the definition to `createAdminApplication({ entities: [articles], Root, NotFound })`, or to `createAdminRuntime` when the host owns file routes. See [entity applications](ENTITIES.md) for adapters, routing, lifecycle, and authorization.

## What the registration generates

- **List:** selectable `EntityRowList`, record links and View/Edit/Delete menus, a compact fixed bottom-center `AdminSelectionBar` with a localized selected count, an icon-triggered bulk action menu and clear-selection icon, registered filters, clear filters, pagination/page-size commands, and loading/error/empty states. Selection actions reuse the row/palette catalog; Radix manages menu focus/dismissal, and cancelled confirmation returns focus to the menu trigger. `AdminSelectionBar` is also exported from `@bezny/admin/list` for custom lists. Its `--bezny-control-admin-selection-*` tokens style the bar; override `bottom-offset` on the bar to accommodate a custom fixed footer.
- **Detail:** record title, registered columns or field values, collection navigation, edit and record actions.
- **Create/update:** RHF forms using shared Bezny fields, registered defaults and validation, accessible labels/errors and invalid-field focus, Save/Cancel commands shared with the command palette, submission state, recoverable mutation errors. Save opens the saved record's detail page.
- **Delete:** record and bulk commands when `adapter.remove` exists, a shared Radix-backed confirmation dialog, cancellation without clearing selection, retryable failures, successful invalidation/refresh and collection navigation.

List/detail pages are available by default. Default create/update pages require `form` metadata and the matching adapter operation. Unsupported operations are not advertised. Custom create/update screens still require their adapter operation, but may provide their own forms instead of `form` metadata.

## Backend-provided mutation presentation

An optional pure `isMutationAvailable({ view, record? })` callback controls stock **Create/Edit** commands (including the palette) and direct create/update pages. `view` is `"create"` or `"update"`; update receives the current detached `{ id, label, data }` envelope. Validate opaque `record.data` with your application's projection schema and consume backend-provided capability flags, not client-side role rules. Create has no record and can consume current backend account capabilities. An omitted callback preserves existing supported operations; a provided callback must return exactly `true` to present the mutation. A missing loaded update record never enables Edit.

Denied mutation pages use the existing unavailable presentation instead of exposing editable fields/Save. Loading and read errors retain their normal presentation. Stock Create requires a current nonempty keyed entity scope (including the valid idle create scope); paused/disposed runtimes neither advertise it nor allow its invocation. No detail envelope is required for Create. Retained stock commands recheck the current session snapshot and callback at invocation; the default RHF form rechecks live scope and capabilities after validation, immediately before mutation. Retained field/palette inputs and late derived values cannot edit a denied or abandoned form. Cancel keeps its ordinary collection navigation; late successful mutations do not navigate an abandoned form. Successful Save navigation follows the admitted screen's lifetime through the library's own authoritative refresh, even when loading temporarily unmounts the physical form. Leaving and reopening that screen does not revive an earlier Save.

This callback is **presentation, not authorization**. The backend must authorize every write with current authority. On authentication or authority changes, the host must pause/clear protected runtime state and reactivate authoritative loaders (or explicitly refresh the current record for an in-place policy update). The callback alone is not a subscription or a policy cache; stale hints must not remain the host's authority source. Default update values come from the loaded detail. For domain concurrency checks, update adapters receive optional `AdminMutationRequest.initialRecord`: the opaque detached starting `record.data`, captured once alongside RHF initial values and forwarded by `session.update(key, id, values, initialRecord?)`. Validate it with the application's schema and use its original revision/qualified identity; it is not current authorization. Newer capability hints never replace that origin. No extra hidden/editable revision field, list-derived token or read-on-save is required. Legacy/programmatic calls omitting the fourth argument omit the request property. Create/list/get requests are unchanged. Custom mutation screens/handlers still own their validation/lifecycle guards; direct session methods remain backend adapter operations rather than an authorization API. Custom/deletion actions retain their existing `enabled`/`isAvailable` contracts.

## Collection controls

Refresh/retry is supplied by the connected `AdminHeader`, not by the generated pages. Include it in your layout's `header` slot to expose the shared refresh command beside the command palette. Custom layouts that omit the header must provide their own refresh/retry entrypoint using `useAdminEntityCommands().refresh` (which can be `null`). See the [minimal application](ENTITIES.md#minimal-entity-application) and [header options](README.md#header-command-palette-and-account-menu).

Registered column values appear beneath each row title in a compact, wrapping definition list with inline label/value pairs, subdued labels, and no browser-default indentation or vertical margins. Empty column registrations do not emit an empty description. Column `render(data, view)` receives `"list"` or `"detail"` (the second parameter is optional for backward compatibility), allowing concise list previews while retaining full detail content. Render shared components such as `Badge` for status values instead of building custom pages.

The default list uses the existing `ValueFilter` search/value chips and `ModeFilter` option chips above the rows. Registered asynchronous references use the base `MultiItemPicker`, including single-reference replacement. Applications do not need their own filter bars or list screens.

A single pagination navigation appears **below** the rows (including empty/loading states): locale-formatted page/total summary, Previous/Next icon buttons, a bounded numbered-page window of TanStack hyperlinks with first/last anchors, and one inline records-per-page selector. There are no page-number/page-size forms. Page, page size, search, and filters live in URL search parameters, synchronized into Jotai by admitted loaders. Copying a numbered-page link preserves the full listing query; Back/Forward and reload restore it. Ordinary controls and parameterized palette inputs navigate through the same validated contract. See [shareable listing URLs](ENTITIES.md#shareable-listing-urls).

`AdminCollectionFilters` and `AdminCollectionPagination` are exported from `@bezny/admin/list` for custom list compositions. Their responsive flex layout uses `--bezny-control-admin-collection-*` aliases for structural surface gap, padding, border, text, and typography. Override shared structural aliases on their declaration scope; component control aliases can be overridden on the filters/pagination boundary after loading `@bezny/admin/style.css`.

### Registered multiple-choice filters

Set `multiple: true` on a filter with static `options` to generate a Bezny `ModeFilter` with checkbox choices. The palette exposes the same choices through an RHF editor; Apply executes the same validated command as the ordinary filter. Clearing, page/selection reset and browser history use the existing collection lifecycle, without a custom list screen.

```ts
filters: [
  {
    key: "category",
    label: "Category",
    multiple: true,
    options: [
      { value: "news", label: "News" },
      { value: "guides", label: "Guides" },
    ],
  },
];
```

Adapter filter values remain strings for compatibility. Use `decodeAdminFilterSelection(query.filters.category ?? "")` from `@bezny/admin/adapters` to obtain selected IDs and `encodeAdminFilterSelection(ids)` to construct a deep-link value. Nonempty selections are JSON arrays encoded within that string; empty selections use `""` and are omitted from the URL. Do not split IDs on commas. Selection order is preserved. At most 50 distinct nonempty IDs of up to 200 UTF-16 code units are accepted. Malformed, duplicate, oversized or unregistered choices are ignored in incoming URLs and rejected by commands; decode/encode helpers throw on malformed selections. Only multiple-choice registrations use this encoding; existing text and single-choice filters are unchanged.

### Registered asynchronous reference filters

Provide `reference.search` and `reference.resolve` instead of static `options`. Both callbacks return `{ value: string, label: string }[]` and receive `{ signal, locale, limit }`. Backend transport, authorization and localization remain host-owned; the framework owns the bounded lookup lifetime and presentation.

```ts
filters: [
  {
    key: "category",
    label: "Category",
    multiple: true,
    reference: {
      search: (query, request) => categoryApi.search(query, request),
      resolve: (ids, request) => categoryApi.resolve(ids, request),
    },
  },
];
```

The standard list applies selections immediately through the existing collection command. The palette keeps its draft in RHF until Apply. Single-reference filters (omit `multiple`) preserve one opaque ID as a string; choosing another suggestion replaces it. Multiple references use the same public JSON selection codec as static multi-choice filters. Labels never replace IDs in adapter or URL values. Missing references may be omitted from resolution results: their original IDs remain visible and removable, rather than silently dropping active filters. A failed resolution retains IDs and offers retry.

Search starts after 250 ms of inactivity for a nonempty trimmed query, pauses during IME composition, and requests at most 20 options. Input is bounded to 200 UTF-16 code units. Selections contain at most 50 distinct nonempty IDs, each at most 200 code units. Resolution requests are bounded to the selected IDs; returned IDs must be requested, unique and within that bound. Labels must be nonempty strings of at most 1,000 code units. Invalid callback results produce a recoverable error, not partially accepted options. Search and selected-label errors have separate retry controls; search retry remains keyboard-accessible after popup dismissal.

Query changes, popup dismissal, locale/entity/list-query changes, pause/disposal and unmount abort obsolete requests. Results from transports that ignore cancellation are fenced before presentation. Selected-label resolution remains active while its owner is mounted even when suggestions are closed. No unbounded reference cache or parallel list session is introduced. Host callbacks should honor `signal`, but remain responsible for backend access checks. The `beznyAdmin.referenceFilter` namespace supplies English, Czech and Arabic status/action text.

## Fields and display

Field keys are unique flat names, not dotted RHF paths. Supported types are `text` (default), `textarea`, `number`, `checkbox`, and `select`. Fields accept labels/`labelKey`, help text, required state, maximum text length, numeric bounds, and choice options. Select options must have unique non-empty values; the default form owns its empty placeholder.

For flat records, editable values are read from matching record properties. Missing values fall back to `form.defaultValues` (a value object or callback evaluated when opening the form), then `false` for checkboxes or an empty string otherwise. Only registered fields enter the form. Numeric fields submit numbers when non-empty; optional empty numeric values remain empty strings for `parseValues` to interpret.

For nested or domain-specific payloads, supply `form.readValues(data: unknown)` to validate/project the adapter payload into flat scalar form values. `parseValues` validates/transforms submitted form values into typed mutation values; it remains the domain validation boundary. Adapter failures or parser failures preserve the form and show an error.

Optional `columns: [{ key, label, labelKey?, render(data: unknown) }]` provide list metadata and detail values. These callbacks should validate payloads with the application's domain schema. Without columns, the detail page uses the registered form fields. The row title always comes from `reference(record).label`.

Each registered field also produces a palette command: text/number/choice inputs edit its value and checkbox commands toggle it. The same RHF values, validation, and refs are used by both presentations. Select option `labelKey` values are translated just like field labels.

For dependent fields, register `field.deriveValues(values, record)` to return a partial value object, synchronously or asynchronously. For example, changing a content-locale field can load/project the matching title and body. Both ordinary controls and palette edits use this callback. Pending derivation disables form submission; failed derivation shows a recoverable error. Results only update registered fields that have not been changed since the request began, and stale source-field values are ignored.

## Overrides and shared behavior

Use `screens: { list?, detail?, create?, update? }` to replace individual pages. `AdminDefaultListPage`, `AdminDefaultDetailPage`, `AdminDefaultFormPage`, `AdminDefaultLoadingPage`, and `AdminDefaultUnavailablePage` are also exported from `@bezny/admin/application` for custom compositions inside the active entity route.

The built-in router displays `AdminDefaultLoadingPage` while an initial/navigation loader is pending. For host-owned file routes, use it as the route's `pendingComponent` (or provide a custom pending page); the host owns pending timing. In-place refresh loading states are handled by the default list itself; URL-driven query changes also participate in the router's loader/pending timing.

Custom entity actions remain available in the default pages and palette. Register a record action with ID `delete` or a selection action with ID `delete-selected` to replace that default deletion command, including its permission/confirmation behavior. This avoids duplicate actions and preserves existing application-owned deletion workflows. Custom destructive actions must request their own confirmation.

Default UI strings use the `beznyAdmin.defaults` translation keys with English, Czech, and Arabic defaults. Application translations are not overwritten. Field/column `labelKey` values use ordinary i18next keys, including namespace-qualified keys.

All mutations go through the existing bounded data session; the pages do not create another data store or command catalog. Backend authorization is mandatory even when a command is absent or disabled.
