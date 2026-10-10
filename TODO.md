# TODO

> Every implemented feature must also be implemented and demonstrated in `@bezny/demo` as part of the same functional slice.

- [ ] Resolve memory leaks and unbounded data retention while keeping Jotai.
  - Separate long-lived entity definitions from record-data lifetimes.
  - Define loading, pagination, bounded caching, eviction, and application-disposal behavior.
  - Clean up subscriptions and stale references; test repeated navigation and application mount/disposal.
- [ ] Define and implement an abstract API for configuring `@bezny/admin` application entities, their data adapters, and their actions.
  - Keep routing, entity context, ordinary UI actions, and command-palette actions driven by the same configuration.
  - Separate entity definitions, adapter/data lifecycle, action execution, and presentation responsibilities; split modules or packages further where needed.
  - Migrate the demo to demonstrate the public abstractions rather than entity-specific infrastructure.
- [ ] Make the admin UI multilingual using an established i18n library—not a custom translation mechanism.
  - Integrate localization into entity labels, action labels, command-palette content, forms, validation feedback, and other entity UI.
  - Distinguish UI translations from multilingual entity content and define adapter/form support for localized content.
  - Support locale switching, fallback behavior, locale-aware formatting, and text direction; test multiple locales.
- [ ] Use `EntityRow` with context menus for entity list rows instead of custom row implementations.
  - Reuse the shared entity action catalog for row context menus, detail actions, and the command palette.
  - Preserve row-target versus selection-target semantics and destructive-action confirmation.
  - Use Radix for context-menu interaction and verify keyboard access, focus behavior, and accessible semantics.
- [ ] Implement entity-list filters, integrated with entity configuration, data adapters, and the command palette.
- [ ] Implement entity-list pagination, integrated with data adapters and the command palette, with consistent behavior when filters change.
