// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../src/index.js";

const Panels = () => (
  <>
    <TabsList aria-label="Editor">
      <TabsTrigger value="first">First</TabsTrigger>
      <TabsTrigger disabled value="disabled">
        Disabled
      </TabsTrigger>
      <TabsTrigger value="last">Last</TabsTrigger>
    </TabsList>
    <TabsContent value="first">First panel</TabsContent>
    <TabsContent value="last">Last panel</TabsContent>
  </>
);
const Controlled = () => {
  const [value, setValue] = useState("first");
  return (
    <>
      <button type="button" onClick={() => setValue("last")}>
        External
      </button>
      <Tabs value={value} onValueChange={setValue}>
        <Panels />
      </Tabs>
      <output aria-label="Active">{value}</output>
    </>
  );
};

describe(Tabs, () => {
  afterEach(cleanup);

  it("associates selected tabs with labelled panels and controlled external values", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const first = screen.getByRole("tab", { name: "First" });
    const panel = screen.getByRole("tabpanel", { name: "First" });
    expect(first.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(first.id);
    await user.click(screen.getByRole("button", { name: "External" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("Last panel");
    await user.click(first);
    expect(screen.getByLabelText("Active").textContent).toBe("first");
  });

  it("uses automatic Arrow/Home/End activation and skips disabled tabs", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="first">
        <Panels />
      </Tabs>
    );
    const first = screen.getByRole("tab", { name: "First" });
    const last = screen.getByRole("tab", { name: "Last" });
    first.focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(last.getAttribute("aria-selected")).toBe("true")
    );
    expect(document.activeElement).toBe(last);
    await user.keyboard("{Home}");
    await waitFor(() => expect(document.activeElement).toBe(first));
    await user.keyboard("{End}");
    await waitFor(() => expect(document.activeElement).toBe(last));
  });

  it("retains selected content until Enter/Space in manual activation mode", async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="first" activationMode="manual">
        <Panels />
      </Tabs>
    );
    screen.getByRole("tab", { name: "First" }).focus();
    await user.keyboard("{ArrowRight}");
    const last = screen.getByRole("tab", { name: "Last" });
    await waitFor(() => expect(document.activeElement).toBe(last));
    expect(last.getAttribute("aria-selected")).toBe("false");
    await user.keyboard(" ");
    expect(screen.getByRole("tabpanel").textContent).toBe("Last panel");
  });

  it("supports vertical and RTL direction", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Tabs defaultValue="first" orientation="vertical">
        <Panels />
      </Tabs>
    );
    screen.getByRole("tab", { name: "First" }).focus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("tab", { name: "Last" })
      )
    );
    rerender(
      <Tabs defaultValue="first" dir="rtl">
        <Panels />
      </Tabs>
    );
    screen.getByRole("tab", { name: "First" }).focus();
    await user.keyboard("{ArrowLeft}");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("tab", { name: "Last" })
      )
    );
  });

  it("preserves force-mounted panel state and forwards refs/classes/asChild", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLButtonElement>();
    render(
      <Tabs defaultValue="first">
        <TabsList aria-label="Editor">
          <TabsTrigger value="first" asChild ref={ref} className="custom">
            <button type="button">First</button>
          </TabsTrigger>
          <TabsTrigger value="last">Last</TabsTrigger>
        </TabsList>
        <TabsContent value="first" forceMount>
          <input aria-label="Draft" defaultValue="" />
        </TabsContent>
        <TabsContent value="last">Last panel</TabsContent>
      </Tabs>
    );
    const input = screen.getByRole("textbox");
    await user.type(input, "saved locally");
    await user.click(screen.getByRole("tab", { name: "Last" }));
    expect(document.contains(input)).toBeTruthy();
    expect(input.closest('[data-state="inactive"]')).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "First" }));
    expect(screen.getByRole("textbox")).toBe(input);
    expect((input as HTMLInputElement).value).toBe("saved locally");
    expect(ref.current?.classList.contains("custom")).toBeTruthy();
  });

  it("does not submit forms or activate disabled triggers", async () => {
    const user = userEvent.setup();
    const submit = vi.fn<(event: FormEvent<HTMLFormElement>) => void>((event) =>
      event.preventDefault()
    );
    render(
      <form onSubmit={submit}>
        <Tabs defaultValue="first">
          <Panels />
        </Tabs>
      </form>
    );
    await user.click(screen.getByRole("tab", { name: "Disabled" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("First panel");
    await user.click(screen.getByRole("tab", { name: "Last" }));
    expect(submit).not.toHaveBeenCalled();
  });
});
