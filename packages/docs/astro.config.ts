import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
	integrations: [
		starlight({
			title: "bezny",
			components: {
				SocialIcons: "./src/components/ColourSelector.astro",
			},
			sidebar: [
				{ slug: "index" },
				{
					label: "Theming",
					items: [
						{ slug: "theming/overview" },
						{ slug: "theming/custom-themes" },
						{ slug: "theming/dark-mode" },
					],
				},
				{
					label: "Components",
					items: [
						{ slug: "components" },
						{ slug: "components/alert" },
						{ slug: "components/avatar" },
						{ slug: "components/button" },
						{ slug: "components/dialog" },
						{ slug: "components/layout" },
						{ slug: "components/text" },
					],
				},
			],
			customCss: [
				"@bezny/styles/theme.css",
				"@bezny/alert/index.css",
				"@bezny/avatar/index.css",
				"@bezny/button/index.css",
				"@bezny/dialog/index.css",
				"@bezny/layout/index.css",
				"@bezny/text/index.css",
			],
		}),
		react(),
	],
});
