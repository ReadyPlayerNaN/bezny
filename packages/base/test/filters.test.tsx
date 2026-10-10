// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ChoiceFilter,
  FilterBadge,
  Filters,
  TagFilter,
  ValueFilter,
} from "../src/index.js";

const options = [
  { label: "Alpha", value: "a" },
  { label: "Bravo", value: "b" },
  { disabled: true, label: "Disabled", value: "disabled" },
];
const TagExample = () => {
  const [value, setValue] = useState<string[]>([]);
  return (
    <TagFilter
      label="Tags"
      value={value}
      onChange={setValue}
      options={options}
    />
  );
};
const FiltersExample = () => {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Filters
      items={[
        {
          active: Boolean(value),
          key: "owner",
          label: "Owner",
          render: ({ autoOpen }) => (
            <ValueFilter
              label="Owner"
              value={value}
              onChange={setValue}
              autoOpen={autoOpen}
            />
          ),
        },
      ]}
    />
  );
};
describe(Filters, () => {
  afterEach(cleanup);

  it("preserves selected-state badge semantics and disabled behavior", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn<() => void>();
    render(
      <FilterBadge label="Active" selected disabled onClick={handleClick} />
    );
    const badge = screen.getByRole("button", { name: "Active" });
    expect(badge.getAttribute("aria-pressed")).toBe("true");
    await user.click(badge);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("applies trimmed drafts with Enter and restores focus; Clear returns null", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn<(value: string | null) => void>();
    render(<ValueFilter label="Owner" value={null} onChange={handleChange} />);
    await user.click(screen.getByRole("button", { name: "Owner: All" }));
    const input = await screen.findByRole("textbox", { name: "Owner" });
    await user.type(input, "  Ada  {Enter}");
    expect(handleChange).toHaveBeenCalledWith("Ada");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Owner: All" })
    );
    await user.click(screen.getByRole("button", { name: "Owner: All" }));
    await user.click(await screen.findByRole("button", { name: "Clear" }));
    expect(handleChange).toHaveBeenLastCalledWith(null);
  });

  it("bounds a value filter's draft through its native input maximum", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn<(value: string | null) => void>();
    render(
      <ValueFilter
        label="Owner"
        value={null}
        maxLength={3}
        onChange={handleChange}
      />
    );
    await user.click(screen.getByRole("button", { name: "Owner: All" }));
    await user.type(
      await screen.findByRole("textbox", { name: "Owner" }),
      "Adaline{Enter}"
    );
    expect(handleChange).toHaveBeenCalledWith("Ada");
  });

  it("discards uncommitted drafts on Escape and reflects external values", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn<(value: string | null) => void>();
    const { rerender } = render(
      <ValueFilter label="Owner" value="Ada" onChange={handleChange} />
    );
    await user.click(screen.getByRole("button", { name: "Owner: Ada" }));
    await user.type(
      await screen.findByRole("textbox", { name: "Owner" }),
      "Edited"
    );
    await user.keyboard("{Escape}");
    expect(handleChange).not.toHaveBeenCalled();
    rerender(
      <ValueFilter label="Owner" value="Grace" onChange={handleChange} />
    );
    await user.click(screen.getByRole("button", { name: "Owner: Grace" }));
    expect(
      (screen.getByRole("textbox", { name: "Owner" }) as HTMLInputElement).value
    ).toBe("Grace");
  });

  it("searches choices, selects string values, and excludes disabled choices", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn<(value: string | null) => void>();
    render(
      <ChoiceFilter
        label="Mode"
        value={null}
        onChange={handleChange}
        options={options}
      />
    );
    await user.click(screen.getByRole("button", { name: "Mode: All" }));
    await user.type(
      await screen.findByRole("textbox", { name: "Filter values" }),
      "Br"
    );
    expect(screen.queryByRole("radio", { name: "Alpha" })).toBeNull();
    await user.click(screen.getByRole("radio", { name: "Bravo" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await user.click(screen.getByRole("button", { name: "Mode: All" }));
    await user.click(await screen.findByRole("radio", { name: "Disabled" }));
    expect(handleChange).toHaveBeenCalledExactlyOnceWith("b");
  });

  it("keeps multi-select open, summarizes tags, and clears all", async () => {
    const user = userEvent.setup();
    render(<TagExample />);
    await user.click(screen.getByRole("button", { name: "Tags: All" }));
    await user.click(await screen.findByRole("checkbox", { name: "Alpha" }));
    await user.click(screen.getByRole("checkbox", { name: "Bravo" }));
    expect(
      screen.getByRole("button", { name: "Tags: 2 selected" })
    ).toBeTruthy();
    await user.click(screen.getByRole("checkbox", { name: "All" }));
    expect(
      screen
        .getByRole("checkbox", { name: "Alpha" })
        .getAttribute("aria-checked")
    ).toBe("false");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("stages inactive filters, transfers focus, and persists active filters", async () => {
    const user = userEvent.setup();
    render(<FiltersExample />);
    await user.click(screen.getByRole("button", { name: "Filter" }));
    await user.click(await screen.findByRole("button", { name: "Owner" }));
    const input = await screen.findByRole("textbox", { name: "Owner" });
    await waitFor(() => expect(document.activeElement).toBe(input));
    await user.type(input, "Ada{Enter}");
    await screen.findByRole("button", { name: "Owner: Ada" });
    expect(
      (screen.getByRole("button", { name: "Filter" }) as HTMLButtonElement)
        .disabled
    ).toBeTruthy();
  });
});
