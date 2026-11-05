# Registered collection filter completion

Status: authorized implementation; patch release required.

## Contract

Standard entity pages and the connected command palette must support registered
multi-choice and asynchronous reference filters without application-owned filter
bars or replacement list screens. This work is generic framework functionality.
Examples and fixtures use editorial records and categories only.

## Acceptance

1. Existing text and single-choice registrations, adapter signatures and serialized
   string filter values remain compatible. New multi-value filters use bounded,
   validated JSON arrays inside the existing string-value transport, with public
   encode/decode functions so adapters do not invent competing formats.
2. Registered multi-choice filters compose the existing base multi-choice primitive.
   The ordinary filter and RHF palette editor execute the same validated command.
   Clearing, page reset, selection clearing, deep links, reload and Back/Forward
   keep the existing framework lifecycle and URL authority.
3. Asynchronous reference filters register generic search and selected-reference
   resolution callbacks. Framework-owned presentation manages bounded results,
   debounce, loading/error/retry, cancellation, stale responses and disposal. IDs
   remain authoritative; labels are resolved for presentation, not authorization.
   Backend access and permissions remain application-owned.
4. Unknown values, malformed/oversized selections and invalid registrations fail
   safely. Old text/single-choice controls are unchanged. Locale, entity, query,
   popup closure and unmount must not retain stale async work or permit stale edits.
5. Tests exercise the real registered default pages, router/store/URL, palette and
   base controls, including keyboard/focus behavior and narrow light/dark/RTL views.
   No mock-only component substitution or source-grep behavior assertions.
6. Complete and validate each functional slice before committing it. Validate the
   combined source, packaging and existing browser suites before a patch release.
   Recheck available registry/tag versions at release time; do not allocate a minor
   version. Publish matching base/admin packages through the existing release path.

## Non-goals

No consumer-specific names, schemas, authentication rules or backend transports;
no parallel collection lifecycle, replacement router, generic data grid, new CI
steps or dependency upgrades. No silently changed scalar filter wire format.
Sorting and custom URL mappings must be evaluated against their own contracts,
not disguised as arbitrary free-text values or used to justify custom list pages.
Additional confirmed framework gaps are reported before implementation.
