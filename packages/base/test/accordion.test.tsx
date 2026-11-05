// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from "../src/index.js";

const Items = () => (
  <>
    <AccordionItem value="first">
      <AccordionHeader>
        <AccordionTrigger>First</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>First body</AccordionContent>
    </AccordionItem>
    <AccordionItem value="disabled" disabled>
      <AccordionHeader>
        <AccordionTrigger>Disabled</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>Disabled body</AccordionContent>
    </AccordionItem>
    <AccordionItem value="last">
      <AccordionHeader>
        <AccordionTrigger>Last</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>Last body</AccordionContent>
    </AccordionItem>
  </>
);
const Controlled = () => {
  const [value, setValue] = useState("first");
  return (
    <>
      <button type="button" onClick={() => setValue("last")}>
        External
      </button>
      <Accordion
        type="single"
        collapsible
        value={value}
        onValueChange={setValue}
      >
        <Items />
      </Accordion>
      <output aria-label="Value">{value}</output>
    </>
  );
};
const PersistedForm = ({
  save,
}: {
  save: (values: { draft: string }) => void;
}) => {
  const form = useForm({
    defaultValues: { draft: "" },
    shouldUnregister: true,
  });
  return (
    <form onSubmit={form.handleSubmit(save)}>
      <Accordion type="single" collapsible defaultValue="draft">
        <AccordionItem value="draft">
          <AccordionHeader>
            <AccordionTrigger>Draft</AccordionTrigger>
          </AccordionHeader>
          <AccordionContent forceMount>
            <input aria-label="Draft text" {...form.register("draft")} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <button type="submit">Save</button>
    </form>
  );
};

describe(Accordion, () => {
  afterEach(cleanup);

  it("provides labelled regions, heading structure and controlled external updates", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    expect(
      screen.getByRole("heading", { level: 3, name: "First" })
    ).toBeTruthy();
    expect(screen.getByRole("region", { name: "First" }).textContent).toBe(
      "First body"
    );
    await user.click(screen.getByRole("button", { name: "External" }));
    expect(screen.getByRole("region", { name: "Last" }).textContent).toBe(
      "Last body"
    );
    await user.click(screen.getByRole("button", { name: "Last" }));
    expect(screen.getByLabelText("Value").textContent).toBe("");
  });

  it("uses Radix Arrow/Home/End navigation, skips disabled items, and toggles via Enter/Space", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <Items />
      </Accordion>
    );
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });
    first.focus();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(last);
    await user.keyboard("{Enter}");
    expect(last.getAttribute("aria-expanded")).toBe("true");
    await user.keyboard(" ");
    expect(last.getAttribute("aria-expanded")).toBe("false");
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(first);
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(last);
  });

  it("supports multiple open sections independently", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple" defaultValue={["first"]}>
        <Items />
      </Accordion>
    );
    await user.click(screen.getByRole("button", { name: "Last" }));
    expect(screen.getAllByRole("region")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "First" }));
    expect(screen.getByRole("region").textContent).toBe("Last body");
  });

  it("keeps non-collapsible selection open and respects disabled roots", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Accordion type="single" defaultValue="first">
        <Items />
      </Accordion>
    );
    const first = screen.getByRole("button", { name: "First" });
    await user.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");
    rerender(
      <Accordion type="single" disabled>
        <Items />
      </Accordion>
    );
    await user.click(screen.getByRole("button", { name: "Last" }));
    expect(
      screen.getByRole("button", { name: "Last" }).hasAttribute("disabled")
    ).toBeTruthy();
    expect(first.getAttribute("aria-expanded")).toBe("true");
  });

  it("retains RHF registration and unsaved DOM values when force-mounted bodies close", async () => {
    const user = userEvent.setup();
    const save = vi.fn<(values: { draft: string }) => void>();
    render(<PersistedForm save={save} />);
    const input = screen.getByRole("textbox", { name: "Draft text" });
    await user.type(input, "unsaved");
    await user.click(screen.getByRole("button", { name: "Draft" }));
    expect(input.closest('[data-state="closed"]')).toBeTruthy();
    expect(document.contains(input)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(save.mock.calls[0]?.[0]).toStrictEqual({ draft: "unsaved" });
    await user.click(screen.getByRole("button", { name: "Draft" }));
    expect(screen.getByRole("textbox", { name: "Draft text" })).toBe(input);
    expect((input as HTMLInputElement).value).toBe("unsaved");
  });

  it("forwards refs, classes, events and asChild heading composition", async () => {
    const user = userEvent.setup();
    const root = createRef<HTMLDivElement>();
    const trigger = createRef<HTMLButtonElement>();
    const clicked = vi.fn<() => void>();
    render(
      <Accordion type="single" collapsible ref={root} className="root-class">
        <AccordionItem value="a">
          <AccordionHeader asChild>
            <h2>
              <AccordionTrigger
                asChild
                ref={trigger}
                className="trigger-class"
                onClick={clicked}
              >
                <button type="button">Heading</button>
              </AccordionTrigger>
            </h2>
          </AccordionHeader>
          <AccordionContent>Body</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    expect(root.current?.classList.contains("root-class")).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2 }).contains(trigger.current)
    ).toBeTruthy();
    expect(trigger.current?.classList.contains("trigger-class")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Heading" }));
    expect(clicked).toHaveBeenCalledOnce();
    expect(trigger.current?.getAttribute("aria-expanded")).toBe("true");
  });

  it("preserves horizontal RTL key behavior", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" orientation="horizontal" dir="rtl">
        <Items />
      </Accordion>
    );
    const first = screen.getByRole("button", { name: "First" });
    first.focus();
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Last" })
    );
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(first);
  });
});
