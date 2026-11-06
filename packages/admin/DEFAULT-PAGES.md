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

- **List:** selectable `EntityRowList`, record links and View/Edit/Delete menus, a compact fixed bottom-center `AdminSelectionBar` with a localized selected count, an icon-triggered bulk action menu and clear-selection icon, registered filters, clear filters, registered ordered sorting, pagination/page-size commands, and loading/error/empty states. Selection actions reuse the row/palette catalog; Radix manages menu focus/dismissal, and cancelled confirmation returns focus to the menu trigger. `AdminSelectionBar` is also exported from `@bezny/admin/list` for custom lists. Its `--bezny-control-admin-selection-*` tokens style the bar; override `bottom-offset` on the bar to accommodate a custom fixed footer.
- **Detail:** record title, registered columns or field values, collection navigation, edit and record actions.
- **Create/update:** RHF forms using shared Bezny fields, registered defaults and validation, accessible labels/errors and invalid-field focus, Save/Cancel commands shared with the command palette, submission state, recoverable mutation errors. Save opens the saved record's detail page. Cancel from Update returns to the edited record's detail; Cancel from Create returns to the collection. Both the visible button and palette command discard the draft without submitting.
- **Delete:** record and bulk commands when `adapter.remove` exists, a shared Radix-backed confirmation dialog, cancellation without clearing selection, retryable failures, successful invalidation/refresh and collection navigation.

List pages are available by default; detail pages require `adapter.get`. For list-only resources, omit `get`: stock row titles become plain text, View/Edit commands and detail/update routes are unavailable, and successful creation returns to the collection. No placeholder read is necessary. Use `AdminCollectionAdapter` for explicitly typed list-only adapters; `AdminDataAdapter` retains its required `get` contract for detail-capable consumers. Explicit detail/update screens and an update operation require a detail read. Existing detail-capable registrations are unchanged.

List/detail capabilities are inferred from adapters. Default create/update pages require `form` metadata and the matching adapter operation. Unsupported operations are not advertised. Custom create/update screens still require their adapter operation, but may provide their own forms instead of `form` metadata.

## Backend-provided mutation presentation

An optional pure `isMutationAvailable({ view, record? })` callback controls stock **Create/Edit** commands (including the palette) and direct create/update pages. `view` is `"create"` or `"update"`; update receives the current detached `{ id, label, data }` envelope. Validate opaque `record.data` with your application's projection schema and consume backend-provided capability flags, not client-side role rules. Create has no record and can consume current backend account capabilities. An omitted callback preserves existing supported operations; a provided callback must return exactly `true` to present the mutation. A missing loaded update record never enables Edit.

Denied mutation pages use the existing unavailable presentation instead of exposing editable fields/Save. Loading and read errors retain their normal presentation. Stock Create requires a current nonempty keyed entity scope (including the valid idle create scope); paused/disposed runtimes neither advertise it nor allow its invocation. No detail envelope is required for Create. Retained stock commands recheck the current session snapshot and callback at invocation; the default RHF form rechecks live scope and capabilities after validation, immediately before mutation. Retained field/palette inputs and late derived values cannot edit a denied or abandoned form. Cancel returns Update to the edited record's detail and Create to the collection; late successful mutations do not navigate an abandoned form. Successful Save navigation follows the admitted screen's lifetime through the library's own authoritative refresh, even when loading temporarily unmounts the physical form. Leaving and reopening that screen does not revive an earlier Save.

This callback is **presentation, not authorization**. The backend must authorize every write with current authority. On authentication or authority changes, the host must pause/clear protected runtime state and reactivate authoritative loaders (or explicitly refresh the current record for an in-place policy update). The callback alone is not a subscription or a policy cache; stale hints must not remain the host's authority source. Default update values come from the loaded detail. For domain concurrency checks, update adapters receive optional `AdminMutationRequest.initialRecord`: the opaque detached starting `record.data`, captured once alongside RHF initial values and forwarded by `session.update(key, id, values, initialRecord?)`. Validate it with the application's schema and use its original revision/qualified identity; it is not current authorization. Newer capability hints never replace that origin. No extra hidden/editable revision field, list-derived token or read-on-save is required. Legacy/programmatic calls omitting the fourth argument omit the request property. Create/list/get requests are unchanged. Custom mutation screens/handlers still own their validation/lifecycle guards; direct session methods remain backend adapter operations rather than an authorization API. Custom/deletion actions retain their existing `enabled`/`isAvailable` contracts.

## Collection controls

Refresh/retry is supplied by the connected `AdminHeader`. Default error states also provide an inline retry button, so recovery does not require the header or palette. Both use the same session refresh. Error text is safe localized UI text, not raw transport diagnostics. Default list loading uses entity-row skeletons; detail/form loading uses heading/text/block skeletons. Placeholders are inert and announced once. Include the header in your layout to expose refresh beside the command palette. Custom screens can use `useAdminEntityCommands().refresh` (which can be `null`). See the [minimal application](ENTITIES.md#minimal-entity-application) and [header options](README.md#header-command-palette-and-account-menu).

Registered column values appear beneath each row title in a compact, wrapping definition list with inline label/value pairs, subdued labels, and no browser-default indentation or vertical margins. Empty column registrations do not emit an empty description. Column `render(data, view)` receives `"list"` or `"detail"` (the second parameter is optional for backward compatibility), allowing concise list previews while retaining full detail content. Render shared components such as `Badge` for status values instead of building custom pages.

The default list uses the existing `ValueFilter` search/value chips and `ModeFilter` option chips above the rows. Registered asynchronous references use the base `MultiItemPicker`, including single-reference replacement. Applications do not need their own filter bars or list screens.

A single pagination navigation appears **below** the rows (including empty/loading states): locale-formatted page/total summary, Previous/Next icon buttons, a bounded numbered-page window of TanStack hyperlinks with first/last anchors, and one inline records-per-page selector. There are no page-number/page-size forms. Page, page size, search, filters, and registered sorting live in URL search parameters, synchronized into Jotai by admitted loaders. Copying a numbered-page link preserves the full listing query; Back/Forward and reload restore it. Ordinary controls and parameterized palette inputs navigate through the same validated contract. See [shareable listing URLs](ENTITIES.md#shareable-listing-urls).

`AdminCollectionFilters`, `AdminCollectionSorting`, and `AdminCollectionPagination` are exported from `@bezny/admin/list` for custom list compositions. Their responsive flex layout uses `--bezny-control-admin-collection-*` aliases for structural surface gap, padding, border, text, and typography. Override shared structural aliases on their declaration scope; component control aliases can be overridden on the filters/pagination boundary after loading `@bezny/admin/style.css`.

### Connected remote command search

Pass `searchSources` to `createAdminRuntime` or `createAdminApplication`. The connected palette keeps the registered command catalog and adds grouped remote results; it does not preload records or add a second entity-data owner.

```ts
searchSources: [{
  id: "directory", label: "Directory",
  search: async ({ query, limit, locale, signal }) => {
    const rows = await directory.search({ query, limit, locale, signal });
    return rows.map(row => ({
      id: row.id, label: row.name,
      execute: () => hostRouter.navigate({ to: "/profiles/$id", params: { id: row.id } }),
    }));
  },
}],
```

Requests begin only for nonempty queries after 250 ms debounce. Queries are trimmed and bounded to 200 characters. Sources are bounded to 20, each returning at most 20 unique results; IDs are nonempty strings up to 200 characters and labels up to 1,000. Hosts own transport, authorization, ranking, locale-specific labels and navigation destinations. Server-ranked results are not filtered a second time by client substring matching. An optional result `isAvailable()` rechecks eligibility at selection, without replacing server-side authorization.

Each source has independent loading/empty/error/retry state. New queries, palette closure/editor entry, route changes, locale changes and pause/disposal abort or fence outstanding requests. Results are transient, scoped to the open palette, and never enter the entity cache. Errors use safe localized feedback, not transport exceptions. Explicit `commands` palettes remain host-owned and do not implicitly attach runtime sources. Search types are exported from `@bezny/admin/runtime`.

### Managed non-CRUD actions

An entity action declares exactly one of legacy host-owned `execute(scope)` or framework-owned `operation`. Default screens mount `AdminActionDialog`; custom screens can mount that export from `@bezny/admin/application` once per scope.

```ts
operation: {
  confirm: scope => `Archive ${scope.records.length} documents?`,
  input: { fields: [{ key: "reason", label: "Reason", required: true }] },
  affected: ["documents", "folders"],
  execute: async (scope, values, { signal, locale }) => {
    const result = await archiveDocuments(scope.ids, values.reason, { signal, locale });
    return { failedIds: result.failedIds, message: result.operatorMessage };
  },
}
```

`confirm` and `input` are optional: immediate actions execute without an added confirmation. `destructive` controls appearance, not policy. Input supports registered scalar/custom fields, conditional disabling, defaults, resolver and mapped field errors; record projection and derived-record editing are not action input contracts. Hosts own validation, endpoint mapping, permission checks, idempotency and localized, operator-safe result messages (maximum 4,000 characters). Return `{}` for silent success; results are not cached as entity data.

Targets are captured, then current route/record/selection/availability is checked again before execution. Pending invocations share a session lock per entity/action. Successful operations invalidate only `affected` entities (default: current entity) and refresh an affected active resource. `failedIds` must be a unique subset of the captured targets; partial results retain feedback and retry only that subset. Throwing retains inputs for retry and uses the safe generic/mapped error contract. Hosts must report partial completion rather than throwing after known successes.

Closing or leaving the dialog aborts its signal and fences late UI results; pausing/disposal aborts session operations and clears requests. Cancellation cannot undo a server-side operation that already committed. Specialized screens can call `session.execute(entity, operationId, callback, affected?, signal?)` directly for the same abort/deduplication/invalidation lifecycle, with their own feedback presentation.

### Typed scalar and paired range filters

Use `type: "number"` with `min`, `max`, `step`, or `type: "date"` with ISO `minDate`/`maxDate`. The default collection and palette share an RHF editor using Base number/calendar fields; Apply commits, Cancel/Escape discards. Empty values clear the filter. Values remain strings in the native nested `filters` URL and adapter query. Optional `maxLength` is bounded to 1–200 characters.

A lower-bound filter can name its upper bound with `before: "until"` (both must have the same number/date type). Reversed ranges are rejected by commands. Incoming URLs drop invalid scalar values and both ends of reversed ranges before loading. Clear an endpoint before moving a range entirely beyond its previous bounds. Invalid registrations fail early; typed scalar filters cannot also be choices, references or multiple selections. Existing choice-based date presets need no special type. No currency, timezone or backend parsing policy is inferred.

```ts
filters: [
  { key: "from", label: "From", type: "date", before: "until" },
  { key: "until", label: "Until", type: "date" },
  { key: "weight", label: "Minimum weight", type: "number", min: 0, step: 0.5 },
];
```

### Registered ordered sorting

Register `sorting` on an entity to expose an ordered editor in the default collection and the connected palette:

```ts
sorting: {
  fields: [
    { key: "title", label: "Title" },
    { key: "publishedAt", label: "Publication date" },
  ],
  default: [{ key: "publishedAt", direction: "desc" }],
};
```

Both entrypoints use the same RHF draft and validated command. Add/remove fields, choose ascending/descending directions, move priority up/down, clear sorting, or restore registered defaults. Apply commits the draft; Cancel/Escape leaves the query unchanged. Field `labelKey` is optional and uses ordinary i18next translation keys. English, Czech, and Arabic controls use `beznyAdmin.sorting`.

Adapters receive `query.sort` as an ordered array of `{ key, direction: "asc" | "desc" }`. Keys are opaque; adapters translate them into their backend's supported ordering contract. The framework does not sort records client-side. `AdminSortField`, `AdminSortRule`, and `AdminSortingDefinition` are exported from `@bezny/admin/adapters`. The optional query property leaves entities without a sorting registration unchanged.

The native URL `sort` value is a JSON array handled by the router. An absent value uses registered defaults; `[]` explicitly chooses no sorting, even when defaults exist. Invalid URL rules fall back to defaults; invalid commands are rejected. Default-equivalent rules omit `sort` from the URL. Up to 50 unique registered fields/rules are supported, with nonempty keys of at most 200 UTF-16 code units and nonempty labels of at most 1,000. Unknown/duplicate keys or directions other than `asc`/`desc` are invalid. Defaults are validated at registration.

Sort changes reset page/selection while retaining filters and page size. Paging, filtering, locale changes, refresh and mutation invalidation retain the current sorting. Copied URLs, reload and Back/Forward restore the same adapter query. Ordered rules participate in cache/request identity and stale-command fencing; no separate list owner is needed. Custom lists can compose `AdminCollectionSorting` or consume `useAdminListControls().sortCommand` from `@bezny/admin/list`.

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

Field keys are unique flat names, not dotted RHF paths. Supported types are `text` (default), `textarea`, `number`, `checkbox`, `select`, `email`, `url`, `password` and `date`. Fields accept labels/`labelKey`, help, required state, `minLength`/`maxLength`, numeric bounds and `step` (positive number or `"any"`), `autoComplete`, calendar `minDate`/`maxDate` ISO dates and choice options. Email/URL/date/number fields validate through RHF; application-specific schemes or business restrictions remain host policy. Select options must have unique non-empty values; the default form owns its empty placeholder.

For flat records, editable values are read from matching record properties. Missing values fall back to `form.defaultValues` (a value object or callback evaluated when opening the form), then `false` for checkboxes or an empty string otherwise. Only registered fields enter the form. Numeric fields submit numbers when non-empty; optional empty numeric values remain empty strings for `parseValues` to interpret.

For nested or domain-specific payloads, supply `form.readValues(data: unknown)` to validate/project the adapter payload into flat scalar form values. `parseValues` validates/transforms submitted form values into typed mutation values; it remains the domain validation boundary. Adapter failures or parser failures preserve the form and show an error.

Optional `columns: [{ key, label, labelKey?, render(data: unknown) }]` provide list metadata and detail values. These callbacks should validate payloads with the application's domain schema. Without columns, the detail page uses the registered form fields. The row title always comes from `reference(record).label`.

Each registered field also produces a palette command: text/number/choice inputs edit its value and checkbox commands toggle it. Password, sensitive, date and custom-component commands focus the actual form field instead of creating a second editor. Password fields are automatically sensitive; other fields can set `sensitive: true`. Sensitive fields never project values from loaded records or appear in automatic detail output/palette input values. Hosts must not return secrets in adapter records, columns or labels: the session is not a secret store. Explicit form defaults remain application-owned.

`form.resolver` accepts a standard `Resolver<AdminFormValues>` from RHF, so any compatible schema library (or a plain callback) can provide cross-field validation, field errors/focus and transformed values without a framework schema dependency. When present, the resolver owns validation, as in ordinary RHF; include all desired constraints in it. `parseValues` remains the mutation boundary. Optional `form.errors(error)` maps parser/backend errors to `{ [registeredFieldKey]: message }`; unknown keys are ignored, drafts remain mounted and the first mapped field receives focus. Unmapped errors and mapper failures use safe generic feedback.

`field.disabled` accepts a boolean or `({ values, record }) => boolean`. Disabled fields have no palette value commands; retained commands recheck this condition. This is presentation, not backend authorization. `field.component` accepts a React component with `AdminFieldComponentProps`: `field`, `disabled` and optional `onValueChange`. Bind `field.key` with the existing RHF FormProvider using a Base field or `useController`; forward name/ref/value/change/blur and accessible feedback. Call `onValueChange` after edits when implementing dependent values. Do not create another form owner. The component must honor `disabled`; its palette command focuses its registered ref. This seam supports reference pickers and other scalar-backed controls without requiring a replacement screen. Nested rich-editor data remains a custom-screen concern. The same RHF values, validation, and refs are used by both presentations. Select option `labelKey` values are translated just like field labels.

For dependent fields, register `field.deriveValues(values, record)` to return a partial value object, synchronously or asynchronously. For example, changing a content-locale field can load/project the matching title and body. Both ordinary controls and palette edits use this callback. Pending derivation disables form submission; failed derivation shows a recoverable error. Results only update registered fields that have not been changed since the request began, and stale source-field values are ignored.

## Overrides and shared behavior

Use `screens: { list?, detail?, create?, update? }` to replace individual pages. `AdminDefaultListPage`, `AdminDefaultDetailPage`, `AdminDefaultFormPage`, `AdminDefaultLoadingPage`, and `AdminDefaultUnavailablePage` are also exported from `@bezny/admin/application` for custom compositions inside the active entity route.

The built-in router displays `AdminDefaultLoadingPage` while an initial/navigation loader is pending. For host-owned file routes, use it as the route's `pendingComponent` (or provide a custom pending page); the host owns pending timing. In-place refresh loading states are handled by the default list itself; URL-driven query changes also participate in the router's loader/pending timing.

Custom entity actions remain available in the default pages and palette. Register a record action with ID `delete` or a selection action with ID `delete-selected` to replace that default deletion command, including its permission/confirmation behavior. This avoids duplicate actions and preserves existing application-owned deletion workflows. Custom destructive actions must request their own confirmation.

Default UI strings use the `beznyAdmin.defaults` translation keys with English, Czech, and Arabic defaults. Application translations are not overwritten. Field/column `labelKey` values use ordinary i18next keys, including namespace-qualified keys.

All mutations go through the existing bounded data session; the pages do not create another data store or command catalog. Backend authorization is mandatory even when a command is absent or disabled.
