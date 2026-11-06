# Registered collection filter completion

Status: authorized implementation; patch release required.

## Contract

Standard entity pages and the connected command palette must support registered multi-choice and asynchronous reference filters without application-owned filter bars or replacement list screens. This work is generic framework functionality. Examples and fixtures use editorial records and categories only.

## Acceptance

1. Existing text and single-choice registrations, adapter signatures and serialized string filter values remain compatible. New multi-value filters use bounded, validated JSON arrays inside the existing string-value transport, with public encode/decode functions so adapters do not invent competing formats.
2. Registered multi-choice filters compose the existing base multi-choice primitive. The ordinary filter and RHF palette editor execute the same validated command. Clearing, page reset, selection clearing, deep links, reload and Back/Forward keep the existing framework lifecycle and URL authority.
3. Asynchronous reference filters register generic search and selected-reference resolution callbacks. Framework-owned presentation manages bounded results, debounce, loading/error/retry, cancellation, stale responses and disposal. IDs remain authoritative; labels are resolved for presentation, not authorization. Backend access and permissions remain application-owned.
4. Unknown values, malformed/oversized selections and invalid registrations fail safely. Old text/single-choice controls are unchanged. Locale, entity, query, popup closure and unmount must not retain stale async work or permit stale edits.
5. Tests exercise the real registered default pages, router/store/URL, palette and base controls, including keyboard/focus behavior and narrow light/dark/RTL views. No mock-only component substitution or source-grep behavior assertions.
6. Complete and validate each functional slice before committing it. Validate the combined source, packaging and existing browser suites before a patch release. Recheck available registry/tag versions at release time; do not allocate a minor version. Publish matching base/admin packages through the existing release path.

## Static multi-choice slice validation

Registered multi-choice values now share bounded JSON normalization between URL parsing and command execution. Standard lists use `ModeFilter`; the palette uses an RHF-bound checkbox editor. Existing scalar values remain unchanged. Production browser coverage includes narrow light/dark and LTR/RTL views, history/reload, keyboard selection, focus restoration, clearing and adapter-visible values.

Independent review identified a label/ID collision for an option with value `all`. The base control now gives options index-based IDs in a namespace distinct from the All control. Both single- and multi-choice regression tests failed on actual label activation before the fix and passed afterward; the registered-page browser fixture also verifies the opaque `all` value.

Validation: formatting/lint, build and typecheck passed; base 309 unit tests plus 58 build checks, admin 298 tests and demo 83 tests per configuration passed. All 80 base/admin/demo browser cases and 17 packaging checks passed. Logs are retained under `.tmp/registered-filters/all-option-*`; the first combined validation invocation exhausted its parent command deadline during browser execution, and the unchanged standalone browser run passed. These results cover the static slice only; asynchronous reference filters and patch publication remain outstanding.

Independent static-slice review and focused fix re-review (`6b1abbe0-276d-4502-bac0-bc30c704d5d2`, follow-up `905c47ba-5f4e-43dd-a486-9bd6bcada2c6`) concluded **OK with notes**, with no remaining findings. The reviewer inspected source, tests, supplied logs and representative narrow RTL screenshots; it did not independently rerun validation. This is not acceptance of the outstanding async-reference slice or release.

## Async-reference slice validation

Registered sources now supply bounded `search` and selected-ID `resolve` callbacks. The default collection and RHF palette share the same scoped commands and base picker; IDs remain authoritative. Requests are debounced, cancellable and fenced across query, locale, entity, pause/disposal and unmount changes. Missing references remain removable by ID. Separate lookup/resolution retries preserve active filters. Base autocomplete reports suggestion visibility and keeps a retry action reachable after dismissal.

Native browser validation found that removing the retry button during pointer activation allowed delayed Radix outside-interaction handling to dismiss the popup. The retry action now remains mounted and disabled while retrying; prior error context is retained until that attempt settles. The unchanged native pointer journey passes afterward. Initial failing logs remain under `.tmp/registered-filters/reference-browser-initial.log`; no test timeouts were increased.

Combined validation passed: `pnpm check`, `pnpm build`, `pnpm typecheck`, `pnpm test --concurrency=1` (base 311 tests plus 58 build checks, admin 319, demo 83 per configuration), all 84 base/admin/demo browser cases and 17 packaging checks. Evidence: `.tmp/registered-filters/reference-final-*`. Parent inspection covered the narrow light LTR list and dark RTL palette screenshots; remaining screenshots are not claimed visually inspected. Independent review, patch publication and registry delivery remain pending.

## Non-goals

No consumer-specific names, schemas, authentication rules or backend transports; no parallel collection lifecycle, replacement router, generic data grid, new CI steps or dependency upgrades. No silently changed scalar filter wire format. Sorting and custom URL mappings must be evaluated against their own contracts, not disguised as arbitrary free-text values or used to justify custom list pages. Additional confirmed framework gaps are reported before implementation.
