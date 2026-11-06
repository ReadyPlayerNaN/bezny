# Registered collection sorting

Status: authorized implementation; consumer-neutral patch release required.

## Contract

Register sortable fields and optional ordered defaults on an entity. Ordinary default collections and the connected palette provide the same RHF-backed ordered sort editor and validated command. Sorting is first-class framework query state, not a filter or an application-owned lifecycle.

## Acceptance

- Public typed fields/rules use opaque registered keys and `asc`/`desc` directions. Rules preserve priority order. Reject duplicate or unknown keys, invalid directions and oversized input. Bound registration and selection to 50 fields/rules; keys are nonempty and at most 200 UTF-16 units, labels nonempty and at most 1000. Defaults must be valid registered rules.
- `AdminListQuery.sort` is optional for backward compatibility. Entities without sorting retain their existing adapter/query behavior. Sorting-enabled entities receive normalized ordered rules, including an explicit empty array when the user chooses no sort. An absent URL sort uses registered defaults; an explicit empty array overrides defaults. Invalid untrusted URL input falls back safely to defaults rather than reaching adapters.
- The framework owns native URL sort state, reload and Back/Forward. Changing sort resets the page and selection but retains filters/page size. Filtering, pagination, language changes, mutations and refresh retain sorting. Sort order participates in cache/request identity and stale-command/reference fencing.
- The standard editor supports adding/removing fields, changing directions, moving priority up/down, clearing and restoring defaults. Base Select/Button/Popover composition owns keyboard, focus, dismissal and portals. Palette and collection use the same command and editor; draft changes do not apply until submission, and cancelling does not mutate queries.
- Behavioral tests exercise real registrations/default pages, router/store/session, adapter-visible queries, shared commands, invalid input, cancellation, cache separation and stale work. Browser checks cover keyboard/focus, history/reload, light/dark and narrow LTR/RTL layouts. Preserve existing filter behavior and published APIs.
- Validate source with the declared check/build/typecheck/test scripts, serialized browser suites and packaging checks. Obtain independent read-only review of the complete diff and evidence before merging and releasing matching base/admin patch versions. Verify registry metadata/integrity/bytes and downstream frozen installation and regression gates before adoption.

## Non-goals

No legacy route/query compatibility mapping, consumer-specific names or backend schemas, backend sorting engine, permission/auth changes, data grid, client-side collection cache, second router/resource owner, new CI steps, unrelated dependency upgrades or minor release. Host adapters translate the ordered rules to their own existing backend contracts. Report additional incompatibilities before implementing a workaround.
