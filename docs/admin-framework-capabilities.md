# Registered application capability batch

Status: independently approved, published and registry-verified as patch release `0.3.3`.

## Purpose and boundaries

Extend the reusable entity framework without coupling it to any consuming project, backend SDK, permission model, schema library or resource vocabulary. This batch is validated as a whole before publication; functional slices are committed separately. Publication was paused until independent approval. Existing registrations must remain compatible.

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

The initial evidence above covered local implementation, not independent review or publication. No dependency adoption, CI jobs, new dependencies or application-specific transport/policy code are included.

## Independent review and patch approval

The independent reviewer inspected the complete batch at `76dba10` and reported two findings: a disabled select was not disabled in its RHF Controller, and managed-action input field keys were not validated at registration. Both were accepted and fixed:

- `8325c96`: disabled selects now omit values on submit and preserve selection when re-enabled. A real-route regression test failed before the fix and passed afterward.
- `e10a8ad`: entity and action forms share field registration validation, including duplicate/reserved/nested keys and select choices. Registration regression tests failed before the fix and passed afterward.
- `788ec5c`: additional tests cover closing/reopening while transport ignores abort and duplicate submissions waiting on an asynchronous resolver.

The same reviewer rechecked the focused fixes at `788ec5cb216511b55f7ae82e13f7dbc2776f6585`, found no remaining issues, and explicitly approved a patch release with notes (review runs `dfeb7162-b781-446d-8b4e-09a4a37d5dfb` and `2bf818fa-8417-45c8-9812-1f7d3a0b225e`). This was independent source/test/log inspection, not independent command reruns.

Post-fix gates passed: check/build/types, **382 Admin tests**, Base 311+58, Demo 83 per configuration, **92 native browsers**, and **17 packaging checks**. Build/typecheck logs include cache hits. Evidence and red/green logs are under `.tmp/framework/reviewer-fixes/`. The first browser run failed only in unchanged Demo Chromium-profile cleanup (`ENOTEMPTY`); the focused retry and full suite rerun passed. `git diff 76dba10..788ec5c -- packages/demo/test/editorial-backend.browser.mjs` is empty; no cleanup, timeout or CI changes were made.

The operator authorized a patch release after reviewer approval. `v0.3.3` is the next unused patch tag; the existing `v0.3.2` tag remains unchanged. Registry publication/integrity verification is a separate delivery gate, and consumer integration remains outside this batch.

## Release delivery

Annotated tag `v0.3.3` points to `db97f0dac6e3af1348cc75a84db9522194aebc22`; the existing `v0.3.2` tag was not changed. The reviewed branch was fast-forwarded to `master` and pushed before publication.

[Release workflow](https://github.com/ReadyPlayerNaN/bezny/actions/runs/42236626767) verified and packed successfully, but its npm publication job failed. Workflow log download returned HTTP 403, so the publication failure's underlying cause was not established. The same locally verified tagged-source tarballs were subsequently published interactively, Base first and Admin second, with operator npm authorization. No CI configuration was changed.

Registry checks completed on 2026-11-06 at 15:04 UTC:

| Package | Version / latest | Tarball bytes | SHA-512 integrity |
| --- | --- | --- | --- |
| `@bezny/base` | `0.3.3` | 291678 | `sha512-9y1aumxhs+XZB183XRkWkdCGUIzqkXbJGXQ+QzsS09pWdA78YzsLorWH+GB+nPRXJjuKM9I9zGFS84rp4aHROg==` |
| `@bezny/admin` | `0.3.3` | 1278895 | `sha512-xZ6pogijsoNg2gJqQPuwWxR3f2Z5wlVJC8zhsTIcEG9BOpMb1WqSYhY+4mr6+LSRMuPaDGe3eXgJbCsjqKVh4A==` |

For both packages, registry `gitHead` matches the tag, repository metadata is correct, SHA-1/SHA-512 match downloaded tarballs, and registry bytes equal the local tagged-source tarballs exactly. Admin's dependency on `@bezny/base` is exactly `0.3.3`. Frozen installation and build succeeded before staging. Evidence is retained in `.tmp/framework/release-0.3.3/`, including CI results, package manifests, pack output, registry metadata, downloaded tarballs and `verified-{base,admin}.json`. An initial Admin metadata lookup returned 404 during publication propagation; the subsequent verification passed. Consumer adoption is not part of this release.

## Non-goals

No application migration, backend or permission changes, transport implementation, new schema dependency, legacy URL mapping, generic CMS/tree/analytics engine, per-feature package publication, or alteration of existing pushed tags. Rich editors, cursor feeds, upload/sanitization policy and domain schemas remain host-owned.
