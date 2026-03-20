import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { List } from "./List";
import { ListActions } from "./ListActions";
import { ListColumn } from "./ListColumn";

afterEach(cleanup);

type Item = { id: string; name: string; email: string };

const items: Item[] = [
	{ id: "1", name: "Alice", email: "alice@example.com" },
	{ id: "2", name: "Bob", email: "bob@example.com" },
];

describe("List", () => {
	it("renders items with columns", () => {
		render(
			<List data={items} keyOf={(item) => item.id}>
				<ListColumn render={(item: Item) => item.name} />
				<ListColumn render={(item: Item) => item.email} />
			</List>,
		);
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("alice@example.com")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
		expect(screen.getByText("bob@example.com")).toBeInTheDocument();
	});

	it("renders headers when enabled", () => {
		render(
			<List data={items} keyOf={(item) => item.id} headers={true}>
				<ListColumn header="Name" render={(item: Item) => item.name} />
				<ListColumn header="Email" render={(item: Item) => item.email} />
			</List>,
		);
		expect(screen.getByText("Name")).toBeInTheDocument();
		expect(screen.getByText("Email")).toBeInTheDocument();
	});

	it("does not render headers by default", () => {
		render(
			<List data={items} keyOf={(item) => item.id}>
				<ListColumn header="Name" render={(item: Item) => item.name} />
			</List>,
		);
		expect(screen.queryByText("Name")).not.toBeInTheDocument();
	});

	it("renders empty message when data is empty", () => {
		render(
			<List data={[]} keyOf={(item: Item) => item.id} emptyMessage="No items found">
				<ListColumn render={(item: Item) => item.name} />
			</List>,
		);
		expect(screen.getByText("No items found")).toBeInTheDocument();
	});

	it("does not render empty message when data has items", () => {
		render(
			<List data={items} keyOf={(item) => item.id} emptyMessage="No items found">
				<ListColumn render={(item: Item) => item.name} />
			</List>,
		);
		expect(screen.queryByText("No items found")).not.toBeInTheDocument();
	});

	it("renders rows as links when hrefOf is provided", () => {
		render(
			<List data={items} keyOf={(item) => item.id} hrefOf={(item) => `/users/${item.id}`}>
				<ListColumn render={(item: Item) => item.name} />
			</List>,
		);
		const links = screen.getAllByRole("link");
		expect(links).toHaveLength(2);
		expect(links[0]).toHaveAttribute("href", "/users/1");
		expect(links[1]).toHaveAttribute("href", "/users/2");
	});

	it("renders rows as buttons when onRowClick is provided", async () => {
		const user = userEvent.setup();
		const onRowClick = vi.fn();
		render(
			<List data={items} keyOf={(item) => item.id} onRowClick={onRowClick}>
				<ListColumn render={(item: Item) => item.name} />
			</List>,
		);
		const buttons = screen.getAllByRole("button");
		expect(buttons).toHaveLength(2);
		await user.click(buttons[0]);
		expect(onRowClick).toHaveBeenCalledWith(items[0]);
	});

	it("renders rows as divs when no hrefOf or onRowClick", () => {
		render(
			<List data={items} keyOf={(item) => item.id}>
				<ListColumn render={(item: Item) => item.name} />
			</List>,
		);
		expect(screen.queryAllByRole("link")).toHaveLength(0);
		expect(screen.queryAllByRole("button")).toHaveLength(0);
	});

	it("renders actions column", () => {
		render(
			<List data={items} keyOf={(item) => item.id}>
				<ListColumn render={(item: Item) => item.name} />
				<ListActions render={(item: Item) => <button type="button">Delete {item.name}</button>} />
			</List>,
		);
		expect(screen.getByText("Delete Alice")).toBeInTheDocument();
		expect(screen.getByText("Delete Bob")).toBeInTheDocument();
	});

	it("renders reloading indicator", () => {
		const { container } = render(
			<List data={items} keyOf={(item) => item.id} status="reloading">
				<ListColumn render={(item: Item) => item.name} />
			</List>,
		);
		expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument();
	});

	it("uses custom link component when provided", () => {
		const CustomLink = ({
			to,
			children,
			className,
		}: {
			to: string;
			children?: React.ReactNode;
			className?: string;
		}) => (
			<a href={to} className={className} data-custom-link={true}>
				{children}
			</a>
		);
		render(
			<List data={items} keyOf={(item) => item.id} hrefOf={(item) => `/users/${item.id}`} linkComponent={CustomLink}>
				<ListColumn render={(item: Item) => item.name} />
			</List>,
		);
		const links = screen.getAllByRole("link");
		expect(links).toHaveLength(2);
		expect(links[0]).toHaveAttribute("data-custom-link");
	});
});
