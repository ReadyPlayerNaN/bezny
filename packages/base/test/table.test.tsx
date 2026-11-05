// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Table,
  TableCaption,
  TableHead,
  TableBody,
  TableFoot,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableScrollArea,
  TableSkeletonRow,
} from "../src/index.js";

const SortableComparison = () => {
  const [ascending, setAscending] = useState(true);
  return (
    <Table>
      <TableCaption>Expected and actual scores</TableCaption>
      <TableHead>
        <TableRow>
          <TableHeaderCell
            numeric
            aria-sort={ascending ? "ascending" : "descending"}
          >
            <button type="button" onClick={() => setAscending(!ascending)}>
              Expected
            </button>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell numeric>0.82</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

describe(Table, () => {
  afterEach(cleanup);

  it("preserves native caption, column and row headers, numeric cells, and totals", () => {
    const ref = createRef<HTMLTableElement>();
    render(
      <Table ref={ref} className="custom">
        <TableCaption>Benchmark comparison</TableCaption>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Pair</TableHeaderCell>
            <TableHeaderCell numeric>Delta</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableHeaderCell scope="row">Candidate A</TableHeaderCell>
            <TableCell numeric>-0.12</TableCell>
          </TableRow>
        </TableBody>
        <TableFoot>
          <TableRow>
            <TableHeaderCell scope="row">Total</TableHeaderCell>
            <TableCell numeric>-0.12</TableCell>
          </TableRow>
        </TableFoot>
      </Table>
    );
    expect(ref.current).toBe(
      screen.getByRole("table", { name: "Benchmark comparison" })
    );
    expect(ref.current?.classList.contains("custom")).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Delta" }).getAttribute("scope")
    ).toBe("col");
    expect(
      screen
        .getByRole("rowheader", { name: "Candidate A" })
        .getAttribute("scope")
    ).toBe("row");
    expect(
      screen.getAllByRole("cell").map((cell) => cell.dataset.numeric)
    ).toStrictEqual(["true", "true"]);
  });

  it("forwards cell refs, header associations, colspan, and native content", () => {
    const ref = createRef<HTMLTableCellElement>();
    render(
      <Table aria-label="Salary statistics">
        <TableHead>
          <TableRow>
            <TableHeaderCell id="position">Position</TableHeaderCell>
            <TableHeaderCell id="median">Median</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell
              ref={ref}
              colSpan={2}
              headers="position median"
              className="custom"
            >
              No salaries
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(ref.current).toBe(screen.getByRole("cell", { name: "No salaries" }));
    expect(ref.current?.colSpan).toBe(2);
    expect(ref.current?.headers).toBe("position median");
    expect(ref.current?.classList.contains("custom")).toBeTruthy();
    expect(ref.current?.dataset.numeric).toBeUndefined();
  });

  it("leaves sorting and keyboard activation to caller-owned native controls", async () => {
    const user = userEvent.setup();
    render(<SortableComparison />);
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Expected" })
    );
    await user.keyboard("{Enter}");
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe(
      "descending"
    );
    await user.keyboard(" ");
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe(
      "ascending"
    );
  });

  it("makes the named scroll region keyboard reachable without changing the table role", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLElement>();
    render(
      <TableScrollArea ref={ref} label="Comparison scroll area">
        <Table aria-label="Comparison" />
      </TableScrollArea>
    );
    await user.tab();
    expect(ref.current).toBe(
      screen.getByRole("region", { name: "Comparison scroll area" })
    );
    expect(document.activeElement).toBe(ref.current);
    expect(
      within(screen.getByRole("region")).getByRole("table", {
        name: "Comparison",
      })
    ).toBeTruthy();
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("keeps loading placeholders inside valid table rows and hides fake cells", () => {
    const { container, rerender } = render(
      <Table aria-label="Scoring" aria-busy="true">
        <TableBody>
          <TableSkeletonRow columns={3} />
        </TableBody>
      </Table>
    );
    expect(container.querySelectorAll("table > tbody > tr > td")).toHaveLength(
      3
    );
    expect(screen.queryByRole("cell")).toBeNull();
    expect(screen.getByRole("table").getAttribute("aria-busy")).toBe("true");
    rerender(
      <Table aria-label="Scoring" aria-busy="false">
        <TableBody>
          <TableRow>
            <TableCell>Ready</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole("cell", { name: "Ready" })).toBeTruthy();
    expect(container.querySelector("[aria-hidden=true]")).toBeNull();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid column count %s",
    (columns) => {
      expect(() =>
        render(
          <Table>
            <TableBody>
              <TableSkeletonRow columns={columns} />
            </TableBody>
          </Table>
        )
      ).toThrow(RangeError);
    }
  );
});
