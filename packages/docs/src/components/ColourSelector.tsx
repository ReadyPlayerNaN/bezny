import { useCallback, useEffect, useRef, useState } from "react";
import { applyThemeOverrides, clearThemeOverrides } from "../lib/shade-generation.js";

const LS_PRIMARY = "bzn-docs-primary-hue";
const LS_SECONDARY = "bzn-docs-secondary-hue";
const LS_OFFSET = "bzn-docs-hue-offset";

const DEFAULT_PRIMARY = 10;
const DEFAULT_OFFSET = 60;
const HUE_OFFSETS = [30, 60, 90, 120, 150, 180] as const;

type HueOffset = (typeof HUE_OFFSETS)[number] | "unlocked";

function parseHueOffset(value: string | null): HueOffset {
	if (value === "unlocked") return "unlocked";
	if (value) {
		const num = Number(value);
		if (HUE_OFFSETS.includes(num as (typeof HUE_OFFSETS)[number])) return num as (typeof HUE_OFFSETS)[number];
	}
	return DEFAULT_OFFSET;
}

function readStorage(): {
	primaryHue: number;
	secondaryHue: number;
	hueOffset: HueOffset;
} {
	const primary = Number(localStorage.getItem(LS_PRIMARY)) || DEFAULT_PRIMARY;
	const hueOffset = parseHueOffset(localStorage.getItem(LS_OFFSET));
	const secondary =
		hueOffset === "unlocked"
			? Number(localStorage.getItem(LS_SECONDARY)) || primary + DEFAULT_OFFSET
			: primary + hueOffset;
	return { primaryHue: primary, secondaryHue: secondary, hueOffset: hueOffset };
}

const sliderTrack: React.CSSProperties = {
	position: "relative",
	height: 24,
	borderRadius: 12,
	background:
		"linear-gradient(to right, oklch(60% 0.15 0), oklch(60% 0.15 30), oklch(60% 0.15 60), oklch(60% 0.15 90), oklch(60% 0.15 120), oklch(60% 0.15 150), oklch(60% 0.15 180), oklch(60% 0.15 210), oklch(60% 0.15 240), oklch(60% 0.15 270), oklch(60% 0.15 300), oklch(60% 0.15 330), oklch(60% 0.15 360))",
};

const sliderInput: React.CSSProperties = {
	position: "absolute",
	inset: 0,
	width: "100%",
	height: "100%",
	margin: 0,
	appearance: "none",
	WebkitAppearance: "none",
	background: "transparent",
	cursor: "pointer",
};

const sliderThumbCss = `
	input[type="range"].bzn-hue-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: white;
		border: 2px solid rgba(0,0,0,0.3);
		box-shadow: 0 1px 3px rgba(0,0,0,0.2);
	}
	input[type="range"].bzn-hue-slider::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: white;
		border: 2px solid rgba(0,0,0,0.3);
		box-shadow: 0 1px 3px rgba(0,0,0,0.2);
	}
`;

export default function ColourSelector() {
	const [primaryHue, setPrimaryHue] = useState(DEFAULT_PRIMARY);
	const [secondaryHue, setSecondaryHue] = useState(DEFAULT_PRIMARY + DEFAULT_OFFSET);
	const [hueOffset, setHueOffset] = useState<HueOffset>(DEFAULT_OFFSET);
	const [open, setOpen] = useState(false);
	const detailsRef = useRef<HTMLDetailsElement>(null);
	const initialized = useRef(false);

	// Hydrate from localStorage on mount
	useEffect(() => {
		const stored = readStorage();
		setPrimaryHue(stored.primaryHue);
		setSecondaryHue(stored.secondaryHue);
		setHueOffset(stored.hueOffset);
		initialized.current = true;
	}, []);

	// Apply overrides whenever values change (skip before hydration)
	useEffect(() => {
		if (!initialized.current) return;
		applyThemeOverrides(primaryHue, secondaryHue);
		localStorage.setItem(LS_PRIMARY, String(primaryHue));
		localStorage.setItem(LS_SECONDARY, String(secondaryHue));
		localStorage.setItem(LS_OFFSET, String(hueOffset));
	}, [primaryHue, secondaryHue, hueOffset]);

	const handlePrimaryChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const hue = Number(e.target.value);
			setPrimaryHue(hue);
			if (hueOffset !== "unlocked") setSecondaryHue(hue + hueOffset);
		},
		[hueOffset],
	);

	const handleSecondaryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSecondaryHue(Number(e.target.value));
	}, []);

	const handleOffsetChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const value = e.target.value;
			if (value === "unlocked") {
				setHueOffset("unlocked");
			} else {
				const offset = Number(value) as (typeof HUE_OFFSETS)[number];
				setHueOffset(offset);
				setSecondaryHue(primaryHue + offset);
			}
		},
		[primaryHue],
	);

	const handleReset = useCallback(() => {
		clearThemeOverrides();
		setPrimaryHue(DEFAULT_PRIMARY);
		setSecondaryHue(DEFAULT_PRIMARY + DEFAULT_OFFSET);
		setHueOffset(DEFAULT_OFFSET);
		localStorage.removeItem(LS_PRIMARY);
		localStorage.removeItem(LS_SECONDARY);
		localStorage.removeItem(LS_OFFSET);
	}, []);

	// Close on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		if (open) document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, [open]);

	return (
		<>
			<style>{sliderThumbCss}</style>
			<details
				ref={detailsRef}
				open={open}
				onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
				style={{ position: "relative", display: "inline-block" }}
			>
				<summary
					style={{
						listStyle: "none",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: 6,
					}}
				>
					<span
						style={{
							display: "inline-block",
							width: 24,
							height: 24,
							borderRadius: "50%",
							background: `oklch(50% 0.19 ${primaryHue})`,
							border: "2px solid var(--bzn-border)",
							verticalAlign: "middle",
						}}
						aria-label="Accent colour selector"
					/>
				</summary>
				<div
					style={{
						position: "absolute",
						right: 0,
						top: "calc(100% + 8px)",
						zIndex: 100,
						background: "var(--bzn-surface)",
						border: "1px solid var(--bzn-border)",
						borderRadius: 8,
						padding: 16,
						width: 260,
						boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
					}}
				>
					<div
						style={{
							fontSize: 13,
							fontWeight: 600,
							marginBottom: 12,
							color: "var(--bzn-text)",
						}}
					>
						Accent colour
					</div>

					<label
						style={{
							fontSize: 12,
							color: "var(--bzn-text-muted)",
							display: "block",
							marginBottom: 4,
						}}
					>
						Primary — {primaryHue}°
					</label>
					<div style={sliderTrack}>
						<input
							type="range"
							min={0}
							max={360}
							value={primaryHue}
							onChange={handlePrimaryChange}
							className="bzn-hue-slider"
							style={sliderInput}
						/>
					</div>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							margin: "10px 0 4px",
						}}
					>
						<label
							style={{
								fontSize: 12,
								color: "var(--bzn-text-muted)",
								flex: 1,
							}}
						>
							Secondary — {Math.round(secondaryHue % 360)}°
						</label>
						<select
							value={hueOffset}
							onChange={handleOffsetChange}
							style={{
								fontSize: 11,
								padding: "1px 4px",
								background: "var(--bzn-surface-raised)",
								color: "var(--bzn-text-muted)",
								border: "1px solid var(--bzn-border)",
								borderRadius: 4,
								cursor: "pointer",
							}}
						>
							{HUE_OFFSETS.map((o) => (
								<option key={o} value={o}>
									+{o}°
								</option>
							))}
							<option value="unlocked">Unlocked</option>
						</select>
					</div>
					<div
						style={{
							...sliderTrack,
							opacity: hueOffset === "unlocked" ? 1 : 0.4,
							pointerEvents: hueOffset === "unlocked" ? "auto" : "none",
						}}
					>
						<input
							type="range"
							min={0}
							max={360}
							value={Math.round(secondaryHue % 360)}
							onChange={handleSecondaryChange}
							disabled={hueOffset !== "unlocked"}
							className="bzn-hue-slider"
							style={sliderInput}
						/>
					</div>

					<button
						type="button"
						onClick={handleReset}
						style={{
							marginTop: 12,
							width: "100%",
							padding: "4px 0",
							fontSize: 12,
							background: "var(--bzn-surface-raised)",
							color: "var(--bzn-text-muted)",
							border: "1px solid var(--bzn-border)",
							borderRadius: 4,
							cursor: "pointer",
						}}
					>
						Reset to default
					</button>
				</div>
			</details>
		</>
	);
}
