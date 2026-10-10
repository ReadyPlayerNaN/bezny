# Composed components

Import components from `@bezny/base` and styles from `@bezny/base/style.css`. All component styles consume validated control aliases of structural tokens. Shared surface purposes live in `src/tokens/_surfaces.scss`, referencing only logical tokens. Geometry/typography use `rem`; themes use semantic colours.

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

Portalled content inherits its actual DOM container's theme, not React context. Pass `container` to content for nested `.bezny-light`/`.bezny-dark` boundaries. Default content is portalled to `document.body`. Radix runtime positioning variables are retained; design values use `--bezny-control-select-*` aliases.

## ToggleGroup

`<ToggleGroup type="single" defaultValue="list" aria-label="View"><ToggleGroupItem value="list">List</ToggleGroupItem><ToggleGroupItem value="grid">Grid</ToggleGroupItem></ToggleGroup>`

Use `type="multiple"` with string-array values for independent pressed buttons. Radix owns roving focus, RTL/orientation, disabled items, and controlled state. Single groups may deselect to the empty string; control value changes to enforce an always-selected policy. These buttons are not boolean switches or native form inputs; use Controller for RHF integration. Token prefix: `--bezny-control-toggle-group-*`.

## Tooltip

`<TooltipProvider><Tooltip><TooltipTrigger asChild><Button>Details</Button></TooltipTrigger><TooltipContent>Additional information</TooltipContent></Tooltip></TooltipProvider>`

Use a shared provider for delay/skip-delay policy. Root open state and hover, focus, Escape, and activation behavior remain Radix-owned. Tooltip content is noninteractive descriptive text, not a place for links/buttons. Trigger children using `asChild` must forward props/ref. Content includes its portal and arrow, accepts `container` for local themes, and uses `--bezny-control-tooltip-*`.

## ContextMenu

`<ContextMenu><ContextMenuTrigger>Right-click or focus and press Shift+F10</ContextMenuTrigger><ContextMenuContent><ContextMenuItem onSelect={archive}>Archive</ContextMenuItem></ContextMenuContent></ContextMenu>`

Compose labels/groups/separators, checkbox/radio items, and submenus with the matching `ContextMenu*` exports. Items accept `tone="critical"`, disabled state, and Radix selection events (prevent default to keep open for async work). Content and subcontent include portals and support `container`. The trigger bridges ContextMenu/Shift+F10 keys into Radix's native context-menu event; Radix still owns positioning, touch long press, navigation, dismissal, and focus. Caller key/context handlers can prevent default to suppress opening. Token prefix: `--bezny-control-context-menu-*`.

## Dialog

`<Dialog><DialogTrigger asChild><Button>Edit</Button></DialogTrigger><DialogContent><DialogTitle>Edit profile</DialogTitle><DialogDescription>Update your details.</DialogDescription><DialogClose asChild><Button>Close</Button></DialogClose></DialogContent></Dialog>`

Content owns a portal and modal overlay, a viewport-constrained scrollable panel, and `--bezny-control-dialog-*` tokens. Always provide a title; if there is no description, explicitly set `aria-describedby={undefined}` on content. Root supports controlled/uncontrolled open and `modal={false}`. Radix owns focus trapping/return, inert background, outside dismissal, and Escape. Content forwards event/ref props and accepts `container`; application-owned async forms should control open state and close only after successful submission.

## AlertDialog

Compose `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogCancel`, and `AlertDialogAction`. Content uses the same dialog presentation tokens/portal container contract. Provide both a title and description and an explicit cancel action. Use `asChild` with secondary `Button` for Cancel and critical `Button` for destructive Action. Radix focuses Cancel first, traps focus, and blocks outside dismissal; Escape still cancels. For asynchronous actions, prevent the action's default click, manage pending/error state in the application, and close the controlled root only on success.

## Badge

Ported from aipocapso's `controls/badge`. `<Badge type="success">Ready</Badge>` retains neutral/info/success/warning/critical tones, uppercase pill typography, and ordinary span props/React 19 refs. Labels remain ordinary content, not live announcements. Status palettes map through logical light/dark aliases rather than independent OS media queries. Token prefix: `--bezny-control-badge-*`.
