// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Card,
  CardTitle,
  CardBody,
  CardProperties,
  MultiBlockCard,
} from "../src/index.js";

describe(Card, () => {
  afterEach(cleanup);

  it("composes a semantic section, heading, actions, properties, and native refs", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Card ref={ref} aria-label="Details">
        <CardTitle actions={<button type="button">Edit</button>}>
          Details
        </CardTitle>
        <CardBody>
          <CardProperties>
            <span>Name</span>
            <span>Version</span>
          </CardProperties>
        </CardBody>
      </Card>
    );
    expect(ref.current).toBe(screen.getByRole("region", { name: "Details" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Details" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
    expect(screen.getByText("Version")).toBeTruthy();
  });

  it("separates actual blocks and ignores empty children", () => {
    render(
      <MultiBlockCard>
        <span>First</span>
        {null}
        {false}
        <span>Second</span>
      </MultiBlockCard>
    );
    expect(screen.getAllByRole("separator")).toHaveLength(1);
    expect(screen.getByText("First").parentElement).not.toBe(
      screen.getByText("Second").parentElement
    );
  });
});
