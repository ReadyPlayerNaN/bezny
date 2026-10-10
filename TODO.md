# TODO

> Every implemented feature must also be implemented and demonstrated in `@bezny/demo` as part of the same functional slice.

- [x] Resolve memory leaks and unbounded data retention while keeping Jotai.
  - Implemented: application-owned Jotai snapshots, paginated adapters, bounded entry/byte/TTL cache, immutable detached JSON payloads, cancellation/late-response guards, subscription cleanup, and idempotent disposal. Demo uses a capped adapter-backed repository and HMR disposal; field lengths are bounded independently of frontend validation.
  - Separate long-lived entity definitions from record-data lifetimes.
  - Define loading, pagination, bounded caching, eviction, and application-disposal behavior.
  - Clean up subscriptions and stale references; test repeated navigation and application mount/disposal.
- [x] Define and implement an abstract API for configuring `@bezny/admin` application entities, their data adapters, and their actions.
  - Implemented: typed `defineAdminEntity` and LCRUD adapters, separated data-session/query/serialization modules, session-aware action scopes, capability/reference validation, shared routing/context/catalog, and public API documentation. Demo registers both resources exclusively through these abstractions.
  - Keep routing, entity context, ordinary UI actions, and command-palette actions driven by the same configuration.
  - Separate entity definitions, adapter/data lifecycle, action execution, and presentation responsibilities; split modules or packages further where needed.
  - Migrate the demo to demonstrate the public abstractions rather than entity-specific infrastructure.
  - Verified: 43 admin tests and 23 demo tests, workspace build/typecheck/tests, Ultracite, and production Chromium LCRUD/palette smoke; tests cover repeated navigation/mount-disposal, LRU/TTL/byte bounds, non-JSON rejection, mutation invalidation, permissions, callback ownership, and disposal failures.
- [x] Make the admin UI multilingual using an established i18n library—not a custom translation mechanism.
  - Implemented: app-scoped i18next/react-i18next instances, namespace-backed entity/action/catalog/filter/form/validation/confirmation/notice translations, shared locale commands, locale-keyed adapter requests/cache, Radix direction provider, and English/Czech/Arabic demo UI. Localized record content uses separate bounded per-record resources and an independent RHF content-language selector; saving preserves other locales.
  - Integrate localization into entity labels, action labels, command-palette content, forms, validation feedback, and other entity UI.
  - Distinguish UI translations from multilingual entity content and define adapter/form support for localized content.
  - Support locale switching, fallback behavior, locale-aware formatting, and text direction; test multiple locales.
  - Verified: 46 admin tests, 36 demo tests, 99 base tests, workspace build/typecheck/tests, Ultracite, public-export smoke, and production Chromium. Locale tests cover UI/content fallback, literal content interpolation, resource isolation, independent content updates, localized RHF errors/focus, reactive notices, numeric formatting, palette/native locale switching, RTL menu direction, arrow navigation, and Escape/focus restoration.
- [x] Use `EntityRow` with context menus for entity list rows instead of custom row implementations.
  - Reuse the shared entity action catalog for row context menus, detail actions, and the command palette.
  - Preserve row-target versus selection-target semantics and destructive-action confirmation.
  - Use Radix for context-menu interaction and verify keyboard access, focus behavior, and accessible semantics.
  - Implemented: demo lists use `EntityRowList` (the shared row implementation), controlled Jotai selection, row-scoped context menus, and the same commands as detail pages and the palette. Verified with 8 base row tests and 19 demo tests, including Shift+F10, Escape/focus restoration, and confirmation targeting despite another selected row.
- [x] Implement entity-list filters, integrated with entity configuration, data adapters, and the command palette.
  - Implemented: validated entity filter definitions, shared text/choice filter commands and parameterized palette inputs, bounded drafts, clearing, filtered adapter totals, and stale-query guards. Demo renders base filters and the same palette callbacks.
- [x] Implement entity-list pagination, integrated with data adapters and the command palette, with consistent behavior when filters change.
  - Implemented: one-based adapter paging, previous/next, arbitrary page and page-size palette inputs, filter/page-size selection resets, empty-page handling, and last-page clamping after deletion. Demo demonstrates both ordinary paging and palette/query workflows.
  - Verified: 44 admin tests, 27 demo tests, 98 base tests, workspace build/typecheck/tests, Ultracite, and production Chromium filters/paging/palette smoke. Query tests cover ordinary/palette parity, text/choice filters, page-size changes, selection clearing, stale callbacks, and deletion at page boundaries.
