import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		cssCodeSplit: true,
		lib: {
			entry: {
				"theme-dark": resolve(import.meta.dirname, "src/theme-dark.scss"),
				"theme-light": resolve(import.meta.dirname, "src/theme-light.scss"),
			},
			formats: ["es"],
		},
		rollupOptions: {
			output: {
				assetFileNames: "[name][extname]",
			},
		},
	},
});
