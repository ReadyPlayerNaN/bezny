# Registered application capability batch

Status: implemented and locally validated as one capability batch. Publication remains paused.

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

## Implementation and verification record

Source checkpoint: `1ec244d` on `feat/admin-framework-capabilities`, based on `4c59c31`. Functional slices are `30eb5f5` (list-only), `9748852` (resource states), `e20f2d8` (forms), `928120d` (typed filters), `3e00049` (managed actions), and `ab2a520` (remote search). Integration fixes are in `3834df3`; native journeys are in `1ec244d`. Public configuration and lifecycle contracts are documented in [Default pages](../packages/admin/DEFAULT-PAGES.md).

The implementing agent ran these gates successfully from the worktree:

- `pnpm check`, `pnpm build`, `pnpm typecheck`.
- `pnpm test --concurrency=1`: Base 311 unit tests plus 58 composed/token tests; Admin 376 tests plus its build-smoke checks; Demo 83 tests in each configuration. The final invocation freshly executed Admin and Demo tests; Base tests and three prerequisite builds were cache hits (four of six tasks). Final build/typecheck invocations reused three/five successful tasks from the preceding slice gates. Native browser and packaging invocations executed freshly, without Turbo caching.
- Serialized native browser suite: **92 passed, zero failed** across Base, Admin and Demo. The four new journeys exercise light/dark × LTR/RTL at 390 px, list-only titles, numeric filter application/focus restoration, calendar dismissal/focus, managed action failure/retry, remote keyboard selection, visible inline resource retry, resolver errors/focus and password semantics.
- Packaging scripts: **17 passed, zero failed**, including staged publish dry runs.
- `git diff --check`; generated declarations expose the new public types and action dialog through existing supported package entry points.
- Visual inspection of all 12 new form/action/search screenshots, assembled as three four-configuration contact sheets: no clipping, overlapping controls or missing focus indication observed. Domain labels in the fixture remain English; framework feedback/buttons follow the selected locale and direction.

Evidence is retained under `.tmp/framework/final/` (check/build/types/unit/browser/ packaging logs and visual-review sheets), with native captures in `.tmp/capabilities-browser/`. Earlier slice and failed-attempt logs remain under `.tmp/framework/`. Integration inspection identified a filter-trigger remount/focus risk; keeping trigger identity stable and resetting only its draft fixed it, and native acceptance verifies focus restoration. The final forms use existing control-token spacing rather than browser-default fieldset borders. A submission experiment that disabled RHF registration during validation omitted values; the failing tests were preserved and that change was reverted in favor of the existing native fieldset submission guard. Browser harness corrections wait on actual command completion and explicitly target the inline retry control rather than the separate header retry.

This is local implementation/verification evidence, not independent review, consumer-integration acceptance, registry verification or release approval. No package publication, dependency adoption, CI jobs, new dependencies, tag changes or application-specific transport/policy code are included. Independent review and a release/tag decision remain outstanding before publication.

## Non-goals

No application migration, backend or permission changes, transport implementation, new schema dependency, legacy URL mapping, generic CMS/tree/analytics engine, per-feature package publication, or alteration of existing pushed tags. Rich editors, cursor feeds, upload/sanitization policy and domain schemas remain host-owned.
