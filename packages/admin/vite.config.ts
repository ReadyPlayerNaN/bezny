import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "vite";

const manifest = JSON.parse(
  readFileSync(new URL("package.json", import.meta.url), "utf-8")
) as { exports: Record<string, { types?: string }> };
const entries = Object.values(manifest.exports).flatMap((entry) =>
  entry.types ? [entry.types.replace("./dist/", "").replace(".d.ts", "")] : []
);

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      cssFileName: "style",
      entry: Object.fromEntries(
        entries.map((name) => [
          name,
          path.resolve(
            import.meta.dirname,
            `src/${name}.${existsSync(path.resolve(import.meta.dirname, `src/${name}.tsx`)) ? "tsx" : "ts"}`
          ),
        ])
      ),
      fileName: (_format, name) => `${name}.js`,
      formats: ["es"],
    },
    rolldownOptions: {
      external:
        /^(?:@bezny\/base|@tanstack\/react-router|@radix-ui\/react-[\w-]+|react|react-dom|react-hook-form|lucide-react|jotai|i18next|react-i18next|cmdk)(?:\/.*)?$/u,
    },
    sourcemap: true,
  },
});
