# Registered collection sorting

Status: implementation, source validation and independent review complete; matching patch publication and downstream adoption remain pending.

## Contract

Register sortable fields and optional ordered defaults on an entity. Ordinary default collections and the connected palette provide the same RHF-backed ordered sort editor and validated command. Sorting is first-class framework query state, not a filter or an application-owned lifecycle.

## Acceptance

- Public typed fields/rules use opaque registered keys and `asc`/`desc` directions. Rules preserve priority order. Reject duplicate or unknown keys, invalid directions and oversized input. Bound registration and selection to 50 fields/rules; keys are nonempty and at most 200 UTF-16 units, labels nonempty and at most 1000. Defaults must be valid registered rules.
- `AdminListQuery.sort` is optional for backward compatibility. Entities without sorting retain their existing adapter/query behavior. Sorting-enabled entities receive normalized ordered rules, including an explicit empty array when the user chooses no sort. An absent URL sort uses registered defaults; an explicit empty array overrides defaults. Invalid untrusted URL input falls back safely to defaults rather than reaching adapters.
- The framework owns native URL sort state, reload and Back/Forward. Changing sort resets the page and selection but retains filters/page size. Filtering, pagination, language changes, mutations and refresh retain sorting. Sort order participates in cache/request identity and stale-command/reference fencing.
- The standard editor supports adding/removing fields, changing directions, moving priority up/down, clearing and restoring defaults. Base Select/Button/Popover composition owns keyboard, focus, dismissal and portals. Palette and collection use the same command and editor; draft changes do not apply until submission, and cancelling does not mutate queries.
- Behavioral tests exercise real registrations/default pages, router/store/session, adapter-visible queries, shared commands, invalid input, cancellation, cache separation and stale work. Browser checks cover keyboard/focus, history/reload, light/dark and narrow LTR/RTL layouts. Preserve existing filter behavior and published APIs.
- Validate source with the declared check/build/typecheck/test scripts, serialized browser suites and packaging checks. Obtain independent read-only review of the complete diff and evidence before merging and releasing matching base/admin patch versions. Verify registry metadata/integrity/bytes and downstream frozen installation and regression gates before adoption.

## Source validation

The implementation exposes typed registration/query rules, native URL defaults/explicit-empty semantics, one ordered RHF editor shared by the collection Popover and palette, and the existing session/command lifecycle. Usage is documented in [default pages](../packages/admin/DEFAULT-PAGES.md#registered-ordered-sorting).

Parent-executed checks (2026-11-06), with evidence under ignored `.tmp/registered-sorting/`:

- `pnpm check`, `pnpm build`, `pnpm typecheck`: passed (`check-final-2.log`, `build-final.log`, `types-final-2.log`).
- `pnpm test --concurrency=1`: base 311 unit + 58 build/token tests; admin 347; demo 83 in each configuration, all passed (`tests-final-2.log`).
- Serialized base/admin/demo native browser suites: 88 passed (`browser-final.log`), including sorting keyboard Tab/Enter/End, focus return, reorder/removal, draft cancellation, URL reload/history and narrow light/dark × LTR/RTL checks.
- Packaging suites: 17 passed (`packaging-final.log`). `git diff --check` passed.
- Eight sorting screenshots are in `.tmp/sorting-browser/`. Collection content and palette editors scroll within constrained viewports; native controls and Apply remain reachable.

Behavioral tests execute both programmatic and host file-route applications, default pages, actual router/store/session and adapter callbacks. They cover defaults, invalid URLs/commands/registrations, explicit empty rules, cache direction/priority identity, copied URLs, Back/Forward, page/selection reset, preserved filters/page sizes, pagination, locale, refresh/mutation, paused/disposed commands and late response cancellation. Tests do not substitute source matching for runtime behavior.

Preserved initial failures: the browser test initially sent Enter before Radix's deferred End-key focus settled; it now awaits the actual focused option before Enter, without sleeps/timeouts. Stricter assertions initially compared router null-prototype search objects against ordinary objects; assertions now compare copied search entries while retaining exact key/value checks. No production behavior was changed to accommodate those test issues. Existing build directive, router CLI circular-dependency and npm user-config warnings remain; no dependency or CI changes were introduced.

Independent read-only reviewer `6d34f68c-912e-4910-9df0-1c717802c1b3` reviewed the complete `5972016..244de68` diff, relevant source, parent-executed logs and all eight screenshots. Verdict: **OK with notes**, no issues found. The reviewer did not rerun checks. The notes identify publication and downstream frozen-installation gates as outstanding, not source defects.

This is not publication or downstream-adoption evidence. Those gates remain separate.

## Non-goals

No legacy route/query compatibility mapping, consumer-specific names or backend schemas, backend sorting engine, permission/auth changes, data grid, client-side collection cache, second router/resource owner, new CI steps, unrelated dependency upgrades or minor release. Host adapters translate the ordered rules to their own existing backend contracts. Report additional incompatibilities before implementing a workaround.
