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
