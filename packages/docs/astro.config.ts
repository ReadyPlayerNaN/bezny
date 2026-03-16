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
						{ slug: "components/avatar-stack" },
						{ slug: "components/breadcrumbs" },
						{ slug: "components/button" },
						{ slug: "components/card" },
						{ slug: "components/container" },
						{ slug: "components/dialog" },
						{ slug: "components/drawer" },
						{ slug: "components/dropdown" },
						{ slug: "components/heading" },
						{ slug: "components/label" },
						{ slug: "components/navbar" },
						{ slug: "components/overlay" },
						{ slug: "components/paragraph" },
						{ slug: "components/semantic-elements" },
						{ slug: "components/stack" },
					],
				},
			],
			customCss: [
				"@bezny/styles/theme.css",
				"@bezny/alert/index.css",
				"@bezny/avatar/index.css",
				"@bezny/breadcrumbs/index.css",
				"@bezny/button/index.css",
				"@bezny/card/index.css",
				"@bezny/dialog/index.css",
				"@bezny/drawer/index.css",
				"@bezny/dropdown/index.css",
				"@bezny/layout/index.css",
				"@bezny/navbar/index.css",
				"@bezny/overlay/index.css",
				"@bezny/text/index.css",
			],
		}),
		react(),
	],
});
