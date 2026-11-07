# View-specific registered forms

## Authorized scope

Add consumer-neutral create/update form configuration to registered entities while retaining the default screens, one React Hook Form owner and existing data session. This source-only increment is intended for a later batch. No publication, tag, dependency/version change, backend change or replacement form is included.

Acceptance:

- Optional `forms.create` and `forms.update` each provide a complete `AdminEntityForm`. The selected override replaces, rather than merges with, the shared `form`. An omitted override falls back to `form`; existing registrations are unchanged.
- Default-screen availability follows the effective form and existing adapter capabilities. A form never grants an operation absent from the adapter.
- Fields, defaults/projection, resolver/transformation, server-error mapping, numeric coercion and palette commands all use the same effective form.
- Route/view/record transitions discard the previous form's draft and commands; abandoned async derivations/submissions cannot affect the new owner.
- Detail columns remain authoritative. Without columns, use the shared form when supplied, otherwise the update form. A create-only form is not a detail schema. Sensitive fields remain excluded from detail fallback and palette value editors.
- Validate every configured form independently. Keys may repeat across views but invalid/duplicate keys within any single form are rejected at registration.
- Execute real default-page/router/store/RHF tests and built-public-entrypoint Chromium checks covering distinct create/update validation, sensitive inputs, visible/palette submission, retry, keyboard focus and route cleanup.

The shared typed adapter `parseValues` contract is unchanged. Hosts still parse and authorize domain payloads; per-view resolvers may return different validated flat values. This does not introduce conditional field-expression engines, multiple simultaneous forms, a new mutation owner or record-cache secrets.

## Implementation and verification

Implemented through the existing default registration/form components. The selected form controls all editing seams; detail with explicit columns does not evaluate an unneeded form projection. See [default-page API documentation](../packages/admin/DEFAULT-PAGES.md#view-specific-forms).

Parent-executed checks passed:

- Root formatting/lint, build, typecheck and tests. Final task/cache counts: build 3 successful / 1 cached; typecheck 5 / 3; test 6 / 4. Admin's 408 tests and Demo's two 83-test runs executed fresh; Base was cached in that final root run, with a separate fresh 311-test plus 58 built/Sass checks run also passing.
- Seventeen new real default-page/router/store tests, including shared fallback, independent validation/projection/errors, numeric coercion, sensitive fields, palette/draft replacement, record/view changes and late async-work fencing.
- All 136 serialized Chromium cases passed, including eight new built-public-API cases across light/dark, LTR/RTL and visible/palette submission. They exercise native validation focus, mapped-error focus after pending controls re-enable, retry, precise payloads, create-only credential removal and history cleanup. Reviewed narrow light/create and dark/RTL/update screenshots.
- Seventeen packaging tests passed. These stage disposable fixture manifests and run publication dry runs only; no source version, tag, registry package or downstream dependency was changed.

Evidence: `.tmp/view-specific-forms/` and `.tmp/view-specific-forms-browser/` in this worktree. Preserve the initial eight failing capability tests, the explicit column-projection regression, offline-install failure, typecheck before public build prerequisites, and formatting iterations. The first new browser run caught a test navigation race: Back ran before Cancel's navigation committed; waiting for the expected destination fixed the test without changing timeouts.

The first full matrix had one existing async-reference URL assertion failure (dark/RTL, observed no filter immediately after Apply). The unchanged reference suite passed on its direct rerun, and both subsequent complete 136-case runs passed. No reference-filter code, assertions or timeouts were changed; the earlier failure remains recorded rather than being claimed as a fixed defect.

This is source validation, not registry/consumer adoption or independent review. Publication and consumption remain a later, separately authorized batch step.
