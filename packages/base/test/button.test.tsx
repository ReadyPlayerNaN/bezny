// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Plane } from "lucide-react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, Icon, Submit } from "../src/index.js";

import styles from "../src/controls/button.module.scss";

describe("button", () => {
  afterEach(cleanup);

  it("defaults to a non-submitting native button and forwards attributes and refs", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} id="save" aria-label="Save changes" className="custom">
        Save
      </Button>
    );
    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("id")).toBe("save");
    expect(button.classList.contains("custom")).toBeTruthy();
    expect(ref.current).toBe(button);
  });

  it("invokes the click handler when enabled", () => {
    const onClick = vi.fn<() => void>();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each([{ disabled: true }, { loading: true }])(
    "blocks native clicks for %j",
    (state) => {
      const onClick = vi.fn<() => void>();
      render(
        <Button {...state} onClick={onClick}>
          Save
        </Button>
      );
      const button = screen.getByRole("button", { name: "Save" });
      fireEvent.click(button);
      expect(button.hasAttribute("disabled")).toBeTruthy();
      expect(onClick).not.toHaveBeenCalled();
    }
  );

  it("announces loading and keeps the spinner decorative", () => {
    const { container } = render(<Button loading>Save</Button>);
    expect(
      screen.getByRole("button", { name: "Save" }).getAttribute("aria-busy")
    ).toBe("true");
    expect(
      container.querySelector(`.${styles.spinner}`)?.getAttribute("aria-hidden")
    ).toBe("true");
  });

  it.each(["primary", "secondary", "critical"] as const)(
    "supports the %s variant and small/full-width sizing",
    (variant) => {
      render(
        <Button variant={variant} size="small" fullWidth>
          Save
        </Button>
      );
      const button = screen.getByRole("button", { name: "Save" });
      expect(button.classList.contains(styles.small ?? "")).toBeTruthy();
      expect(button.classList.contains(styles.fullWidth ?? "")).toBeTruthy();
      expect({
        critical: button.classList.contains(styles.critical ?? ""),
        secondary: button.classList.contains(styles.secondary ?? ""),
      }).toStrictEqual({
        critical: variant === "critical",
        secondary: variant === "secondary",
      });
      expect(button.hasAttribute("variant")).toBeFalsy();
      expect(button.hasAttribute("size")).toBeFalsy();
    }
  );

  it("preserves legacy appearance types without leaking them into native type", () => {
    render(
      <Button type="critical" variant="secondary">
        Delete
      </Button>
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.classList.contains(styles.critical ?? "")).toBeTruthy();
    expect(button.getAttribute("type")).toBe("button");
  });

  it("supports explicit native types and the submit shorthand", () => {
    render(
      <>
        <Button type="reset">Reset</Button>
        <Button submit>Save</Button>
        <Submit>Submit</Submit>
      </>
    );
    expect(
      screen.getByRole("button", { name: "Reset" }).getAttribute("type")
    ).toBe("reset");
    expect(
      screen.getByRole("button", { name: "Save" }).getAttribute("type")
    ).toBe("submit");
    expect(
      screen.getByRole("button", { name: "Submit" }).getAttribute("type")
    ).toBe("submit");
  });

  it("Submit participates in native form submission", () => {
    const onSubmit = vi.fn<() => void>();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Submit>Save</Submit>
      </form>
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("supports anchor props and refs through asComponent", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Button asComponent="a" href="#details" ref={ref}>
        Details
      </Button>
    );
    const button = screen.getByRole("button", { name: "Details" });
    expect(button.tagName).toBe("A");
    expect(button.getAttribute("href")).toBe("#details");
    expect(button.getAttribute("tabindex")).toBe("0");
    expect(ref.current).toBe(button);
  });

  it.each(["Enter", " "])("activates non-native buttons with %j", (key) => {
    const onClick = vi.fn<() => void>();
    render(
      <Button asComponent="span" onClick={onClick}>
        Action
      </Button>
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Action" }), { key });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("honors a consumer's cancelled keyboard action", () => {
    const onClick = vi.fn<() => void>();
    render(
      <Button
        asComponent="span"
        onClick={onClick}
        onKeyDown={(event) => event.preventDefault()}
      >
        Action
      </Button>
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Action" }), {
      key: "Enter",
    });
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([{ disabled: true }, { loading: true }])(
    "blocks non-native interaction and bubbling for %j",
    (state) => {
      const onClick = vi.fn<() => void>();
      const parentClick = vi.fn<() => void>();
      // A parent listener verifies that disabled link clicks do not escape the control.
      render(
        <Button asComponent="a" href="#details" {...state} onClick={onClick}>
          Details
        </Button>
      );
      document.body.addEventListener("click", parentClick);
      const button = screen.getByRole("button", { name: "Details" });
      const allowed = fireEvent.click(button);
      fireEvent.keyDown(button, { key: "Enter" });
      document.body.removeEventListener("click", parentClick);
      expect(allowed).toBeFalsy();
      expect(button.getAttribute("aria-disabled")).toBe("true");
      expect(button.getAttribute("tabindex")).toBe("-1");
      expect(onClick).not.toHaveBeenCalled();
      expect(parentClick).not.toHaveBeenCalled();
    }
  );

  it("renders wrapped icons within its label", () => {
    render(
      <Button>
        <Icon icon={Plane} aria-hidden="true" />
        Travel
      </Button>
    );
    expect(
      screen
        .getByRole("button", { name: "Travel" })
        .querySelector('svg[role="graphics-symbol"]')
    ).not.toBeNull();
  });
});
