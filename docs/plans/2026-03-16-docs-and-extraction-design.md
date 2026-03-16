# Docs Integration & Package Extraction Design

## Goal

Integrate card, drawer, dropdown, overlay into docs. Extract navbar and breadcrumb components from `@bezny/navigation` into standalone packages `@bezny/navbar` and `@bezny/breadcrumbs`. Add doc pages for all.

## Package Extraction

### `@bezny/navbar` (new)

Move from `@bezny/navigation`:

- Navbar
- NavbarBrand
- NavbarToggle
- NavbarCollapse
- NavbarContext / useNavbar

Dependencies: `@bezny/styles`, `clsx`, `react`

### `@bezny/breadcrumbs` (new)

Move from `@bezny/navigation`:

- Breadcrumbs
- BreadcrumbItem

Dependencies: `@bezny/styles`, `clsx`, `react`

### `@bezny/navigation` (trimmed)

Remains with:

- Link
- Nav
- NavLink
- Sidebar

Remove all navbar and breadcrumb source files and exports. Clean break, no re-exports.

## Documentation Pages

Six new pages under `packages/docs/src/content/docs/components/`, all with full LivePreview interactive examples:

- `card.mdx` — Card compound component (Header, Body, Footer, Img) with variants
- `drawer.mdx` — Drawer with left/right side variants, open/close state
- `dropdown.mdx` — Dropdown with anchor positioning and alignment
- `overlay.mdx` — Overlay with open/close toggling
- `navbar.mdx` — Navbar with brand, toggle, collapse, responsive behavior
- `breadcrumbs.mdx` — Breadcrumbs with items and active state

### Docs package.json

Add workspace dependencies:

- `@bezny/card`
- `@bezny/drawer`
- `@bezny/dropdown`
- `@bezny/overlay`
- `@bezny/navbar`
- `@bezny/breadcrumbs`

## Decisions

- Clean break for extraction — no backwards-compat re-exports from `@bezny/navigation`
- Link, Nav, NavLink, Sidebar stay in `@bezny/navigation`
- All doc pages use LivePreview, including stateful components (Drawer, Dropdown, Overlay)
