# Composed components

Import components from `@bezny/base` and styles from `@bezny/base/style.css`. All component styles consume validated control aliases of structural tokens. Shared surface purposes live in `src/tokens/_surfaces.scss`, referencing only logical tokens. Geometry/typography use `rem`; themes use semantic colours.

## Shell

`Shell` is the reusable responsive application shell; `DefaultAdminLayout` composes it. Supply `header`, `navigation` (a list of links, not another `<nav>`), route `children`, and optional `footer`. `navigationLabel`, `openNavigationLabel` and `closeNavigationLabel` are localizable. Navigation stays inside the shell and inherits its theme; there is no portal. Root HTML props/classes/refs are forwarded. No navigation means no menu or drawer.

- **Wide (`>=64rem`)**: persistent inline-start sidebar (`16rem` by default), main content beside it, full-width navbar/footer.
- **Compact (`40rem`–`<64rem`)**: navbar `PanelLeft` toggles a non-modal sidebar below the navbar. The full-width main content slides inline-end by the sidebar width, off the viewport edge, rather than shrinking. Navbar and footer stay in place; overflow is clipped. Entry/exit use token-backed 200ms/120ms motion; reduced motion disables it.
- **Tiny (`<40rem`)**: the same navigation element fills the viewport, with a native close button. CSS makes the shell's background inert where the browser supports `interactivity: inert`.

Exactly one navigation tree and one main tree are rendered in all viewports. Native HTML `popover="auto"` and `popovertarget` buttons own toggling, Escape and outside dismissal. There is no Dialog/Collapsible wrapper, React open state, effect, event handler, portal, viewport hook, resize listener or JavaScript media query. React `useId` only generates an instance-safe native target ID. SCSS media queries and `:popover-open` select presentation; `@starting-style` plus discrete display/overlay transitions animate the native panel. Main content is translated, never cloned or squeezed. RTL mirrors the push. Navigation links retain native behavior; client-side route changes do not automatically close the panel. The tiny presentation is fullscreen navigation, not an ARIA dialog or a JavaScript focus trap. This requires native Popover API and modern CSS support; there is no JavaScript fallback.

Control aliases use `--bezny-control-shell-*`: header-height, sidebar-width, viewport-compact-min-width, viewport-wide-min-width, surface colours, padding, typography and focus-ring. Viewport CSS tokens are metadata; media queries use the same foundational values at Sass compile time. See [viewports](README.md#viewports). The `shell.browser.mjs` regression covers breakpoint boundaries, LTR and RTL; see [browser regression checks](README.md#browser-regression-checks) for prerequisites and commands.

## Select

```tsx
<Select name="plan" defaultValue="basic">
  <SelectTrigger aria-label="Plan">
    <SelectValue placeholder="Choose a plan" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="basic">Basic</SelectItem>
    <SelectItem value="pro">Pro</SelectItem>
  </SelectContent>
</Select>
```

`Select` retains Radix's controlled/uncontrolled value/open state, disabled, required, name, typeahead, keyboard, and focus contracts. `SelectContent` owns its portal, scrolling buttons, and viewport; `SelectItem` owns text/indicator. Compose `SelectGroup`, `SelectLabel`, and `SelectSeparator` as needed. Values must be unique, non-empty strings. Give the trigger a label and forward RHF's ref/blur to `SelectTrigger` and value/change to `Select` when using Controller. This input is unbound: it does not require RHF.

Portalled content inherits its actual DOM container's theme, not React context. Pass `container` to content for nested `.bezny-light`/`.bezny-dark` boundaries. Default content is portalled to `document.body`. Content `forceMount` is also forwarded to its owned portal for animation integrations; as with Radix, callers using force mounting are responsible for closed-state visibility/lifecycle. Radix runtime positioning variables are retained; design values use `--bezny-control-select-*` aliases.

## ToggleGroup

`<ToggleGroup type="single" defaultValue="list" aria-label="View"><ToggleGroupItem value="list">List</ToggleGroupItem><ToggleGroupItem value="grid">Grid</ToggleGroupItem></ToggleGroup>`

Use `type="multiple"` with string-array values for independent pressed buttons. Radix owns roving focus, RTL/orientation, disabled items, and controlled state. Single groups may deselect to the empty string; control value changes to enforce an always-selected policy. These buttons are not boolean switches or native form inputs; use Controller for RHF integration. Token prefix: `--bezny-control-toggle-group-*`.

## Toast

```tsx
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  ToastViewport,
} from "@bezny/base";

<ToastProvider duration={5000}>
  <Toast open={savedNotificationOpen} onOpenChange={setSavedNotificationOpen}>
    <ToastTitle>Changes saved</ToastTitle>
    <ToastDescription>Your article is ready.</ToastDescription>
    <ToastAction
      altText="Open the article from the Articles list"
      onClick={openArticle}
    >
      View article
    </ToastAction>
    <ToastClose>Dismiss</ToastClose>
  </Toast>
  <ToastViewport />
</ToastProvider>;
```

Application state and callbacks in this example are caller-owned. Wrap the application with one provider and render one viewport inside its theme boundary. The viewport is fixed at the bottom inline-end, constrained to the screen, and scrolls when notifications overflow. Radix portals toast roots into that viewport; there is no implicit body portal or toast queue/service.

`Toast` supports `open`/`onOpenChange`, `defaultOpen` (true by default), per-toast `duration`, `forceMount`, and Radix pause/resume, Escape, and swipe events. Radix owns automatic dismissal, hover/focus/window-blur pausing, keyboard navigation, live announcements, and swipe dismissal. All styled parts preserve refs, classes, native props, and `asChild` composition. Custom children must forward props/ref. Force-mounted closed content remains caller-managed.

Use `type="foreground"` for user-triggered messages and `type="background"` for background updates. Actions must be safe to ignore and require meaningful `altText` describing a permanent alternative way to perform the action; use `AlertDialog` when a response is required. Label icon-only close buttons with `aria-label`. Tell users that **F8** focuses notifications (or set a discoverable custom `hotkey`/`label` on the viewport); Tab navigates actions, Enter/Space activates buttons, and Escape dismisses a focused toast. Provider `label` and viewport `label` can be localized.

Control aliases use `--bezny-control-toast-*`, declared on roots and the viewport and inherited by their parts: background, text, muted, border, border-width, radius, hover, font-family, font-size, line-height, font-weight, padding, padding-small, gap, width, shadow, z-index, focus-ring, and opacity-disabled. Each references its matching `--bezny-structural-surface-*` purpose. Override shared structural aliases on `:root` or an explicit theme boundary; use component-scoped control overrides for individual notifications. Swipe positioning uses Radix's runtime movement variables, not design tokens.

## Tooltip

`<TooltipProvider><Tooltip><TooltipTrigger asChild><Button>Details</Button></TooltipTrigger><TooltipContent>Additional information</TooltipContent></Tooltip></TooltipProvider>`

Use a shared provider for delay/skip-delay policy. Root open state and hover, focus, Escape, and activation behavior remain Radix-owned. Tooltip content is noninteractive descriptive text, not a place for links/buttons. Trigger children using `asChild` must forward props/ref. Content includes its portal and arrow, accepts `container` for local themes, and uses `--bezny-control-tooltip-*`.

## ContextMenu

`<ContextMenu><ContextMenuTrigger>Right-click or focus and press Shift+F10</ContextMenuTrigger><ContextMenuContent><ContextMenuItem onSelect={archive}>Archive</ContextMenuItem></ContextMenuContent></ContextMenu>`

Compose labels/groups/separators, checkbox/radio items, and submenus with the matching `ContextMenu*` exports. Items accept `tone="critical"`, disabled state, and Radix selection events (prevent default to keep open for async work). Content and subcontent include portals and support `container`. The trigger bridges ContextMenu/Shift+F10 keys into Radix's native context-menu event; Radix still owns positioning, touch long press, navigation, dismissal, and focus. Caller key/context handlers can prevent default to suppress opening. Token prefix: `--bezny-control-context-menu-*`.

## Dialog

`<Dialog><DialogTrigger asChild><Button>Edit</Button></DialogTrigger><DialogContent><DialogTitle>Edit profile</DialogTitle><DialogDescription>Update your details.</DialogDescription><DialogClose asChild><Button>Close</Button></DialogClose></DialogContent></Dialog>`

Content owns a portal and modal overlay, a viewport-constrained scrollable panel, and `--bezny-control-dialog-*` tokens. Always provide a title; if there is no description, explicitly set `aria-describedby={undefined}` on content. Panels fade/scale in over 200ms and out over 120ms; backdrops fade with `0.5rem` blur. Radix retains closed layers until CSS exit animations finish, then restores focus. Reduced-motion preferences disable animations. Individual CSS scale preserves caller centering/positioning transforms, including RTL and the command palette. Customize `--bezny-structural-dialog-<duration-enter|duration-exit|easing-enter|easing-exit|scale-hidden|backdrop-blur>` on `:root` or a theme boundary; controls bind the corresponding `--bezny-control-dialog-*` aliases. Root supports controlled/uncontrolled open and `modal={false}`. Radix owns focus trapping/return, inert background, outside dismissal, and Escape. Content forwards event/ref props and accepts `container`; application-owned async forms should control open state and close only after successful submission.

## AlertDialog

Compose `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogCancel`, and `AlertDialogAction`. Content uses the same dialog presentation tokens/portal container contract. Provide both a title and description and an explicit cancel action. Use `asChild` with secondary `Button` for Cancel and critical `Button` for destructive Action. Radix focuses Cancel first, traps focus, and blocks outside dismissal; Escape still cancels. For asynchronous actions, prevent the action's default click, manage pending/error state in the application, and close the controlled root only on success.

## Badge

Ported from aipocapso's `controls/badge`. `<Badge type="success">Ready</Badge>` retains neutral/info/success/warning/critical tones, uppercase pill typography, and ordinary span props/React 19 refs. Labels remain ordinary content, not live announcements. Info/success/critical light text colours are darkened from the source palette so all five default tones meet WCAG AA for small text over their opaque soft backgrounds, including on highlighted rows. Custom palette/surface overrides must be contrast-checked again. See [contrast verification](CONTRAST.md) for interaction-state coverage. Status palettes map through logical light/dark aliases rather than independent OS media queries. Token prefix: `--bezny-control-badge-*`.

## Cards

Ported `Card`, `CardTitle`, `CardBody`, `CardProperties`, and `MultiBlockCard`. Card is a section/heading-level boundary; titles retain semantic inherited heading levels with card-specific visual sizing. Compose actions in CardTitle and properties in CardBody. MultiBlockCard wraps each non-empty direct child in a padded body with dividers between blocks. Use keyed elements for reorderable blocks. Native props and React 19 refs are preserved. Surfaces, spacing, title sizing, and separators use `--bezny-control-card-*`.

## Entity rows and entity cards

`EntityRowList` accepts source-compatible row data (id/title/link/description, icon/decoration/leading, badge/meta/trailing, expanded content, version links, and actions). `EntityRow`, `EntityRowTitle`, `SelectableRow`, and `EntityCard` are also available. Standalone `EntityRow` owns the same selection/menu behavior as a one-row list. `EntityRowList` also supports application-controlled `selectedIds`/`onSelectedIdsChange`, an explicit `selectable` override, localized `selectLabel`/`groupLabel`/`menuLabel`/`menuSummary` callbacks and `actionErrorLabel`, and `selectionMenu={false}` for row-only actions with bulk actions presented separately. Pass `selectionActions` to use application-owned shared commands on selected rows when multiple rows are selected, instead of intersecting their per-row callbacks. Explicit selection commands own confirmation and clearing; neither opening the menu nor requesting/cancelling confirmation clears selection. Unselected rows still expose only their own actions. Controlled mode never owns or clears the application's selection implicitly in row-only mode. Pass `menuContainer` to rows/lists/SelectableRow to portal menus and submenus into a local theme boundary. Links are ordinary anchors, not an application router. Pass custom React nodes for router-aware titles/trailing content when needed. Rows have default/small variants and tokenized padding/typography. Title sizing is independent of inherited heading level in lists and standalone entity cards: normal titles use `1rem`/`1.5rem`; small titles use `0.875rem`/`1.25rem` with ellipsis overflow. Rows highlight on hover, focus within, and selection using the control hover token. Selection checkboxes are visually hidden at rest on hover-capable devices, appear on hover/keyboard focus or while selected, and remain visible on touch devices. They remain in keyboard tab order even while visually hidden.

Action keys and row IDs must be unique. Callback actions are bulkable by default; link and `bulkable: false` actions never appear in multi-selection menus. Shared keys determine the intersection, including nested submenus. `onBulkSelect(ids)` runs once, otherwise corresponding callbacks run for every selected row. Disabled actions in any selected row disable that shared action. Selection clears only on success; async errors retain the menu/selection, announce a retryable error, and call optional `onActionError`.

Context menus use local `ContextMenu` components for right-click, long press, Shift+F10, submenu navigation, and focus. Native selection controls support keyboard activation; selected lists support drag selection and Shift-drag clearing, excluding nested interactive content. Removing rows/actions prunes selection. Token prefix: `--bezny-control-entity-row-*`.

## Analytical tables

Use native semantic tables when readers compare aligned values across records: benchmarks, scoring breakdowns, or salary statistics. Prefer `EntityRowList` for entity browsing and actions. These components are not a data grid: sorting, filtering, selection, fetching, pagination, and mutations remain caller-owned.

```tsx
<TableScrollArea label="Benchmark comparison scroll area">
  <Table>
    <TableCaption>Benchmark scores</TableCaption>
    <TableHead>
      <TableRow>
        <TableHeaderCell>Pair</TableHeaderCell>
        <TableHeaderCell numeric>Expected</TableHeaderCell>
        <TableHeaderCell numeric>Actual</TableHeaderCell>
        <TableHeaderCell numeric>Delta</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableHeaderCell scope="row">Candidate A / Position B</TableHeaderCell>
        <TableCell numeric>0.82</TableCell>
        <TableCell numeric>0.80</TableCell>
        <TableCell numeric>−0.02</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableScrollArea>
```

`Table`, `TableCaption`, `TableHead`, `TableBody`, `TableFoot`, `TableRow`, `TableHeaderCell`, and `TableCell` render their native HTML elements and preserve native props, children, classes, and React 19 refs. Headers default to `scope="col"`; use `scope="row"` for row labels and native `headers`, `id`, `colSpan`, or `rowSpan` for more complex associations. `numeric` on either cell type uses tabular numerals, logical end alignment (including RTL), and prevents numeric values from wrapping. Name each table with a caption or ARIA label.

The optional `TableScrollArea` is a labelled, focusable section with horizontal overflow and a visible keyboard focus ring. Its required `label` names the scroll region, not the table. Native keyboard scrolling works without custom handlers; all rows remain native table rows rather than cards or an ARIA grid. This explicit wrapper adds a tab stop even when content fits. Put real links/buttons in cells when needed; rows do not gain click behavior or selection implicitly.

For initial loading, retain headers, set `aria-busy` on the table, and render `TableSkeletonRow columns={4}` inside `TableBody`. The positive integer column count must match the table. Placeholder rows/cells are decorative and inert; announce a localized loading status once **outside** the busy table (for example, with an `output` next to it). Remove the status and loading rows when settled. Render empty/error states using a real `TableRow`/`TableCell colSpan={4}`, with an appropriate alert/retry control when needed. Do not wrap a real table in `LoadingSkeleton`, which hides its placeholder-only children from accessibility.

Control tokens use `--bezny-control-table-*`: background, text, muted, border, border-width, padding, padding-small, font-family, font-size, line-height, font-weight, and focus-ring. They bind shared structural surface purposes and follow explicit/nested light and dark themes. No new data, state, or grid tokens are introduced.

## Skeletons

`Skeleton` is a decorative, non-focusable span with `text` (default), `heading`, `circle`, and `block` variants. It forwards native props/classes/React 19 refs, forces `aria-hidden`, and accepts no children. Use a class or style to customize geometry when the defaults do not match the eventual content.

`EntityRowSkeleton` reuses entity-row spacing and supports `variant="small"`, `leading` (a circular placeholder), and `description={false}`. It contains no links, menus, selection controls, or fake records. Standalone skeletons do not announce loading; announce it once at the resource boundary.

```tsx
<EntityRowListSkeleton label="Loading companies" rows={3} leading />

<LoadingSkeleton label="Loading company details">
  <Skeleton variant="heading" />
  <Skeleton />
  <Skeleton variant="block" />
</LoadingSkeleton>
```

`EntityRowListSkeleton` combines a positive integer `rows` count (default 3) with one localized loading status. `LoadingSkeleton` provides the same status for custom compositions. Its children are hidden from assistive technology and inert: only put placeholders there, never real content or controls. Replace the loading composition when data, empty results, or an error arrives. Keep existing data visible during refresh where appropriate; these components do not own fetching.

Skeletons pulse using `--bezny-control-skeleton-duration` and `opacity-min`; `prefers-reduced-motion: reduce` disables animation. Their control aliases also cover background, radius, text-height, heading-height, circle-size, circle-radius, block-height, and gap. Background follows light/dark semantic neutral surfaces. Override shared `--bezny-structural-skeleton-*` aliases on a theme boundary or the control aliases on the skeleton itself. All design values follow the four token layers; screen-reader-only clipping is layout mechanics, not theme styling.

## Filters

Ported the reusable behavior from aipocapso's `calls/` filters, dropping the application-specific `Call` prefix and airline/backend coupling:

- `FilterBadge`: native selected-state filter button with label/ref/disabled props.
- `ValueFilter`: nullable text/datetime draft, custom summary, Apply/Enter and Clear. `maxLength` bounds native drafts; `applyLabel`, `clearLabel`, `placeholder`, and `summarize` support localized presentation.
- `ModeFilter<TValue>`: searchable single/multiple choices, optional All, custom summaries.
- `ChoiceFilter<TValue>`: nullable single-choice version of the airline picker; `searchLabel`, `allLabel`, and `emptyLabel` replace domain-specific wording.
- `TagFilter<TValue>`: multi-choice tag summaries and clear-all behavior.
- `Filters`: active/always-visible filters and searchable additive staging, with `onItemOpen(key)` and `render({ autoOpen })` handoff.

```tsx
<ValueFilter label="Owner" value={owner} onChange={setOwner} />
<ChoiceFilter label="Status" value={status} onChange={setStatus}
  options={[{ value: "ready", label: "Ready" }, { value: "pending", label: "Pending" }]} />
<TagFilter label="Tags" value={tags} onChange={setTags} options={tagOptions} />
```

Values and query/backend state remain application-owned; these are not RHF fields. Filter dialogs use Radix Popover for collision-aware placement, outside and Escape dismissal, portals, and focus return, rather than the source's custom backdrops/global listeners. Single choices use Radix radio navigation; multi choices and picker buttons use native Tab/Space/Enter behavior. Search inputs are real dialog inputs, not invalid embedded menuitems. Disabled options cannot be chosen. Drafts reset on reopening; ValueFilter reflects external value changes. `autoOpen` opens on mount or a false-to-true transition, not on every render. Pass `container` to filters for a nested theme. Token prefix: `--bezny-control-filter-*`. Filter keys and option values must be unique; choice values must be non-empty strings (empty represents All internally).

## Popover

Use `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverClose`, optional `PopoverAnchor`, and `PopoverArrow`. Content owns its portal; pass `container` for a nested theme boundary. Root supports controlled/uncontrolled state and optional modal behavior. Radix owns positioning, collision handling, focus, and dismissal. Trigger/Close can compose Bezny Button through `asChild`; Content/Anchor also preserve `asChild`, refs, and cancellable Radix events. Name the content with `aria-label` or `aria-labelledby`.

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button>Details</Button>
  </PopoverTrigger>
  <PopoverContent aria-label="Account details">
    Account details
    <PopoverClose asChild>
      <Button>Done</Button>
    </PopoverClose>
    <PopoverArrow />
  </PopoverContent>
</Popover>
```

Styles bind `--bezny-control-popover-*` to the shared structural surface palette, border, radius, typography, padding, width, shadow, and stacking tokens. Radix geometry variables remain intact. For tall content, constrain a scrolling inner region with `--radix-popover-content-available-height` rather than clipping the optional arrow. `forceMount` reaches both Content and its owned portal; callers using it manage closed-state visibility/lifecycle, as with Radix.

## Dropdown menu

Compose `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, and `DropdownMenuItem` for button-triggered action menus. Content owns its portal. Pass `container` to both Content and SubContent for nested theme boundaries. Root preserves controlled/uncontrolled state, modal/non-modal behavior, and `dir`. Radix supplies roving focus, keyboard activation, typeahead, disabled-item handling, dismissal, and submenu direction keys.

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onSelect={archive}>Archive</DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem tone="critical" onSelect={remove}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>
```

Also exports Group, Label, Separator, CheckboxItem, RadioGroup/RadioItem, ItemIndicator, and Sub/SubTrigger/SubContent. Checkbox items support `"indeterminate"`; selection items include reserved indicator space and a default check/minus icon. SubTrigger includes a direction-aware chevron. Every DOM part forwards refs/classes and primitive props. With `asChild` on selection items or SubTrigger, supply one child and your own indicator/chevron markup; the wrapper does not insert siblings that would break Radix Slot composition. Item supports `tone="critical"`; use `onSelect` (and `event.preventDefault()` to retain the menu), not a separate click-only action handler.

Styles bind `--bezny-control-dropdown-menu-*` to structural surface colours, spacing, typography, disabled opacity, borders, shadow, and stacking tokens. Menus scroll within Radix's available viewport size. Content/SubContent preserve `forceMount` through their owned portals; callers manage closed-state lifecycle when opting in. Triggers are intentionally styled through `asChild` + Button.

## Date and month inputs/fields

```tsx
<DateInput
  aria-label="Published from"
  value={publishedFrom}
  onValueChange={setPublishedFrom}
  locale="en-US"
  minYear={1900}
  max={publishedTo}
/>
<MonthInput aria-label="Started" value={started} onValueChange={setStarted} minYear={1900} />
<DateField name="issuedAt" control={form.control} label="Issued" rules={{ required: "Required" }} />
<MonthField name="started" label="Started" /> // inside FormProvider
```

`DateInput`/`MonthInput` are RHF-unbound controlled Gregorian date-only controls. Committed values are `YYYY-MM-DD`/`YYYY-MM`, or an empty string. They are not timestamps. Intl formatting and calendar arithmetic use an explicit UTC carrier, so a stored date never shifts with the browser timezone. `locale` defaults to `en` and controls numeric field order, separators, localized digits, weekday/month names and Gregorian year rendering, including locales whose default calendar is not Gregorian. Supported years are 0001–9999.

Type localized separated text or compact digits (eight/six for dates, six/four for months); canonical ISO text also works. One/two-digit years pivot into the most recent century relative to the current year. Four-digit years are never pivoted. Enter or blur commits only real, in-range values; invalid or out-of-range drafts remain visible with an associated error rather than rolling into another date. Empty text clears. IME Enter and post-composition key code 229 do not commit. An externally changed value/locale resets the private draft and refreshes an open calendar. For an unbound reset to the exact same value, explicitly remount with a reset key if a private draft must be discarded.

`min`/`max` are inclusive canonical values of the corresponding kind; empty bounds are unbounded. `minYear` defaults to **1**, not a recruitment/birth-date policy; use 1900 explicitly when carrying over that legacy constraint. Malformed bounds or invalid minimum-year configuration throw; inverted bounds leave no eligible choices. The application owns business constraints. Today/current month uses the browser's local calendar date, or a caller-supplied canonical `today` value for an application-specific timezone/clock. Bounds also disable navigation, years, dates/months and Today. Clear remains available. `disabled`/`readOnly` close and block the popup without reopening it when re-enabled.

Radix Popover owns portals, dismissal and trigger-focus restoration. There is no public Radix calendar/grid primitive; the installed roving-focus package explicitly says it is an internal utility not intended for public use, so this control does not depend on that internal API. The native table follows the [APG calendar grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) with one tabbable date/month/year button, full accessible labels and selected-cell state. The popup remains modeless, matching Popover semantics; Tab leaves the grid for the remaining controls rather than traversing every cell. Arrow keys move by cell/row, respecting RTL horizontally; Home/End move to row ends. PageUp/PageDown change months, years or twelve-year pages according to the view; Shift+PageUp/PageDown change a day grid by year. Month/year moves clamp the day instead of rolling past February. Year inspection does not commit a value. Navigation reaching a disabled boundary moves focus into the grid. Escape/selection restore trigger focus; changing month/year is announced politely. Forced-colors mode retains an outline and selected border.

Use a visible label through `id`/`htmlFor` or an accessible name. Native input props and refs reach the text input; `className` styles the composition. `onBlur` is a composite zero-argument callback reported on input blur and popup closure. `labels` localizes open/clear/today, navigation, year selection and error strings; `weekStartsOn` defaults to Monday (1). `dir` supports explicit direction or the Radix direction context. `portalContainer` selects the themed portal boundary; use a container inside modal content when embedded in a modal. Calendar width/icon size and all presentation use `--bezny-control-calendar-*` aliases through the four token layers.

**Form ownership:** unbound inputs emit canonical values through `onValueChange` only at commit; `onDraftChange` optionally exposes raw edits to hosts that must guard submission while a draft is uncommitted/invalid. The last committed value alone is not a complete form-validation state. Native FormData contains displayed localized text, not the canonical date—serialize the controlled value instead.

`DateField`/`MonthField` use the existing RHF owner (explicit `control` or FormProvider), labels, feedback and input focus refs. While editing, they keep raw text in RHF, then normalize it at valid commit; this prevents an invalid visible draft from silently submitting a previous valid ISO value. Built-in field rules reject noncanonical or out-of-range values and preserve caller validators, including name collisions. Required remains caller-owned. **RHF resolvers replace field rules:** a supplied resolver must validate ISO values and business bounds itself; it receives current raw drafts, never a hidden previous ISO value. Reset restores both the RHF value and displayed draft. Labels/help/invalid state, required focus, canonical submit, invalid-draft blocking and resolver integration are covered by tests.

## Controlled autocomplete and multi-item pickers

```tsx
<AutocompleteInput
  aria-label="Company"
  value={company}
  onValueChange={setCompany}
  query={companyQuery}
  onQueryChange={setCompanyQuery}
  options={companyOptions}
  getOptionKey={(option) => option.id}
  getOptionLabel={(option) => option.name}
  getOptionSublabel={(option) => option.website}
  loading={searching}
/>
<MultiItemPicker
  aria-label="Skills"
  selectionLabel="Selected skills"
  value={selectedSkills}
  onValueChange={setSelectedSkills}
  query={skillQuery}
  onQueryChange={setSkillQuery}
  options={skillOptions}
  getOptionKey={(option) => option.id}
  getOptionLabel={(option) => option.name}
  maxItems={10}
/>
```

Both controls accept non-null option values of a generic type; keys must be unique, stable strings. Selection and query are separate controlled values. `AutocompleteInput` requests an option or null through `onValueChange`; typing into a committed selection clears that selection. Selecting an option clears the query and displays its label. Clear and Backspace/Delete on the committed value request null and an empty query. A query is not an accepted free-text selection. External values/options are reflected without another data owner.

`MultiItemPicker` requests a new value array, excludes already-selected keys from suggestions, and provides individual removals. `maxItems` disables additional search/selection while leaving removals available. Reaching a limit moves focus to the named fieldset instead of leaving focus on a newly disabled input. Removing a chip focuses the input, or the fieldset when the input is still disabled before the controlled update. The host owns optimistic updates, mutations and error restoration.

The host supplies options, query, loading and optional string `error`; there is no fetcher, debounce, local filtering or async session inside either control. Loading/error presentation does not invalidate options the host still supplies: clear them or mark individual options disabled when they must not be chosen. `getOptionDisabled` excludes suggestions from keyboard navigation and activation. `minimumQueryLength` defaults to one trimmed character; use zero for initially available options. Focus never emits a query request. Query changes are emitted during composition to keep the controlled draft visible; native composition callbacks are forwarded so the host can defer remote searches until composition ends.

Radix Popover owns positioning and outside dismissal. Radix has no editable combobox primitive; the input/listbox implement the [APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/). DOM focus stays on the native input with mounted `aria-controls`/`aria-activedescendant` references. Arrow keys navigate enabled options; Enter explicitly commits without submitting a surrounding form; Escape dismisses without clearing the query; Tab leaves without selecting. Native text-editing keys remain native. IME Enter (including key code 229 after composition end) does not commit. An unavailable control closes its popup without reopening on re-enable. Explicit focus moves made by selection callbacks are respected.

Provide a visible label through `id`/`htmlFor`, or `aria-label`/`aria-labelledby`. Native input props/ref reach the text input; `className` styles the composition. A custom `renderOption(option, {active, selected})` may supply non-interactive presentation; do not nest buttons/links inside an option. `labels` localizes options/loading/empty/clear text. Multi-selection also accepts `selectionLabel` and `removeLabel(label)`. `dir` applies to the composition and popup. `portalContainer` supports themed portals; inside a modal, use a container within the modal's accessible content, rather than an already-hidden external container.

For RHF, use `Controller` to bind the selected value, `field.ref`, `field.onBlur` and `field.onChange`; keep the search query separately controlled. Required selection and other validation belong to the selection schema/rules, not the native input's non-empty search text. Required/error focus, submission and reset are tested with the real RHF owner. Reset query state alongside the form when clearing drafts. Native FormData contains the displayed input text, not an entity/ID; serialize the controlled selection through the host form owner.

`--bezny-control-autocomplete-*` aliases cover popup width/height, spacing, selection chips, typography, surfaces and focus. Structural autocomplete-width resolves through logical picker-width and foundational size-320; popups are bounded by Radix's available viewport and scroll internally. Long labels and selected items wrap at narrow widths.

## Cron input and field

```tsx
<CronInput aria-label="Schedule" value={expression} onValueChange={setExpression} />
<CronField name="schedule" control={form.control} label="Schedule" rules={{ required: "Required" }} />
```

`CronInput` is controlled raw five-field text with a Radix Popover builder; `CronField` binds it through RHF using the existing field-label/feedback contract. Use a FormProvider or explicit control. Rules/resolvers remain application-owned; RHF required/error focus, help/error descriptions, reset and submission are tested. Native input props and refs reach the raw input; `className` styles the composition. `onBlur` is reported for raw-input blur and builder closure. `disabled`/`readOnly` block edits and opening the builder; an already-open builder becomes read-only.

Hourly (1–12 hour intervals), daily, weekly and monthly modes use existing Bezny Select/ToggleGroup controls. All minute values (0–59) and hours (0–23) are available; day selections are sorted/deduplicated when generating expressions. Clearing a day selection generates `*` (every day), **not a disabled schedule**. Unsupported patterns, ranges, named days/months and invalid drafts remain raw Custom expressions without automatic normalization. Explicit Custom editing stays mounted even when its text becomes representable; external value updates refresh the builder without creating a second expression owner. Mode changes that generate an expression update immediately; Escape closes the builder, not an undo dialog.

Descriptions use `cronstrue` with twelve-hour time by default. They are previews, not a validation policy. `describeExpression` supplies a localized/custom preview; `labels` covers the builder, modes, fields, invalid preview and seven weekday names. The host owns scheduling validation, timezones and execution. No jobs are created. Pass `dir="rtl"` for builder keyboard/layout direction; cron syntax itself stays LTR. `portalContainer` applies to the builder and nested Select portals, allowing explicit nested theme boundaries. Radix owns dismissal and focus restoration.

Control aliases `--bezny-control-cron-*` cover spacing, typography, code family, muted preview text and builder width. The 20rem builder width follows structural cron-builder-width → logical picker-width → foundational size-320, bounded by Radix's available viewport dimensions. Days use a seven-column grid; overflow scrolls within the builder. Existing primitives own their colours and focus rings.

## File dropzone

```tsx
<FileDropzone
  value={file}
  onValueChange={setFile}
  accept="application/pdf"
  aria-label="Invoice PDF"
/>
```

`FileDropzone` is a controlled single-file input: `File | null` plus `onValueChange`. A native file input covers the browse/drop area, preserving keyboard activation, file-chooser behavior and input refs for error focus. Dropping selects the first file; empty drops/cancelled dialogs leave selection unchanged. Selection displays name and size; Clear emits null and restores input focus. Disabled state blocks browse/drop/clear. No uploads or network work occur.

`accept` is a browser chooser hint, **not validation**; validate MIME/type/size in the application. Selection resets the native input immediately to permit same-file reselection. The authoritative File therefore lives in controlled state, not native FormData. Native `required` is intentionally excluded: bind `value` and `onValueChange` through RHF Controller and validate that File there. Forward Controller `name`, `ref`, `onBlur`, `aria-invalid` and error-description IDs; use existing FieldLabel/FieldFeedback as needed. RHF reset and error focus are tested.

Native input props (including ARIA/blur/accept/name) and its React 19 ref are forwarded; `className` styles the outer control. `labels` overrides `choose`, `drop` and `clear`; `formatSize(bytes)` localizes the size display (default: exact bytes). Existing description IDs are retained and the selection summary is added. Scoped `--bezny-control-file-dropzone-*` aliases cover surface/hover/accent/error, borders/radius, spacing, typography, focus and disabled opacity through structural surface tokens. The focusable native input is visually transparent, not hidden.

## Prose

```tsx
<Prose><h2>Terms</h2><p>Authored content.</p></Prose>
<Prose>{cmsText}</Prose>
// Sanitize at the application's trust boundary before rendering HTML:
<Prose dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

`Prose` forwards native div props, children, classes and React 19 refs. It only applies typography; strings stay escaped, and it does not parse Markdown or sanitize HTML. Do not pass untrusted content through `dangerouslySetInnerHTML`. Native HTML and children are mutually exclusive under React's own contract.

Styles cover six heading levels, paragraphs, lists, links, quotes, inline/block code, authored tables, separators and responsive images/video. Long words wrap; preformatted lines scroll locally. Give authored scroll regions a tab stop when needed for keyboard scrolling. This does not authorize tables for ordinary admin listings or replace analytical table components.

`--bezny-control-prose-*` covers body/heading typography, code family, surface colours, links/focus, spacing, borders and radii. Prose body size/line-height and six heading sizes reference explicit structural prose purposes, then the logical scale. Other tokens reuse structural surface purposes. Native heading semantics are unchanged by visual sizing; the host still owns document hierarchy.

## Tabs

```tsx
<Tabs value={locale} onValueChange={setLocale}>
  <TabsList aria-label="Content language">
    <TabsTrigger value="en">English</TabsTrigger>
    <TabsTrigger value="cs">Czech</TabsTrigger>
  </TabsList>
  <TabsContent value="en" forceMount>
    <EnglishEditor />
  </TabsContent>
  <TabsContent value="cs" forceMount>
    <CzechEditor />
  </TabsContent>
</Tabs>
```

`Tabs`, `TabsList`, `TabsTrigger` and `TabsContent` wrap Radix, forwarding primitive props, refs, classes and `asChild`. Match each trigger's unique value to its panel. Label the List. Use `value`/`onValueChange` for controlled state, or `defaultValue` for uncontrolled state. Radix owns selected/panel relationships, roving focus, Arrow/Home/End navigation, disabled triggers and horizontal/vertical orientation. Pass `dir="rtl"` for RTL keyboard direction. Automatic activation is the default; `activationMode="manual"` waits for Enter/Space/click after focus movement.

Inactive panels unmount by default. `forceMount` preserves mounted editor state; Bezny's stylesheet hides inactive panels with `display: none` to exclude their controls from focus/navigation. Do not override that rule. Panel focus remains Radix-owned. Tabs do not load data or control routes: use ordinary links for route navigation and preserve the host's locale/resource ownership.

The List scrolls locally when labels exceed available width. Scoped `--bezny-control-tabs-*` aliases cover surfaces, spacing, typography, minimum trigger height, active accent/on-accent, focus and disabled opacity using structural surface tokens. No animations are introduced.

## Accordion

```tsx
<Accordion type="single" defaultValue="details" collapsible>
  <AccordionItem value="details">
    <AccordionHeader asChild>
      <h2>
        <AccordionTrigger>Details</AccordionTrigger>
      </h2>
    </AccordionHeader>
    <AccordionContent forceMount>
      <Editor />
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

`Accordion`, `AccordionItem`, `AccordionHeader`, `AccordionTrigger` and `AccordionContent` wrap Radix and preserve its props, events, React 19 refs and `asChild` composition. Items need unique `value`s. Use `type="single"` with a string value/defaultValue, or `type="multiple"` with string arrays. Controlled `value`/`onValueChange`, disabled roots/items, optional `collapsible` for single mode, orientation and `dir="rtl"` follow Radix. Keep each Trigger inside Header; Header defaults to h3 and supports an appropriate heading through `asChild`. Triggers include a decorative open/closed indicator; with `asChild`, supply your own indicator inside the single child if desired.

Enter/Space expands; Arrow keys and Home/End navigate enabled triggers. Regions are labelled by their triggers. Content normally unmounts while closed. `forceMount` keeps it registered and preserves unsaved form state; Bezny's stylesheet applies `display: none` to closed content so it is neither exposed nor keyboard-focusable. This is intentionally not an exit animation API. Import the stylesheet once; do not override the closed-state display rule or nest another interactive control inside Trigger. The accordion does not own form state.

Scoped `--bezny-control-accordion-*` tokens map surface colour, border/radius, spacing, typography, minimum trigger height, hover, focus and disabled opacity through structural surface tokens. No animation is introduced.

## JSON viewer

```tsx
<JsonViewer
  label="Task payload"
  value={payload}
  defaultMode="tree"
  renderLeaf={({ path, formattedValue }) =>
    path === "/description" ? (
      <button onClick={inspectOverride}>{formattedValue}</button>
    ) : undefined
  }
/>
```

`JsonViewer` is read-only presentation of an unknown value. Tree mode starts with only the root expanded. Branches use Radix Collapsible (Enter/Space); Expand all and Collapse all operate on this viewer only. Tree/Raw is a Radix single toggle group with roving focus and a persistent selected value. Expansion survives mode changes. Raw output has a keyboard-scrollable surface; expansion controls are disabled in raw mode. Mode and expansion do not submit surrounding forms.

`labels` overrides `tree`, `raw`, `mode`, `expandAll`, `collapseAll` and `root`. `label` names the containing region; native section props, class and React 19 ref are forwarded. Pass `dir="rtl"` for matching Radix keyboard direction. No motion is introduced. Immutable `value` updates refresh output; matching expanded paths are retained, so key the viewer when a new document should reset it.

`renderLeaf({ value, key, formattedValue, path })` may provide React content; null/undefined uses the default escaped text. `path` is a canonical RFC 6901 pointer: the root is `""`, `~` and `/` are escaped as `~0` and `~1`, and array indices use numeric tokens. `key` is the displayed key (including brackets for array indices), or null at root. The host owns annotations, actions and dialogs. There is no HTML interpretation, data fetching or schema validation.

Objects, arrays (including holes), scalars, dates, regular expressions, bigint, undefined, symbols and functions have readable representations. Actual ancestor cycles show `[Circular]`; repeated references expand independently. Inspection errors are shown as text. Raw mode is a diagnostic JSON serialization, not a lossless transport encoding: non-JSON values are represented as strings; normal JSON number serialization applies to non-finite numbers.

Scoped `--bezny-control-json-viewer-*` aliases cover surface colours, border, radius, padding/gap, font size/line-height/weight, code family, hover and focus ring. Code typography follows structural surface-code-font-family → logical font-family-code → foundational font-family-mono. Long raw lines scroll locally; tree leaf text wraps within the viewer. Import the shared stylesheet once.

## Avatar

Compose `Avatar`, one `AvatarImage`, and `AvatarFallback`. Radix preloads the image and displays fallback while loading or after an error; `delayMs` on Fallback optionally avoids flashing. `onLoadingStatusChange` reports the native `idle`/`loading`/`loaded`/`error` lifecycle. All three parts forward DOM props, refs, classes, and `asChild`. Image requires an `alt` string (empty for decoration). No image loading or fallback timers are independently reimplemented by Bezny.

```tsx
<Avatar size="normal">
  <AvatarImage src={user.photoUrl} alt={user.name} />
  <AvatarFallback role="img" aria-label={user.name}>
    AL
  </AvatarFallback>
</Avatar>
```

Provide meaningful alt text and an accessible fallback: full visible text, or `role="img"` plus `aria-label` for initials. When a nearby visible name already identifies a purely decorative avatar, use `aria-hidden="true"` on Avatar and `alt=""` on Image. Avatar is not inherently interactive; wrap it in a named Button/link (or compose one through `asChild`) when activation is intended.

Default circular sizing is `small` = `2rem`, `normal` = `2.5rem`, `large` = `3rem`; images cover the circle and fallback is centred. The `--bezny-control-avatar-*` tokens cover each size, corresponding rem font sizes/line heights, font family, weight, neutral background, text, border, and radius. Structural avatar purposes reference logical sizing/typography/colours; round radius maps to the absolute foundational `50%` primitive. Styles inherit and rebind light/dark theme aliases without literal colour overrides.
