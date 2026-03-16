const PROPS = ["primary-h", "primary-c", "secondary-h", "secondary-c"] as const;

export function applyThemeOverrides(primaryHue: number, secondaryHue: number | null, chroma = 0.19): void {
	const secHue = secondaryHue ?? primaryHue + 60;
	const el = document.documentElement;
	el.style.setProperty("--bzn-primary-h", String(primaryHue));
	el.style.setProperty("--bzn-primary-c", String(chroma));
	el.style.setProperty("--bzn-secondary-h", String(secHue));
	el.style.setProperty("--bzn-secondary-c", String(chroma));
}

export function clearThemeOverrides(): void {
	const el = document.documentElement;
	for (const prop of PROPS) {
		el.style.removeProperty(`--bzn-${prop}`);
	}
}
