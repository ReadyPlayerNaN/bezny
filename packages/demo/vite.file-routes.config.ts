import { defineConfig, mergeConfig } from "vitest/config";

import configuration from "./vite.config.js";

export default mergeConfig(
  configuration,
  defineConfig({
    resolve: {
      alias: {
        "@bezny/admin/application": new URL(
          "test/file-route-application.ts",
          import.meta.url
        ).pathname,
      },
    },
  })
);
