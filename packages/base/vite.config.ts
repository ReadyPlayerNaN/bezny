import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      cssFileName: "style",
      entry: path.resolve(import.meta.dirname, "src/index.ts"),
      fileName: "index",
      formats: ["es"],
    },
    rolldownOptions: {
      external:
        /^(?:react|react-dom|react-hook-form|lucide-react|@radix-ui\/react-[\w-]+)(?:\/.*)?$/u,
    },
    sourcemap: true,
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.tsx"],
    setupFiles: ["test/dom-observers.ts"],
  },
});
