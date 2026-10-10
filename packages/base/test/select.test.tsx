// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../src/index.js";

describe(Select, () => {
  afterEach(cleanup);

  it("selects by keyboard, skips disabled options, submits native values, and restores focus", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: string) => void>();
    const ref = createRef<HTMLButtonElement>();
    render(
      <form aria-label="Settings">
        <Select
          name="plan"
          defaultValue="basic"
          onValueChange={handleValueChange}
        >
          <SelectTrigger ref={ref} aria-label="Plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="disabled" disabled>
              Disabled
            </SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
          </SelectContent>
        </Select>
      </form>
    );
    await user.tab();
    await user.keyboard("{Enter}");
    await screen.findByRole("listbox");
    await user.keyboard("{End}");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("option", { name: "Pro" })
      )
    );
    await user.keyboard("{Enter}");
    expect(handleValueChange).toHaveBeenCalledWith("pro");
    await waitFor(() => expect(document.activeElement).toBe(ref.current));
    expect(
      new FormData(
        screen.getByRole("form", { name: "Settings" }) as HTMLFormElement
      ).get("plan")
    ).toBe("pro");
  });

  it("supports controlled values and disabled roots", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn<(value: string) => void>();
    const { rerender } = render(
      <Select value="basic" onValueChange={handleValueChange} disabled>
        <SelectTrigger aria-label="Plan">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="basic">Basic</SelectItem>
        </SelectContent>
      </Select>
    );
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).toBeNull();
    rerender(
      <Select value="pro">
        <SelectTrigger aria-label="Plan">
          <SelectValue>Pro</SelectValue>
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByRole("combobox").textContent).toContain("Pro");
  });

  it("dismisses on Escape and keeps an explicit portal container", async () => {
    const user = userEvent.setup();
    const container = document.createElement("div");
    container.className = "bezny-dark";
    document.body.append(container);
    render(
      <Select>
        <SelectTrigger aria-label="Plan">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent container={container}>
          <SelectItem value="basic">Basic</SelectItem>
        </SelectContent>
      </Select>
    );
    await user.tab();
    await user.keyboard("{Enter}");
    const listbox = await screen.findByRole("listbox");
    expect(container.contains(listbox)).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole("combobox"));
    container.remove();
  });
});
