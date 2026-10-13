import path from "node:path";

import { defineConfig } from "vitest/config";

import { externalSelectViewportStyles } from "./select-viewport-styles.js";

// These entry points reach Radix's private scroll-lock integration. Bundle them
// so the shipped package, not the host's resolver, owns the CSP-compatible adapter.
const modalPrimitives = new Set([
  "@radix-ui/react-alert-dialog",
  "@radix-ui/react-context-menu",
  "@radix-ui/react-dialog",
  "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-menu",
  "@radix-ui/react-popover",
  "@radix-ui/react-select",
]);
const externalDependencies =
  /^(?:react|react-dom|react-hook-form|lucide-react|@radix-ui\/react-[\w-]+)(?:\/.*)?$/u;

export default defineConfig({
  build: {
    lib: {
      cssFileName: "style",
      entry: path.resolve(import.meta.dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"],
    },
    rolldownOptions: {
      external: (id) =>
        externalDependencies.test(id) && !modalPrimitives.has(id),
    },
    sourcemap: true,
  },
  plugins: [externalSelectViewportStyles()],
  resolve: {
    alias: [
      {
        find: /^react-remove-scroll$/u,
        replacement: path.resolve(
          import.meta.dirname,
          "src/layout/scroll-lock.tsx"
        ),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.tsx"],
    server: {
      deps: {
        inline: [
          /@radix-ui\/react-(?:alert-dialog|context-menu|dialog|dropdown-menu|menu|popover|select)(?:\/|$)/u,
        ],
      },
    },
    setupFiles: ["test/dom-observers.ts"],
  },
});
