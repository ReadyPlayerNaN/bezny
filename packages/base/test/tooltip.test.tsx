// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../src/index.js";

describe(Tooltip, () => {
  afterEach(cleanup);

  it("describes the focused trigger and dismisses on Escape", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Details</Button>
          </TooltipTrigger>
          <TooltipContent>More information</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    await user.tab();
    const tooltip = await screen.findByRole("tooltip");
    expect(
      screen
        .getByRole("button", { name: "Details" })
        .getAttribute("aria-describedby")
    ).toBe(tooltip.id);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Details" })
    );
  });

  it("opens on hover and reports controlled open changes on activation", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn<(open: boolean) => void>();
    const { rerender } = render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>Details</TooltipTrigger>
          <TooltipContent>More information</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    await user.hover(screen.getByRole("button", { name: "Details" }));
    await screen.findByRole("tooltip");
    rerender(
      <TooltipProvider>
        <Tooltip open onOpenChange={handleOpenChange}>
          <TooltipTrigger>Details</TooltipTrigger>
          <TooltipContent>More information</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
