# Registered application capability batch

Status: accepted for implementation by the operator before code changes.

## Purpose and boundaries

Extend the reusable entity framework without coupling it to any consuming project, backend SDK, permission model, schema library or resource vocabulary. This batch is validated as a whole before publication; functional slices are committed separately. Publication is paused. Existing registrations must remain compatible.

## Accepted functional slices

1. **List-only resources:** optional detail reads, explicit capabilities inferred from adapters, default non-link titles when detail is unsupported, no fabricated read operations, safe direct-route handling and correct post-create navigation.
2. **Default resource states:** reuse Base skeletons and provide visible accessible retry for default list/detail/form failures through the existing session.
3. **Extensible default forms:** configurable RHF validation, scalar field semantics (including secure password fields, date/email/URL and numeric steps), conditional field availability and a typed custom-field composition seam. Preserve one RHF owner, form drafts, errors/focus, commands, mutation guards and schema neutrality.
4. **Typed collection filters:** number/date registration, bounds and paired-range constraints, shared validated collection/palette inputs and native URL semantics. Keep existing scalar/choice/reference filters compatible; no backend codecs.
5. **Managed custom actions:** shared pending/error/confirmation/input/result flow, abortable session execution, captured/revalidated targets, duplicate suppression, affected-resource invalidation, retry and late-result fencing. Immediate actions stay immediate unless confirmation is configured. Backend policy remains external.
6. **Remote palette search:** bounded async provider registration integrated with the connected catalog, query debounce, cancellation, locale/lifetime fencing, errors/retry and safe result navigation. No permanent entity collection cache.

## Validation and delivery

Each slice includes public API documentation and behavioral tests through actual router/store/default-screen/control seams. Use neutral document/catalog examples. Final validation includes check/build/typecheck/unit/build-smoke tests, serialized native browsers for keyboard/focus, light/dark and RTL, and packaging checks. Review compatibility, lifecycle cleanup, sensitive-value handling and package exports before release. Preserve failure evidence; do not raise timeouts or add CI jobs.

## Non-goals

No application migration, backend or permission changes, transport implementation, new schema dependency, legacy URL mapping, generic CMS/tree/analytics engine, per-feature package publication, or alteration of existing pushed tags. Rich editors, cursor feeds, upload/sanitization policy and domain schemas remain host-owned.
