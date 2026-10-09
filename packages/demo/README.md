# @bezny/demo

Private Vite application showcasing `@bezny/base` headings, icons, and button variants, sizes, and states. The primary button updates a live click counter.

## Development

From the repository root:

```sh
pnpm install
pnpm --filter @bezny/demo dev
```

The dev script builds `@bezny/base` first, then starts the Vite dev server. Open the local URL printed by Vite (normally `http://localhost:5173`). Demo edits update through Vite; rebuild `@bezny/base` after changing its source to refresh the consumed library assets.

## Verification

```sh
pnpm --filter @bezny/base build
pnpm --filter @bezny/demo build
pnpm --filter @bezny/demo typecheck
pnpm --filter @bezny/demo test
```

The root build, typecheck, and test pipelines include this package and build its workspace dependencies automatically.
