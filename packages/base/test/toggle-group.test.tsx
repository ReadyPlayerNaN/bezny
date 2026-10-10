// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToggleGroup, ToggleGroupItem } from "../src/index.js";

describe(ToggleGroup, () => {
  afterEach(cleanup);

  it("roves focus past disabled items and selects/deselects single values", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: string) => void>();
    render(
      <ToggleGroup
        type="single"
        defaultValue="list"
        onValueChange={handleValueChange}
      >
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="disabled" disabled>
          Disabled
        </ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>
    );
    await user.tab();
    await user.keyboard("{ArrowRight>}");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("radio", { name: "Grid" })
      )
    );
    await user.keyboard("{/ArrowRight}{Enter}");
    expect(handleValueChange).toHaveBeenCalledWith("grid");
    await user.keyboard(" ");
    expect(handleValueChange).toHaveBeenLastCalledWith("");
  });

  it("supports multiple controlled values and disabled groups", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: string[]) => void>();
    const { rerender } = render(
      <ToggleGroup
        type="multiple"
        value={["bold"]}
        onValueChange={handleValueChange}
      >
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>
    );
    await user.click(screen.getByRole("button", { name: "Italic" }));
    expect(handleValueChange).toHaveBeenCalledWith(["bold", "italic"]);
    expect(
      screen
        .getByRole("button", { name: "Italic" })
        .getAttribute("aria-pressed")
    ).toBe("false");
    rerender(
      <ToggleGroup type="multiple" disabled>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      </ToggleGroup>
    );
    expect(
      (screen.getByRole("button", { name: "Bold" }) as HTMLButtonElement)
        .disabled
    ).toBeTruthy();
  });
});
