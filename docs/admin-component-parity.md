# Admin component parity release

Source baseline: `12ebde2` (published base/admin 0.2.0). The Joober operator approved
all eight families in Joober's `docs/verification/bezny-component-gap-audit.md`.
This is a delivery boundary, not approval of additional component families.

## Acceptance criteria

- JSON viewer: tree/raw modes, root initially expanded, individual/all-node
  expansion, arrays/objects/scalars, circular/non-JSON values, escaped text,
  custom leaf rendering with canonical RFC 6901 pointers (empty root; `~0`, `~1`).
  Repeated references are not cycles. Host owns schema annotations and dialogs.
- Single/multiple pickers: controlled options and query; labels/sublabels;
  selection, clear/removal, duplicate exclusion, loading/empty/error states;
  keyboard, IME, Escape, focus, disabled behavior. Host owns remote queries,
  debounce, stale-response fencing and selected entity models.
- Date/month pickers: locale-aware typed dates, retained invalid drafts, ISO
  date/month values, calendar/month selection, year navigation, clear,
  today/current month, bounds and disabled state; RHF field compositions.
  Date-only values must not shift across timezones.
- File dropzone: single file, keyboard/click and drag/drop selection, name/size,
  clear, disabled state and same-file reselection. Host owns validation/upload.
- Accordion/disclosure: Radix behavior, controlled/uncontrolled single/multiple
  state, optional collapse, keyboard/focus; optional mounted hidden bodies must
  preserve unsaved fields without leaving hidden controls focusable.
- Tabs: Radix keyboard navigation, controlled/uncontrolled active value, accessible
  tab/panel relationships. Route navigation remains application links.
- Prose: token-backed headings/lists/links/quotes/code/authored content, narrow
  overflow. No Markdown parser, editor or HTML sanitization/trust policy.
- Cron editor: raw five-field value, hourly/daily/weekly/monthly/custom builder,
  description, external updates, disabled/error state and RHF binding. Host owns
  schedule business rules, timezones and mutations.

## Delivery gates

Complete and commit each independently usable family with tests and usage docs
before beginning the next. Use suitable Radix primitives and the existing
Foundational → Logical → Structural → Control token architecture. Test actual
keyboard/focus interactions, refs/labels, controlled state, edge cases, narrow
light/dark/RTL layouts, and RHF integration where fields are provided.

Run complete package checks, browser checks and packaging verification; obtain
independent review before merging. Publish matching base/admin versions only
when all eight families are ready, using the existing release workflow. Verify
registry delivery and install it in Joober; exercise representative consumers
before continuing route migration gates. Upstream completion alone does not mean
Joober migration completion.

No new CI jobs, data sessions, chart suite, treegrid, rich-text editor, entity
backend or application-domain components are authorized by this scope.

## Status

Scope accepted. Implementation and release verification pending.
