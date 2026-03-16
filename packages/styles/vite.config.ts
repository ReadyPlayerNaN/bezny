import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [
		react(),
		dts({ include: ["src"], exclude: ["src/**/*.test.*", "src/test/**"] }),
	],
	build: {
		cssCodeSplit: true,
		lib: {
			entry: {
				index: resolve(import.meta.dirname, "src/index.ts"),
				theme: resolve(import.meta.dirname, "src/bezny.scss"),
			},
			formats: ["es"],
		},
		rollupOptions: {
			external: ["react", "react-dom"],
			output: {
				assetFileNames: "[name][extname]",
			},
		},
	},
});
