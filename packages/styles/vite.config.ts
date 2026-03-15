import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		cssCodeSplit: true,
		lib: {
			entry: {
				theme: resolve(import.meta.dirname, "src/bezny.scss"),
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
