# Registered entity applications

An entity registration is the source of truth for its **screens, URLs, context, and commands**. Do not write one route tree and then separately invent a palette based on pathname tests.

## Route contract

`createAdminApplication` owns these TanStack Router patterns:

| Operation | Pattern                   | Example instantiations              |
| --------- | ------------------------- | ----------------------------------- |
| List      | `/$entity`                | `/articles`, `/pages`               |
| Create    | `/$entity/create`         | `/articles/create`, `/pages/create` |
| Detail    | `/$entity/$recordId`      | `/articles/1`, `/pages/1`           |
| Update    | `/$entity/$recordId/edit` | `/articles/1/edit`, `/pages/1/edit` |

In conventional URL notation the detail route is `/:entity/:id`. `/articles/1` is an instance of that route, not an article-specific route definition. Commands navigate with typed parameters, letting TanStack encode IDs; context uses the actual match and decoded parameters, not string splitting, regexes, or `endsWith` checks.

Entity keys are unique lowercase slugs. Record IDs must be non-empty, unique within their entity, and not `create`, which is reserved for the static create screen. The application factory validates initial references. Data adapters must maintain these invariants on updates. Identical IDs in different entities are independent.

## Registration and mounting

```tsx
import {
  createAdminApplication,
  AdminApplicationProvider,
} from "@bezny/admin/application";
import { useAdminEntityCommands } from "@bezny/admin/commands";
import { useAdminEntityContext } from "@bezny/admin/context";
import type { AdminEntity } from "@bezny/admin/entities";
import { AdminLayout } from "@bezny/admin/layout";
import { AdminPage } from "@bezny/admin/page";
import { Outlet } from "@tanstack/react-router";
import { atom } from "jotai";

const documentReferences = atom([{ id: "1", label: "Introduction" }]);

const DocumentList = () => {
  const { entity } = useAdminEntityContext();
  return <AdminPage heading={entity?.label}>Your document list</AdminPage>;
};
const DocumentDetail = () => {
  const { recordId } = useAdminEntityContext();
  return (
    <AdminPage heading={`Document ${recordId}`}>Your document data</AdminPage>
  );
};
const Root = () => (
  <AdminLayout>
    <Outlet />
  </AdminLayout>
);
const NotFound = () => <AdminPage heading="Unavailable" />;

const documents = {
  key: "documents",
  label: "Documents",
  singularLabel: "Document",
  records: documentReferences,
  screens: { list: DocumentList, detail: DocumentDetail },
} satisfies AdminEntity;

const application = createAdminApplication({
  entities: [documents],
  Root,
  NotFound,
});
export const App = () => <AdminApplicationProvider application={application} />;
```

Create an application once, outside render. The factory supplies a router, registry, and isolated Jotai store. Supply `history` for testing or custom routing environments and `store` to connect loaders/non-React data access. `AdminApplicationProvider` accepts the same presentation `components` overrides as `AdminProvider`. `AdminProvider` remains available for applications owning an unrelated router; entity hooks require the entity application provider.

`list` is required; `create`, `detail`, and `update` are optional capabilities. Missing screens produce the configured unavailable screen and **no corresponding route command**. Unknown entities, missing records, and unsupported operations do not manufacture record actions. The first registered collection is the `/` landing destination.

`records` is a Jotai read atom of stable `{ id, label }` references. It is not a database or a generic schema for the entire record. Applications own data fetching, complete record data, forms, and rendering. Derived reference atoms can use `selectAtom` with equality to avoid rerenders for irrelevant data changes.

## One command catalog

`useAdminEntityCommands()` exposes:

- `navigationCommands`: list/create navigation for all registered entities and supported screens. Use these for application navigation and the palette.
- `list`, nullable `create`: the current entity's collection/page commands.
- `forRecord(id)`: supported detail/update commands and registered record actions. Use these unchanged in rows and detail pages.
- `forSelection(id)`: the same selection toggle for a row checkbox and the palette.
- `selectionCommands`: registered bulk actions and clear-selection.
- `pageCommands`: callbacks registered by the active screen.
- `paletteCommands`: the composed catalog of the above, scoped to the actual matched screen and records.

Every command carries stable identity, a display label, and one execution function. Route commands also carry an `AdminEntityLocation`. The demo's palette renders this catalog directly; it has no entity-specific entries or navigation code.

`useAdminEntityNavigate()` accepts domain locations such as `{ entity: "documents", view: "detail", recordId: "1" }`, not handwritten URLs. Use it after saves, deletions, or other domain operations.

### Record and selection actions

Register actions on the entity with an `id`, `target` (`record` or `selection`), label function, and execution function. Their `AdminActionScope` includes the entity, matched view, target references/IDs, Jotai store, and domain navigation function. A destructive action should **request a confirmation dialog**, not perform deletion directly. The demo registers the same confirmation request for row and bulk deletion.

Use an `enabled` boolean atom for reactive permissions/availability, and optionally `isAvailable(scope)` for context/record-dependent rules. The common catalog filters all UI surfaces consistently and rechecks enabled state, target existence, and availability at execution. Authorization must also be enforced by a backend; client checks are not a security boundary.

### Real screen callbacks, not DOM lookups

Forms can register memoized page commands with `useAdminPageCommands(commands)`. Bind Save to the same RHF `handleSubmit(save)` callback as the form, and Cancel to domain navigation. The palette executes those callbacks directly: it does not query a hardcoded form ID or pretend a route necessarily contains a submit button.

Page commands are scoped to entity, view, and record ID. They disappear when the screen changes; stale callbacks become inert after registration is cleaned up. Keep command arrays stable with `useMemo`, and define their real callback dependencies. There is currently one active page-command registration per screen; compose a screen's commands into one registration rather than allowing independent panels to compete for it.

## Entity context and selection

`useAdminEntityContext()` exposes `entity`, `view`, decoded `recordId`, current record references, valid selected IDs, and a `kind` of `collection`, `entity`, `selection`, or `unavailable`.

Selection is Jotai state with an entity namespace. Leaving a list or switching entities clears it, including browser back/forward transitions. Unknown/deleted IDs are excluded from active selection. Row actions explicitly bind that row's ID; bulk actions bind the current valid selection. Registry context, TanStack routing, and form state retain separate responsibilities.

## Example and boundaries

[`@bezny/demo`](../demo/README.md) registers **Articles and Pages** once each, backed by separate in-memory datasets but sharing presentation and form code. Both entity paths and palette entries work without adding another route definition or another palette branch.

This is a registered-entity foundation, not a production backend/data-access framework. Async loading policies, pagination, schema-driven fields, custom non-entity route composition, and richer palette presentation remain future slices. The existing customization API continues to let applications replace layout/page presentation.
