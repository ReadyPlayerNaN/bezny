import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [react(), dts({ include: ["src"] })],
	css: {
		preprocessorOptions: {
			scss: {
				loadPaths: [resolve(import.meta.dirname, "../styles/src")],
			},
		},
	},
	build: {
		cssCodeSplit: true,
		lib: {
			entry: {
				index: resolve(import.meta.dirname, "src/index.ts"),
			},
			formats: ["es"],
		},
		rollupOptions: {
			external: ["react", "react-dom", "clsx", "md5"],
			output: {
				assetFileNames: "[name][extname]",
			},
		},
	},
});
