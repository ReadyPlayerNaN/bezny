# TODO

## New packages

### @bezny/tabs

Tabbed interface component. Boardo's `AddMemberModal` currently uses hand-rolled tab switching with local state. A generic `Tabs` / `Tab` / `TabPanel` compound component would standardize this pattern.

### @bezny/badge

Inline label for statuses, tags, and categories. Useful for displaying entity statuses (draft/active/archived), workflow state colors, and tag chips in list views and detail pages.

### @bezny/tooltip

Positioned tooltip triggered on hover/focus. No tooltip capability exists yet — needed for icon-only buttons, truncated text, and contextual hints.

### @bezny/pagination

Pagination controls for list views. Currently lists use limit-based loading with no UI for navigating pages or loading more items.

### @bezny/popover

Positioned content panel triggered by click, richer than a tooltip but lighter than a dialog. Currently `@bezny/dropdown` covers simple menus, but more complex positioned content (e.g. filter panels, rich previews) would benefit from a dedicated popover.
