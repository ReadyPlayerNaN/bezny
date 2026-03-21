import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Navbar } from "./Navbar";
import { NavbarCollapse } from "./NavbarCollapse";
import { NavbarToggle } from "./NavbarToggle";

describe("Navbar uncontrolled", () => {
	it("starts collapsed by default", () => {
		render(
			<Navbar>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
	});

	it("expands when NavbarToggle is clicked", async () => {
		const user = userEvent.setup();
		render(
			<Navbar>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		const toggle = screen.getByRole("button");
		await user.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
	});

	it("collapses when NavbarToggle is clicked again", async () => {
		const user = userEvent.setup();
		render(
			<Navbar>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		const toggle = screen.getByRole("button");
		await user.click(toggle);
		await user.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "false");
	});
});

describe("Navbar controlled", () => {
	it("reflects the expanded prop", () => {
		render(
			<Navbar expanded={true} onToggle={() => undefined}>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
	});

	it("calls onToggle with the new value when NavbarToggle is clicked", async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();
		render(
			<Navbar expanded={false} onToggle={onToggle}>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		await user.click(screen.getByRole("button"));
		expect(onToggle).toHaveBeenCalledWith(true);
	});

	it("calls onToggle with false when currently expanded", async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();
		render(
			<Navbar expanded={true} onToggle={onToggle}>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		await user.click(screen.getByRole("button"));
		expect(onToggle).toHaveBeenCalledWith(false);
	});
});

describe("NavbarToggle aria", () => {
	it("has aria-expanded reflecting current state", () => {
		const { rerender } = render(
			<Navbar expanded={false} onToggle={() => undefined}>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");

		rerender(
			<Navbar expanded={true} onToggle={() => undefined}>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");
	});

	it("has aria-controls pointing to the collapse element id", () => {
		render(
			<Navbar>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		const toggle = screen.getByRole("button");
		const collapseId = toggle.getAttribute("aria-controls") ?? "";
		expect(collapseId).toBeTruthy();
		expect(document.getElementById(collapseId)).toBeInTheDocument();
	});

	it("has aria-label for accessibility", () => {
		render(
			<Navbar>
				<NavbarToggle />
				<NavbarCollapse>
					<a href="/home">Home</a>
				</NavbarCollapse>
			</Navbar>,
		);
		expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Toggle navigation");
	});
});
