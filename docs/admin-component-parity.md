# Admin component parity release

Source baseline: `12ebde2` (published base/admin 0.2.0). The Joober operator approved all eight families in Joober's `docs/verification/bezny-component-gap-audit.md`. This is a delivery boundary, not approval of additional component families.

## Acceptance criteria

- JSON viewer: tree/raw modes, root initially expanded, individual/all-node expansion, arrays/objects/scalars, circular/non-JSON values, escaped text, custom leaf rendering with canonical RFC 6901 pointers (empty root; `~0`, `~1`). Repeated references are not cycles. Host owns schema annotations and dialogs.
- Single/multiple pickers: controlled options and query; labels/sublabels; selection, clear/removal, duplicate exclusion, loading/empty/error states; keyboard, IME, Escape, focus, disabled behavior. Host owns remote queries, debounce, stale-response fencing and selected entity models.
- Date/month pickers: locale-aware typed dates, retained invalid drafts, ISO date/month values, calendar/month selection, year navigation, clear, today/current month, bounds and disabled state; RHF field compositions. Date-only values must not shift across timezones.
- File dropzone: single file, keyboard/click and drag/drop selection, name/size, clear, disabled state and same-file reselection. Host owns validation/upload.
- Accordion/disclosure: Radix behavior, controlled/uncontrolled single/multiple state, optional collapse, keyboard/focus; optional mounted hidden bodies must preserve unsaved fields without leaving hidden controls focusable.
- Tabs: Radix keyboard navigation, controlled/uncontrolled active value, accessible tab/panel relationships. Route navigation remains application links.
- Prose: token-backed headings/lists/links/quotes/code/authored content, narrow overflow. No Markdown parser, editor or HTML sanitization/trust policy.
- Cron editor: raw five-field value, hourly/daily/weekly/monthly/custom builder, description, external updates, disabled/error state and RHF binding. Host owns schedule business rules, timezones and mutations.

## Delivery gates

Complete and commit each independently usable family with tests and usage docs before beginning the next. Use suitable Radix primitives and the existing Foundational → Logical → Structural → Control token architecture. Test actual keyboard/focus interactions, refs/labels, controlled state, edge cases, narrow light/dark/RTL layouts, and RHF integration where fields are provided.

Run complete package checks, browser checks and packaging verification; obtain independent review before merging. Publish matching base/admin versions only when all eight families are ready, using the existing release workflow. Verify registry delivery and install it in Joober; exercise representative consumers before continuing route migration gates. Upstream completion alone does not mean Joober migration completion.

No new CI jobs, data sessions, chart suite, treegrid, rich-text editor, entity backend or application-domain components are authorized by this scope.

## Status

- JSON viewer implemented with Radix Collapsible, token-backed presentation, public leaf/pointer API and usage documentation. Base build/typecheck passed; 179 unit tests and 58 built-package/token checks passed, including ten JSON interaction/edge-case tests. Eight shipped-component browser cases passed in light/dark, LTR/RTL, narrow/wide layouts with reduced motion and strict CSP. Narrow light and dark/RTL screenshots inspected. Evidence is under `.tmp/component-parity/json-*.log` and `.tmp/json-viewer-browser/`.
- Accordion implemented with Radix single/multiple, controlled/uncontrolled, optional collapse, disabled and RTL navigation. `forceMount` bodies preserve RHF registration and drafts while closed content is removed from focus/layout. Base build/typecheck and repository lint passed; 186 unit tests and 58 built-package/token checks passed. Four light/dark and LTR/RTL narrow browser cases exercised actual retained fields, Tab order and submission. Evidence: `.tmp/component-parity/accordion-*.log`, `.tmp/accordion-browser/`.
- Tabs implemented with Radix controlled/uncontrolled values, automatic/manual activation, disabled triggers, orientation/RTL, refs and panel associations. Force-mounted inactive panels remain registered but are hidden from focus. Base build/typecheck and repository lint passed; 192 unit tests and 58 built-package/token checks passed. Four narrow light/dark, LTR/RTL browser cases verified panel focus, hidden drafts, roving keys and local overflow. Evidence: `.tmp/component-parity/tabs-*.log`, `.tmp/tabs-browser/`.
- Prose typography implemented without parsing/sanitization ownership. Native props/refs and escaped strings are retained; authored headings, lists, quotes, code, links and tables use token-backed styles with local overflow. Base build/typecheck and repository lint passed; 195 unit tests and 58 build/token checks passed. Four narrow light/dark and LTR/RTL browser cases checked heading scale, focus, semantics and overflow. Evidence: `.tmp/component-parity/prose-*.log`, `.tmp/prose-browser/`.
- Remaining four families, independent review, merge, publication and consumer installation remain pending. No release-completion claim is made.
