import { defineConfig } from "vitest/config";

import { editorialAuthPlugin } from "./server/editorial-auth-plugin.js";

export default defineConfig({
  plugins: [editorialAuthPlugin()],
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.tsx"],
    setupFiles: ["test/browser-environment.ts"],
  },
});
