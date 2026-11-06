// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { FocusEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AutocompleteInput, MultiItemPicker } from "../src/index.js";

interface Item {
  id: string;
  label: string;
  detail?: string;
  disabled?: boolean;
}
const alpha: Item = { detail: "First result", id: "a/b ~", label: "Alpha" };
const beta: Item = { id: "b", label: "Beta" };
const gamma: Item = { id: "c", label: "Gamma" };
const items: Item[] = [
  alpha,
  { disabled: true, id: "blocked", label: "Unavailable" },
  beta,
  gamma,
];
const key = (item: Item) => item.id;
const label = (item: Item) => item.label;
const sublabel = (item: Item) => item.detail;
const disabled = (item: Item) => item.disabled ?? false;
const optionProps = {
  getOptionDisabled: disabled,
  getOptionKey: key,
  getOptionLabel: label,
  getOptionSublabel: sublabel,
  options: items,
};
const Single = () => {
  const [value, setValue] = useState<Item | null>(null);
  const [query, setQuery] = useState("");
  return (
    <>
      <AutocompleteInput
        {...optionProps}
        aria-label="Company"
        value={value}
        onValueChange={setValue}
        query={query}
        onQueryChange={setQuery}
      />
      <button type="button">After</button>
      <output aria-label="Selected">{value?.id ?? "none"}</output>
    </>
  );
};
const Multi = ({ readOnly = false }: { readOnly?: boolean }) => {
  const [value, setValue] = useState<Item[]>([alpha]);
  const [query, setQuery] = useState("");
  return (
    <MultiItemPicker
      {...optionProps}
      aria-label="Skills"
      selectionLabel="Selected skills"
      value={value}
      onValueChange={setValue}
      query={query}
      onQueryChange={setQuery}
      maxItems={2}
      readOnly={readOnly}
    />
  );
};
const Form = ({ save }: { save: (data: { company: Item | null }) => void }) => {
  const form = useForm<{ company: Item | null }>({
    defaultValues: { company: null },
  });
  const [query, setQuery] = useState("");
  return (
    <form noValidate onSubmit={form.handleSubmit(save)}>
      <Controller
        name="company"
        control={form.control}
        rules={{ required: "Choose a company" }}
        render={({ field, fieldState }) => (
          <>
            <AutocompleteInput
              {...optionProps}
              ref={field.ref}
              name={field.name}
              onBlur={() => field.onBlur()}
              value={field.value}
              onValueChange={(option) => field.onChange(option)}
              query={query}
              onQueryChange={setQuery}
              aria-label="Company"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error ? (
              <div role="alert">{fieldState.error.message}</div>
            ) : null}
          </>
        )}
      />
      <button type="submit">Save</button>
      <button
        type="button"
        onClick={() => {
          form.reset();
          setQuery("");
        }}
      >
        Reset
      </button>
    </form>
  );
};

describe(AutocompleteInput, () => {
  afterEach(cleanup);

  it("reports actual popup visibility on dismissal, query limits and availability", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    const props = {
      ...optionProps,
      "aria-label": "Category",
      onOpenChange,
      onQueryChange: vi.fn<(query: string) => void>(),
      onValueChange: vi.fn<(value: Item | null) => void>(),
      query: "a",
      value: null,
    };
    const { rerender } = render(<AutocompleteInput {...props} />);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByRole("combobox"));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await user.keyboard("{ArrowDown}");
    rerender(<AutocompleteInput {...props} query="" />);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    rerender(<AutocompleteInput {...props} />);
    await user.keyboard("{ArrowDown}");
    rerender(<AutocompleteInput {...props} disabled />);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("keeps DOM focus on the input and exposes mounted suggestion IDs", async () => {
    const user = userEvent.setup();
    render(<Single />);
    const input = screen.getByRole("combobox", { name: "Company" });
    await user.type(input, "a");
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute("aria-controls")).toBe(
      screen.getByRole("listbox").id
    );
    const first = screen.getByRole("option", { name: "Alpha First result" });
    expect(input.getAttribute("aria-activedescendant")).toBe(first.id);
    expect(first.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByLabelText("Selected").textContent).toBe("none");
  });

  it("skips disabled suggestions and commits only on Enter", async () => {
    const user = userEvent.setup();
    render(<Single />);
    const input = screen.getByRole("combobox");
    await user.type(input, "a");
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "Beta" }).id
    );
    expect(screen.getByLabelText("Selected").textContent).toBe("none");
    await user.keyboard("{Enter}");
    expect((input as HTMLInputElement).value).toBe("Beta");
    expect(screen.getByLabelText("Selected").textContent).toBe("b");
    expect(input.hasAttribute("aria-activedescendant")).toBeFalsy();
  });

  it("selects by mouse and clears the value without leaving focus on an unmounted button", async () => {
    const user = userEvent.setup();
    render(<Single />);
    const input = screen.getByRole("combobox");
    await user.type(input, "al");
    await user.click(
      screen.getByRole("option", { name: "Alpha First result" })
    );
    expect((input as HTMLInputElement).value).toBe("Alpha");
    expect(document.activeElement).toBe(input);
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect((input as HTMLInputElement).value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("cancels with Escape, preserves native cursor movement and reopens from the last option with ArrowUp", async () => {
    const user = userEvent.setup();
    render(<Single />);
    const input = screen.getByRole("combobox");
    await user.type(input, "al");
    await user.keyboard("{Home}");
    expect((input as HTMLInputElement).selectionStart).toBe(0);
    await user.keyboard("{Escape}");
    expect((input as HTMLInputElement).value).toBe("al");
    expect(screen.queryByRole("listbox")).toBeNull();
    await user.keyboard("{ArrowUp}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "Gamma" }).id
    );
  });

  it("clears a committed selection with Backspace and lets Tab leave without selecting", async () => {
    const user = userEvent.setup();
    render(<Single />);
    const input = screen.getByRole("combobox");
    await user.type(input, "a");
    await user.keyboard("{Enter}{Backspace}");
    expect((input as HTMLInputElement).value).toBe("");
    await user.type(input, "b");
    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "After" })
    );
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByLabelText("Selected").textContent).toBe("none");
  });

  it("does not choose on IME Enter and leaves composition queries under host control", () => {
    const choose = vi.fn<(value: Item | null) => void>();
    const query = vi.fn<(value: string) => void>();
    render(
      <AutocompleteInput
        {...optionProps}
        aria-label="Company"
        value={null}
        onValueChange={choose}
        query="a"
        onQueryChange={query}
      />
    );
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "あ" } });
    fireEvent.keyDown(input, { isComposing: true, key: "Enter" });
    expect(choose).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith("あ");
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(choose).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(choose).toHaveBeenCalledWith(alpha);
  });

  it("reconciles active descendants with replaced remote results without owning a search session", async () => {
    const user = userEvent.setup();
    const choose = vi.fn<(value: Item | null) => void>();
    const query = vi.fn<(value: string) => void>();
    const props = {
      ...optionProps,
      "aria-label": "Company",
      onQueryChange: query,
      onValueChange: choose,
      query: "a",
      value: null,
    };
    const { rerender } = render(<AutocompleteInput {...props} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    rerender(<AutocompleteInput {...props} options={[gamma]} />);
    expect(input.getAttribute("aria-activedescendant")).toBe(
      screen.getByRole("option", { name: "Gamma" }).id
    );
    await user.keyboard("{Enter}");
    expect(choose).toHaveBeenCalledWith(gamma);
    expect(query.mock.calls).toStrictEqual([[""]]);
  });

  it("renders loading and empty states without fetching or inventing an active option", async () => {
    const user = userEvent.setup();
    const query = vi.fn<(value: string) => void>();
    const props = {
      ...optionProps,
      "aria-label": "Company",
      onQueryChange: query,
      onValueChange: vi.fn<(value: Item | null) => void>(),
      options: [],
      query: "a",
      value: null,
    };
    const { rerender } = render(
      <AutocompleteInput
        {...props}
        loading
        labels={{ loading: "Searching companies" }}
      />
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.getByRole("status").textContent).toBe("Searching companies");
    expect(screen.getByRole("listbox").getAttribute("aria-busy")).toBe("true");
    rerender(
      <AutocompleteInput {...props} labels={{ empty: "No companies" }} />
    );
    expect(screen.getByRole("status").textContent).toBe("No companies");
    expect(input.hasAttribute("aria-activedescendant")).toBeFalsy();
    expect(query).not.toHaveBeenCalled();
  });

  it("announces search errors separately from selection validation", async () => {
    const user = userEvent.setup();
    render(
      <AutocompleteInput
        {...optionProps}
        aria-label="Company"
        value={null}
        onValueChange={() => {}}
        query="a"
        onQueryChange={() => {}}
        error="Search failed"
      />
    );
    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.getByRole("alert").textContent).toBe("Search failed");
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByRole("alert").id
    );
    expect(input.hasAttribute("aria-invalid")).toBeFalsy();
  });

  it("forwards refs/native callbacks and supports external selections and custom option rendering", async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLInputElement>();
    const blur = vi.fn<(event: FocusEvent<HTMLInputElement>) => void>();
    const props = {
      ...optionProps,
      "aria-label": "Company",
      minimumQueryLength: 0,
      name: "company",
      onBlur: blur,
      onQueryChange: vi.fn<(value: string) => void>(),
      onValueChange: vi.fn<(value: Item | null) => void>(),
      query: "",
      ref,
      renderOption: (item: Item) => <span>Custom {item.label}</span>,
    };
    const { rerender } = render(<AutocompleteInput {...props} value={alpha} />);
    const input = screen.getByRole("combobox");
    expect(ref.current).toBe(input);
    expect(ref.current?.value).toBe("Alpha");
    await user.click(input);
    expect(screen.getByRole("option", { name: "Custom Beta" })).toBeTruthy();
    rerender(<AutocompleteInput {...props} value={beta} />);
    expect(ref.current?.value).toBe("Beta");
    await user.tab();
    expect(blur).toHaveBeenCalledWith(
      expect.objectContaining({ type: "blur" })
    );
  });

  it.each(["disabled", "readOnly"] as const)(
    "closes an open popup for %s and does not reopen it when enabled",
    async (mode) => {
      const user = userEvent.setup();
      const choose = vi.fn<(value: Item | null) => void>();
      const props = {
        ...optionProps,
        "aria-label": "Company",
        onQueryChange: vi.fn<(value: string) => void>(),
        onValueChange: choose,
        query: "a",
        value: alpha,
      };
      const { rerender } = render(<AutocompleteInput {...props} />);
      await user.click(screen.getByRole("combobox"));
      expect(screen.getByRole("listbox")).toBeTruthy();
      rerender(<AutocompleteInput {...props} {...{ [mode]: true }} />);
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(
        screen
          .getByRole("button", { name: "Clear selection" })
          .hasAttribute("disabled")
      ).toBeTruthy();
      rerender(<AutocompleteInput {...props} />);
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(choose).not.toHaveBeenCalled();
    }
  );

  it("binds RHF validation focus, submission and reset without accepting free text", async () => {
    const user = userEvent.setup();
    const save = vi.fn<(data: { company: Item | null }) => void>();
    render(<Form save={save} />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    const input = screen.getByRole("combobox");
    await waitFor(() => expect(document.activeElement).toBe(input));
    expect(screen.getByRole("alert").textContent).toBe("Choose a company");
    await user.type(input, "a");
    await user.keyboard("{Enter}");
    expect(save).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(save.mock.calls[0]?.[0]).toStrictEqual({ company: alpha });
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("excludes selected IDs and prevents additions beyond the limit", async () => {
    const user = userEvent.setup();
    render(<Multi />);
    const input = screen.getByRole("combobox", { name: "Skills" });
    await user.type(input, "b");
    expect(
      screen.queryByRole("option", { name: "Alpha First result" })
    ).toBeNull();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Remove Beta" })).toBeTruthy();
    expect(input.hasAttribute("disabled")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole("group", { name: "Selected skills" })
    );
  });

  it("restores stable focus after removing at the limit and allows previously selected items again", async () => {
    const user = userEvent.setup();
    render(<Multi />);
    const input = screen.getByRole("combobox");
    await user.type(input, "b");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: "Remove Alpha" }));
    expect(input.hasAttribute("disabled")).toBeFalsy();
    expect(document.activeElement).toBe(
      screen.getByRole("group", { name: "Selected skills" })
    );
    await user.tab();
    expect(document.activeElement).toBe(input);
    await user.type(input, "a");
    expect(screen.queryByRole("option", { name: "Beta" })).toBeNull();
    expect(
      screen.getByRole("option", { name: "Alpha First result" })
    ).toBeTruthy();
  });

  it("blocks read-only multi-selection and removals", async () => {
    const user = userEvent.setup();
    render(<Multi readOnly />);
    const remove = screen.getByRole("button", { name: "Remove Alpha" });
    expect(remove.hasAttribute("disabled")).toBeTruthy();
    await user.click(remove);
    await user.type(screen.getByRole("combobox"), "a");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(remove.isConnected).toBeTruthy();
  });
});
