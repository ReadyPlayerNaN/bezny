# Explicit-target managed commands

## Authorized scope and acceptance (before implementation)

Add a public `useAdminEntityCommands().forRecords(ids, options?)` factory for managed selection-capable actions on an explicit subset of the active collection. This supports grouped/custom collection presentations without treating a group as a fabricated record, changing global selection, or creating a second action owner.

Acceptance:

- Only registered `target: "selection"` actions with `operation` participate. Existing row/selection commands and legacy execution remain backward compatible.
- Resolve all requested IDs from the current ready collection. Reject empty, duplicate, missing/off-page/reserved targets atomically; never execute a partial subset or fetch additional records. Capture copied IDs in current record order.
- Explicit command IDs cannot collide with normal selection commands. Retained commands cannot open an action after their originating snapshot is replaced, including refresh, route/query changes, pause or disposal.
- Recheck live record membership, enabled state and availability before opening, confirming and retrying. No command is an authorization grant.
- Keep unrelated global selection unchanged during confirmation, success, failure, cancellation and partial retries. Retry only failed captured targets. Native selection commands retain their existing selection-bound behavior.
- Reuse the managed dialog, RHF validation/drafts, pending locks, abort and late-work fencing. Provide an optional stable `returnFocus` element for group/menu triggers.
- Test real runtime/router/store/dialog behavior, native keyboard/focus in browser, async validation and transport races, adversarial IDs and old API regression.
- Document the public API and its active-page bound. Run repository checks, package test matrices, serialized browsers and packaging verification before committing.

Non-goals: grouped-list rendering, unbounded/off-page targeting, new adapter methods, backend authorization, consumer-specific queue policies, releases/tags/pushes, version/dependency changes, or downstream adoption. This is not independent review.

## Delivered behavior and verification

`forRecords` now returns managed selection-capable commands for the complete valid explicit set. Requests carry an internal target-source marker, so confirmation and partial retry do not consult or overwrite global selection. Existing row/selection entrypoints keep their previous behavior. Menu callers can supply a stable focus return element; native browser checks cover both buttons and Radix menu entry.

A new regression initially failed when leaving and returning to a cached route: the session republished the original snapshot object, reviving an old command. Cache activation now publishes a fresh frozen presentation wrapper while reusing canonical cached records. The regression verifies fresh identity, unchanged cached record identity, immutability and no extra adapter read. No cache bypass or additional owner was introduced.

Validation passed:

- Root `pnpm check`, `pnpm build`, `pnpm typecheck`, `pnpm test --concurrency=1`. Build: 3 successful/1 cached; types: 5/3; test graph: 6/4. Admin and Demo test executions were fresh; Base was then rerun directly with its declared test script.
- Admin: **429 tests**, including **21 new** explicit-target cases; built smoke check.
- Base: **311 tests plus 58 built/Sass tests** (fresh direct run).
- Demo: **83 tests under each of its two routing configurations**.
- **144 serialized native browser cases**, including **eight new** light/dark, LTR/RTL, button/menu journeys against built public entrypoints. Phone screenshots of partial failure were inspected. Keyboard confirmation, mapped-error focus, draft retention, exact failed-only retries, selection isolation, abort, late completions and focus restoration are exercised.
- **17 packaging checks**; `git diff --check`.

The first complete browser matrix passed 143/144: the unchanged async-reference filter test read `filters: null` immediately after Apply while expecting `{ related: '["guides"]' }` at `reference-filters.browser.mjs:123`. The same failure is preserved in the preceding view-specific-forms worktree's validation. An unchanged direct rerun passed all four reference cases, followed by a complete **144/144** rerun. This existing timing issue was not fixed or suppressed; no assertions, timeouts or retry settings were weakened. Earlier lint/fix attempts, the cache-lifetime regression failure and the first browser failure remain in `.tmp/explicit-action-targets/`. Browser screenshots are in `.tmp/explicit-action-targets-browser/`.

No publication, tag, push, source version/dependency change, downstream adoption or independent-review claim accompanies this source change.
