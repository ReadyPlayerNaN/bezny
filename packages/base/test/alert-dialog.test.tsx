// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "../src/index.js";

describe(AlertDialog, () => {
  afterEach(cleanup);

  it("focuses cancel, blocks outside dismissal, and restores focus on cancellation", async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete record?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogAction asChild>
            <Button variant="critical">Confirm</Button>
          </AlertDialogAction>
          <AlertDialogCancel asChild>
            <Button variant="secondary">Cancel</Button>
          </AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await screen.findByRole("alertdialog", { name: "Delete record?" });
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Cancel" })
    );
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Delete" })
    );
  });

  it("reports controlled confirmation requests and can prevent default close", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn<(open: boolean) => void>();
    render(
      <AlertDialog open onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogDescription>Continue?</AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={(event) => event.preventDefault()}>
            Confirm
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    );
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(handleOpenChange).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });
});
