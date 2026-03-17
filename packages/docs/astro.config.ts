import { resolve } from "node:path";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
	integrations: [mdx(), react()],
	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					loadPaths: [resolve(import.meta.dirname, "../core/src")],
				},
			},
		},
	},
});
