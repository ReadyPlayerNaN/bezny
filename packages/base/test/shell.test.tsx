// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Shell } from "../src/layout/shell.js";

// CSS modules are mocked in jsdom: represent desktop visibility only.
// Native toggling and every responsive variant are tested in Chromium.
const desktopStyle = document.createElement("style");
desktopStyle.textContent = "nav[popover] { display: block !important; }";
document.head.append(desktopStyle);

const navigation = (
  <ul>
    <li>
      <a href="/articles">Articles</a>
    </li>
    <li>
      <a href="/pages">Pages</a>
    </li>
  </ul>
);

describe(Shell, () => {
  afterEach(cleanup);

  it("renders one navigation and one main tree with native popover controls", () => {
    render(
      <Shell header="Brand" navigation={navigation}>
        Content
      </Shell>
    );
    const nav = screen.getByRole("navigation", { name: "Entities" });
    const trigger = screen.getByRole("button", { name: /Open navigation/u });
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(nav.getAttribute("popover")).toBe("auto");
    expect(trigger.getAttribute("popovertarget")).toBe(nav.id);
    expect(screen.getByRole("main").textContent).toBe("Content");
  });

  it("forwards root props, refs, direction and localized labels without a portal", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Shell
        ref={ref}
        dir="rtl"
        className="custom"
        data-testid="shell"
        navigation={navigation}
        navigationLabel="الكيانات"
        openNavigationLabel="فتح"
        closeNavigationLabel="إغلاق"
      />
    );
    const root = screen.getByTestId("shell");
    const nav = screen.getByRole("navigation", { name: "الكيانات" });
    expect(ref.current).toBe(root);
    expect(root.getAttribute("dir")).toBe("rtl");
    expect(root.classList.contains("custom")).toBeTruthy();
    expect(root.contains(nav)).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "إغلاق" })
        .getAttribute("popovertargetaction")
    ).toBe("hide");
  });

  it("generates independent native targets for multiple shells", () => {
    render(
      <>
        <Shell navigation={navigation} />
        <Shell navigation={navigation} />
      </>
    );
    const [first, second] = screen.getAllByRole("navigation");
    const [firstTrigger, secondTrigger] = screen.getAllByRole("button", {
      name: /Open navigation/u,
    });
    if (!first || !second || !firstTrigger || !secondTrigger) {
      throw new Error(
        "Both shells must render navigation and a native trigger."
      );
    }
    expect(first.id).not.toBe(second.id);
    expect(firstTrigger.getAttribute("popovertarget")).toBe(first.id);
    expect(secondTrigger.getAttribute("popovertarget")).toBe(second.id);
  });

  it("omits navigation and controls for an absent or false slot", () => {
    render(
      <Shell navigation={false} header={false} footer={false}>
        Content
      </Shell>
    );
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
  });
});
