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
