import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
	integrations: [
		starlight({
			title: "bezny",
			sidebar: [
				{ slug: "index" },
				{
					label: "Buttons",
					items: [{ slug: "buttons/usage" }, { slug: "buttons/api" }],
				},
			],
			customCss: ["@bezny/styles/theme.css", "@bezny/button/index.css"],
		}),
		react(),
	],
});
