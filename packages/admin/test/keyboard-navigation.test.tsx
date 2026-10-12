import "../../base/test/dom-observers.js";
import {
  Button,
  CheckboxInput,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@bezny/base";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { StrictMode, useRef } from "react";
import { I18nextProvider } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminCommandPalette } from "../src/admin-command-palette.js";
import { createAdminI18n } from "../src/admin-i18n.js";
import { AdminKeyboardNavigation } from "../src/admin-keyboard-navigation.js";

const hintOverlay = () =>
  document.querySelector<HTMLElement>("[data-bezny-hint-overlay]");
const hintBadges = () => [
  ...(hintOverlay()?.querySelectorAll<HTMLSpanElement>(
    "[data-bezny-hint-code]"
  ) ?? []),
];
const press = (
  key: string,
  target: HTMLElement = document.body,
  options: KeyboardEventInit = {}
) => fireEvent.keyDown(target, { key, ...options });
const choose = (index = 0) => {
  const code = hintBadges()[index]?.dataset.beznyHintCode ?? "";
  for (const letter of code) {
    press(letter);
  }
};

const mockNavigationLayout = () => {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockImplementation(
    function navigationRects(this: HTMLElement) {
      const rect = this.dataset.offscreen
        ? new DOMRect(0, -100, 80, 20)
        : new DOMRect(20, 40, 100, 24);
      return Object.assign([rect], {
        item: (index: number) => (index === 0 ? rect : null),
      });
    }
  );
};
const cleanupNavigation = () => {
  cleanup();
  vi.restoreAllMocks();
};
const preventNavigationKey = (event: KeyboardEvent) => event.preventDefault();
const ScopedMenu = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef}>
      <AdminKeyboardNavigation rootRef={rootRef} />
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Run</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

describe(AdminKeyboardNavigation, () => {
  beforeEach(mockNavigationLayout);
  afterEach(cleanupNavigation);

  it("does no geometry work until activated and renders a single non-interactive overlay", () => {
    const onClick = vi.fn<() => void>();
    render(
      <>
        <AdminKeyboardNavigation />
        <Button onClick={onClick}>Action</Button>
        <a href="#docs">Documentation</a>
      </>
    );
    expect(HTMLElement.prototype.getClientRects).not.toHaveBeenCalled();
    press("f");
    expect({
      badges: hintBadges().length,
      hidden: hintOverlay()?.getAttribute("aria-hidden"),
      overlays: document.querySelectorAll("[data-bezny-hint-overlay]").length,
    }).toStrictEqual({ badges: 2, hidden: "true", overlays: 1 });
    choose();
    expect(onClick).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(screen.getByRole("button"));
    expect(hintOverlay()).toBeNull();
  });

  it.each([
    { action: "focus", clicks: 0, enters: 0 },
    { action: "click", clicks: 1, enters: 0 },
    { action: "enter", clicks: 0, enters: 1 },
  ])(
    "honors the explicit $action activation contract",
    ({ action, clicks, enters }) => {
      const click = vi.fn<() => void>();
      const enter = vi.fn<() => void>();
      render(
        <>
          <AdminKeyboardNavigation />
          <Button
            data-bezny-hint-action={action}
            onClick={click}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                enter();
              }
            }}
          >
            Custom action
          </Button>
        </>
      );
      press("f");
      choose();
      expect({
        clicks: click.mock.calls.length,
        enters: enter.mock.calls.length,
        focused: document.activeElement === screen.getByRole("button"),
        overlay: hintOverlay(),
      }).toStrictEqual({ clicks, enters, focused: true, overlay: null });
    }
  );

  it("honors prevented events and stopped propagation from React handlers", () => {
    render(
      <>
        <AdminKeyboardNavigation />
        <Button onKeyDown={(event) => event.preventDefault()}>Prevent</Button>
        <Button onKeyDown={(event) => event.stopPropagation()}>Stop</Button>
      </>
    );
    press("f", screen.getByText("Prevent"));
    expect(hintOverlay()).toBeNull();
    press("f", screen.getByText("Stop"));
    expect(hintOverlay()).toBeNull();
  });

  it("honors document cancellation even if its listener was registered later", () => {
    render(
      <>
        <AdminKeyboardNavigation />
        <Button>Action</Button>
      </>
    );
    document.addEventListener("keydown", preventNavigationKey);
    try {
      press("f");
      expect(hintOverlay()).toBeNull();
    } finally {
      document.removeEventListener("keydown", preventNavigationKey);
    }
  });

  it.each([
    { ctrlKey: true },
    { altKey: true },
    { metaKey: true },
    { repeat: true },
    { isComposing: true },
    { keyCode: 229 },
  ])("ignores modified/repeated/composing entry %j", (options) => {
    render(
      <>
        <AdminKeyboardNavigation />
        <Button>Action</Button>
      </>
    );
    press("f", document.body, options);
    expect(hintOverlay()).toBeNull();
  });

  it.each(["", "ff", "1", "ſ", "K"])(
    "rejects non-ASCII or nonsingular shortcut %s",
    (shortcut) => {
      expect(() =>
        render(<AdminKeyboardNavigation shortcut={shortcut} />)
      ).toThrow(TypeError);
    }
  );

  it("supports uppercase entry and custom shortcut/alphabet", () => {
    render(
      <>
        <AdminKeyboardNavigation shortcut="x" alphabet="QW" />
        <Button>Action</Button>
      </>
    );
    press("f");
    expect(hintOverlay()).toBeNull();
    press("X", document.body, { shiftKey: true });
    expect(hintBadges()[0]?.textContent).toBe("Q");
  });

  it("reserves viewport space for the full length of long hint codes", () => {
    const labels = Array.from({ length: 100 }, (_, index) => `Action ${index}`);
    render(
      <>
        <AdminKeyboardNavigation alphabet="ab" />
        {labels.map((label) => (
          <Button key={label}>{label}</Button>
        ))}
      </>
    );
    press("f");
    expect(
      Math.max(...hintBadges().map((badge) => badge.textContent?.length ?? 0))
    ).toBeGreaterThan(4);
    expect(
      hintBadges().every((badge) => {
        const code = badge.dataset.beznyHintCode;
        return (
          code !== undefined &&
          badge.style.left.includes(`${code.length + 2}em`)
        );
      })
    ).toBeTruthy();
  });

  it("does not start from inputs, rich editors, custom textboxes, or opted-out regions", () => {
    render(
      <>
        <AdminKeyboardNavigation />
        <input aria-label="Input" />
        <textarea aria-label="Textarea" />
        <select aria-label="Select">
          <option>One</option>
        </select>
        <div contentEditable suppressContentEditableWarning>
          <span>Editor</span>
        </div>
        <div data-testid="custom-editor" />
        <section data-bezny-hints="off">
          <Button>Excluded</Button>
        </section>
      </>
    );
    screen.getByTestId("custom-editor").setAttribute("role", "textbox");
    for (const target of [
      screen.getByLabelText("Input"),
      screen.getByLabelText("Textarea"),
      screen.getByLabelText("Select"),
      screen.getByText("Editor"),
      screen.getByTestId("custom-editor"),
      screen.getByText("Excluded"),
    ]) {
      press("f", target);
      expect(hintOverlay()).toBeNull();
    }
  });

  it("honors a contenteditable=false boundary inside a rich editor", () => {
    render(
      <>
        <AdminKeyboardNavigation />
        <div contentEditable suppressContentEditableWarning>
          <Button contentEditable={false}>Action</Button>
        </div>
      </>
    );
    press("f", screen.getByRole("button"));
    expect(hintBadges()).toHaveLength(2);
  });

  it("excludes disabled, hidden, inert, offscreen, covered, opted-out and closing targets", () => {
    render(
      <>
        <AdminKeyboardNavigation />
        <Button>Visible</Button>
        <Button disabled>Disabled</Button>
        <fieldset disabled>
          <button type="button">Fieldset</button>
        </fieldset>
        <Button aria-disabled="true">Aria</Button>
        <Button hidden>Hidden</Button>
        <div inert>
          <Button>Inert</Button>
        </div>
        <section data-bezny-hints="off">
          <Button>Excluded</Button>
        </section>
        <Button data-bezny-hint="off">Opt out</Button>
        <Button data-offscreen>Offscreen</Button>
        <Button style={{ visibility: "hidden" }}>Invisible</Button>
        <dialog open data-state="closed">
          <Button>Closing</Button>
        </dialog>
      </>
    );
    press("f");
    expect(hintBadges()).toHaveLength(1);
  });

  it("uses and deduplicates a visible label for a visually hidden native checkbox", () => {
    const change = vi.fn<() => void>();
    render(
      <>
        <AdminKeyboardNavigation />
        <label data-bezny-hint htmlFor="check">
          Choice
          <input
            id="check"
            type="checkbox"
            style={{ opacity: 0 }}
            onChange={change}
          />
        </label>
      </>
    );
    press("f");
    expect(hintBadges()).toHaveLength(1);
    choose();
    expect(
      (screen.getByRole("checkbox") as HTMLInputElement).checked
    ).toBeTruthy();
    expect(change).toHaveBeenCalledOnce();
  });

  it("focuses text inputs without clicking or modifying them", () => {
    const click = vi.fn<() => void>();
    render(
      <>
        <AdminKeyboardNavigation />
        <input aria-label="Name" defaultValue="Existing" onClick={click} />
      </>
    );
    press("f");
    choose();
    expect(document.activeElement).toBe(screen.getByLabelText("Name"));
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe(
      "Existing"
    );
    expect(click).not.toHaveBeenCalled();
  });

  it("filters stable cached codes and handles Backspace without geometry reads", async () => {
    render(
      <>
        <AdminKeyboardNavigation alphabet="ab" />
        {Array.from({ length: 10 }, (_, index) => (
          <Button key={`action-${index}`}>Action {index}</Button>
        ))}
      </>
    );
    press("f");
    const codes = hintBadges().map((badge) => badge.textContent);
    const calls = vi.mocked(HTMLElement.prototype.getClientRects).mock.calls
      .length;
    press("a");
    expect(hintBadges().filter((badge) => !badge.hidden)).toHaveLength(
      codes.filter((code) => code?.startsWith("A")).length
    );
    press("a", document.body, { repeat: true });
    await act(async () => {});
    expect(hintOverlay()).not.toBeNull();
    press("Backspace");
    expect(hintBadges().every((badge) => !badge.hidden)).toBeTruthy();
    expect(hintBadges().map((badge) => badge.textContent)).toStrictEqual(codes);
    expect(HTMLElement.prototype.getClientRects).toHaveBeenCalledTimes(calls);
  });

  it("Tab cancels hints without preventing its default navigation", () => {
    render(
      <>
        <AdminKeyboardNavigation />
        <Button>Action</Button>
      </>
    );
    press("f");
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "Tab",
    });
    act(() => document.body.dispatchEvent(event));
    expect(event.defaultPrevented).toBeFalsy();
    expect(hintOverlay()).toBeNull();
  });

  it.each(["scroll", "resize", "blur", "pagehide", "popstate", "hashchange"])(
    "cancels on %s",
    (type) => {
      render(
        <>
          <AdminKeyboardNavigation />
          <Button>Action</Button>
        </>
      );
      press("f");
      fireEvent(window, new Event(type));
      expect(hintOverlay()).toBeNull();
    }
  );

  it("cancels on pointer interaction, editor focus, or page mutations", async () => {
    render(
      <>
        <AdminKeyboardNavigation />
        <Button>Action</Button>
        <input aria-label="Name" />
      </>
    );
    press("f");
    fireEvent.pointerDown(document.body);
    expect(hintOverlay()).toBeNull();
    press("f");
    act(() => screen.getByLabelText("Name").focus());
    expect(hintOverlay()).toBeNull();
    act(() => screen.getByLabelText("Name").blur());
    press("f");
    screen.getByText("Action").setAttribute("disabled", "");
    await act(async () => {});
    expect(hintOverlay()).toBeNull();
  });

  it("revalidates disabled/removed targets before the observer can run", () => {
    const click = vi.fn<() => void>();
    render(
      <>
        <AdminKeyboardNavigation />
        <Button onClick={click}>Action</Button>
      </>
    );
    press("f");
    screen.getByRole("button").setAttribute("disabled", "");
    choose();
    expect(click).not.toHaveBeenCalled();
    expect(hintOverlay()).toBeNull();
  });

  it("scopes discovery to a configured root", () => {
    const rootRef = { current: document.createElement("section") };
    document.body.append(rootRef.current);
    try {
      const button = document.createElement("button");
      button.type = "button";
      rootRef.current.append(button);
      render(
        <>
          <AdminKeyboardNavigation rootRef={rootRef} />
          <Button>Outside</Button>
        </>
      );
      press("f");
      expect(hintBadges()).toHaveLength(1);
    } finally {
      rootRef.current.remove();
    }
  });

  it("does not prevent F when there are no actionable targets", () => {
    render(<AdminKeyboardNavigation />);
    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "f",
    });
    act(() => document.body.dispatchEvent(event));
    expect(event.defaultPrevented).toBeFalsy();
    expect(hintOverlay()).toBeNull();
  });

  it("cleans up sessions on disable/unmount, including StrictMode", () => {
    const { rerender, unmount } = render(
      <StrictMode>
        <AdminKeyboardNavigation />
        <Button>Action</Button>
      </StrictMode>
    );
    press("f");
    expect(hintBadges()).toHaveLength(1);
    rerender(
      <StrictMode>
        <AdminKeyboardNavigation enabled={false} />
        <Button>Action</Button>
      </StrictMode>
    );
    expect(hintOverlay()).toBeNull();
    press("f");
    expect(hintOverlay()).toBeNull();
    rerender(
      <StrictMode>
        <AdminKeyboardNavigation />
        <Button>Action</Button>
      </StrictMode>
    );
    press("f");
    unmount();
    expect(hintOverlay()).toBeNull();
    press("f");
    expect(hintOverlay()).toBeNull();
  });
});

describe("Radix and command-palette interoperability", () => {
  beforeEach(mockNavigationLayout);
  afterEach(cleanupNavigation);

  it("activates a Radix checkbox once, without duplicating its hidden form input", async () => {
    const user = userEvent.setup();
    const change = vi.fn<(checked: boolean | "indeterminate") => void>();
    render(
      <>
        <AdminKeyboardNavigation />
        <form>
          <CheckboxInput aria-label="Choice" onCheckedChange={change} />
        </form>
      </>
    );
    await user.keyboard("f");
    expect(hintBadges()).toHaveLength(1);
    choose();
    expect(change).toHaveBeenCalledExactlyOnceWith(true);
  });

  it("opens dropdown triggers through the primitive's keyboard contract and selects portal items", async () => {
    const select = vi.fn<() => void>();
    const user = userEvent.setup();
    render(
      <>
        <AdminKeyboardNavigation />
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={select}>Run action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
    await user.keyboard("f");
    choose();
    await screen.findByRole("menu");
    await user.keyboard("f");
    expect(hintBadges()).toHaveLength(1);
    choose();
    await waitFor(() => expect(select).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Actions" })
      )
    );
  });

  it("opens a select-only combobox and activates the hinted option, preserving Radix focus restoration", async () => {
    const change = vi.fn<(value: string) => void>();
    const user = userEvent.setup();
    render(
      <>
        <AdminKeyboardNavigation />
        <Select defaultValue="basic" onValueChange={change}>
          <SelectTrigger aria-label="Plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="disabled" disabled>
              Disabled
            </SelectItem>
          </SelectContent>
        </Select>
      </>
    );
    await user.keyboard("f");
    choose();
    await screen.findByRole("listbox");
    await user.keyboard("f");
    expect(hintBadges()).toHaveLength(2);
    choose(1);
    await waitFor(() => expect(change).toHaveBeenCalledExactlyOnceWith("pro"));
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole("combobox"))
    );
  });

  it("scopes to a Radix dialog without requiring aria-modal, and consumes only the first Escape", async () => {
    const user = userEvent.setup();
    render(
      <>
        <AdminKeyboardNavigation />
        <Button>Background</Button>
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>Modal</DialogTitle>
            <DialogClose>Done</DialogClose>
          </DialogContent>
        </Dialog>
      </>
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = await screen.findByRole("dialog");
    await user.keyboard("f");
    expect({
      badges: hintBadges().length,
      modalAttribute: dialog.hasAttribute("aria-modal"),
      scoped: dialog.contains(hintOverlay()),
    }).toStrictEqual({ badges: 1, modalAttribute: false, scoped: true });
    await user.keyboard("{Escape}");
    expect(hintOverlay()).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("includes a root-owned Radix portal through its aria-controls trigger relationship", async () => {
    const user = userEvent.setup();
    render(<ScopedMenu />);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await screen.findByRole("menu");
    await user.keyboard("f");
    expect(hintBadges()).toHaveLength(1);
  });

  it("does not steal command-palette typing or Ctrl+K, and hints activate the exact cmdk option", async () => {
    const user = userEvent.setup();
    const first = vi.fn<() => void>();
    const second = vi.fn<() => void>();
    render(
      <I18nextProvider i18n={createAdminI18n()}>
        <AdminKeyboardNavigation />
        <AdminCommandPalette
          commands={[
            { execute: first, id: "first", label: "First command" },
            { execute: second, id: "second", label: "Second command" },
          ]}
        />
      </I18nextProvider>
    );
    await user.keyboard("f");
    await user.keyboard("{Control>}k{/Control}");
    expect(hintOverlay()).toBeNull();
    await screen.findByRole("dialog");
    const input = screen.getByRole("combobox", { name: "Search commands" });
    await user.type(input, "f");
    expect({
      overlay: hintOverlay(),
      value: (input as HTMLInputElement).value,
    }).toStrictEqual({ overlay: null, value: "f" });
    await user.clear(input);
    act(() => screen.getByRole("button", { name: "Close palette" }).focus());
    press("f", document.activeElement as HTMLElement);
    expect(hintBadges()).toHaveLength(4);
    choose(3);
    await waitFor(() => expect(second).toHaveBeenCalledOnce());
    expect(first).not.toHaveBeenCalled();
  });
});
