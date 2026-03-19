import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Column } from "./DataTable";
import { DataTable } from "./DataTable";

type Product = { id: string; name: string; price: number };

const columns: Column<Product>[] = [
	{ key: "name", header: "Name", render: (row) => row.name },
	{ key: "price", header: "Price", render: (row) => `$${row.price}` },
];

const rows: Product[] = [
	{ id: "1", name: "Apple", price: 1 },
	{ id: "2", name: "Banana", price: 2 },
];

const getRowKey = (row: Product) => row.id;

describe("DataTable", () => {
	it("renders table with columns and rows", () => {
		render(<DataTable columns={columns} getRowKey={getRowKey} rows={rows} />);
		expect(screen.getByRole("table")).toBeInTheDocument();
		expect(screen.getByText("Apple")).toBeInTheDocument();
		expect(screen.getByText("$1")).toBeInTheDocument();
		expect(screen.getByText("Banana")).toBeInTheDocument();
		expect(screen.getByText("$2")).toBeInTheDocument();
	});

	it("renders correct headers", () => {
		render(<DataTable columns={columns} getRowKey={getRowKey} rows={rows} />);
		expect(screen.getByText("Name")).toBeInTheDocument();
		expect(screen.getByText("Price")).toBeInTheDocument();
		const columnHeaders = screen.getAllByRole("columnheader");
		expect(columnHeaders).toHaveLength(2);
		expect(columnHeaders[0]).toHaveTextContent("Name");
		expect(columnHeaders[1]).toHaveTextContent("Price");
	});

	it("uses getRowKey for row keys", () => {
		const getRowKeySpy = vi.fn((row: Product) => row.id);
		render(<DataTable columns={columns} getRowKey={getRowKeySpy} rows={rows} />);
		expect(getRowKeySpy).toHaveBeenCalledTimes(2);
		expect(getRowKeySpy).toHaveBeenCalledWith(rows[0]);
		expect(getRowKeySpy).toHaveBeenCalledWith(rows[1]);
	});

	it("renders footer row when totalsRow provided", () => {
		const totalsRow = ["Total", "$3"];
		render(<DataTable columns={columns} getRowKey={getRowKey} rows={rows} totalsRow={totalsRow} />);
		const table = screen.getByRole("table");
		const tfoot = table.querySelector("tfoot");
		expect(tfoot).toBeInTheDocument();
		expect(screen.getByText("Total")).toBeInTheDocument();
		expect(screen.getByText("$3")).toBeInTheDocument();
	});

	it("renders empty state when rows is empty", () => {
		render(<DataTable columns={columns} getRowKey={getRowKey} rows={[]} />);
		expect(screen.getByText("No data")).toBeInTheDocument();
	});

	it("does not render tfoot when no totalsRow", () => {
		render(<DataTable columns={columns} getRowKey={getRowKey} rows={rows} />);
		const table = screen.getByRole("table");
		expect(table.querySelector("tfoot")).not.toBeInTheDocument();
	});
});
