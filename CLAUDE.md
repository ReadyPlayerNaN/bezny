# Project Rules

## No CJS

This project is ESM-only. Never use CommonJS (`require`, `module.exports`, `.cjs` files) or remove `"type": "module"` from any package.json. Do not introduce any backwards-compatibility technology.
