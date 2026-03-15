# Design: `@bezny/docs` with Starlight

## Context

The bezny monorepo needs a documentation site. We're replacing the Docusaurus-based `@bezny/docs` with Starlight (Astro + Vite), which is ESM-native and avoids the CJS/Webpack issues Docusaurus has.

The docs site features live interactive (editable) component previews, starting with `@bezny/button` as proof of concept.

## Key Decisions

- **Starlight + `@astrojs/react`** — Vite-native, ESM-only, React components via island architecture
- **`react-live`** for editable live previews — custom `<LivePreview>` React component rendered as client island
- **Auto-injected scope** — `BeznyProvider` wrapper and component imports are hidden from the editor; users only see component usage code
- **Layout:** preview on top, editor below
- **Consume built artifacts** (`dist/`) from `@bezny/button` and `@bezny/styles`
- **Global CSS** via Starlight's `customCss` config — imports `@bezny/styles/theme-light.css` and `@bezny/button/index.css`
- **Version `0.1.0`**, `private: true`, `type: "module"`

## Architecture

### Live Preview Component

`src/components/LivePreview.tsx` — a React component that:

1. Wraps `react-live`'s `LiveProvider`, `LiveEditor`, `LivePreview`, `LiveError`
2. Pre-injects `Button`, `Submit` into the live scope
3. Auto-wraps the preview output in `<div data-theme="light">` (BeznyProvider)
4. Renders preview on top, editor below
5. Used in MDX as `<LivePreview client:load code="..." />`

### CSS Strategy

Starlight's `customCss` config option accepts package imports. No custom CSS file needed:

```ts
starlight({
  customCss: [
    "@bezny/styles/theme-light.css",
    "@bezny/button/index.css",
  ],
})
```

### Content Structure

```
src/content/docs/
  index.md          — Getting started (landing page)
  buttons/
    usage.mdx       — Live interactive examples
    api.mdx         — Props tables
```

### Sidebar

```
- Introduction (index)
- Buttons (category)
  - Usage
  - API Reference
```

## File List

```
packages/docs/
  package.json          — @bezny/docs, private, type:module
  astro.config.ts       — Starlight + React integrations, port 4300
  tsconfig.json         — extends base, Astro-compatible settings
  biome.json            — extends frontend config, includes src/** + docs config files
  src/
    components/
      LivePreview.tsx   — react-live wrapper, client island
    content/
      docs/
        index.md        — Getting started
        buttons/
          usage.mdx     — Live examples
          api.mdx       — API reference / props tables
```

## Dependencies

### Runtime
- `@astrojs/starlight`
- `@astrojs/react`
- `@bezny/button` (workspace:*)
- `@bezny/styles` (workspace:*)
- `react` (catalog:)
- `react-dom` (catalog:)
- `react-live`

### Dev
- `astro`
- `@types/react` (catalog:)
- `@types/react-dom` (catalog:)
- `typescript` (catalog:)
