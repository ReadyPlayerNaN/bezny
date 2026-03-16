// Shade generation curves ported from packages/styles/src/_shade.scss

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export const LIGHTNESS_CURVE: Record<number, number> = {
	50: 0.97,
	100: 0.93,
	200: 0.85,
	300: 0.73,
	400: 0.62,
	500: 0.5,
	600: 0.45,
	700: 0.38,
	800: 0.3,
	900: 0.23,
	950: 0.15,
};

export const CHROMA_CURVE: Record<number, number> = {
	50: 0.1,
	100: 0.25,
	200: 0.4,
	300: 0.65,
	400: 0.85,
	500: 1.0,
	600: 1.0,
	700: 0.9,
	800: 0.75,
	900: 0.6,
	950: 0.4,
};

export function generateShadeProperties(
	name: string,
	hue: number,
	chroma: number,
	prefix = "bzn",
): Record<string, string> {
	const properties: Record<string, string> = {};
	for (const shade of SHADES) {
		const l = LIGHTNESS_CURVE[shade];
		const c = chroma * CHROMA_CURVE[shade];
		properties[`--${prefix}-${name}-${shade}`] = `oklch(${l * 100}% ${c} ${hue})`;
	}
	return properties;
}

export function applyThemeOverrides(primaryHue: number, secondaryHue: number | null, chroma = 0.19): void {
	const el = document.documentElement;
	const primary = generateShadeProperties("primary", primaryHue, chroma);
	for (const [prop, value] of Object.entries(primary)) {
		el.style.setProperty(prop, value);
	}

	const secHue = secondaryHue ?? primaryHue + 60;
	const secondary = generateShadeProperties("secondary", secHue, chroma);
	for (const [prop, value] of Object.entries(secondary)) {
		el.style.setProperty(prop, value);
	}
}

export function clearThemeOverrides(prefix = "bzn"): void {
	const el = document.documentElement;
	for (const shade of SHADES) {
		el.style.removeProperty(`--${prefix}-primary-${shade}`);
		el.style.removeProperty(`--${prefix}-secondary-${shade}`);
	}
}
