# Project Rules

## No CJS

This project is ESM-only. Never use CommonJS (`require`, `module.exports`, `.cjs` files) or remove `"type": "module"` from any package.json. Do not introduce any backwards-compatibility technology.

## No getComputedStyle for animations

Never use `getComputedStyle` for animation or transition concerns. Use CSS-only solutions (`@starting-style`, `transition-behavior: allow-discrete`) instead.
