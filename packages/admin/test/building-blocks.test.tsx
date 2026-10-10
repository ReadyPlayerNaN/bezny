import { Button, Heading } from "@bezny/base";
import { cleanup, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { createRef, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  AdminBuildingBlocksProvider,
  DefaultAdminLayout,
  DefaultAdminPage,
  useAdminBuildingBlocks,
} from "../src/admin-building-blocks.js";
import type {
  AdminLayoutProps,
  AdminPageProps,
  AdminPageHeaderProps,
} from "../src/admin-building-blocks.js";
import { AdminLayout } from "../src/admin-layout.js";
import { AdminPage } from "../src/admin-page.js";

const BrandedLayout = (props: AdminLayoutProps) => (
  <DefaultAdminLayout {...props} data-brand="bezny" />
);
const BrandedPage = (props: AdminPageProps) => (
  <DefaultAdminPage {...props} data-page="branded" />
);
const BrandedPageHeader = ({
  heading,
  headingId,
  description,
  actions,
}: AdminPageHeaderProps) => (
  <header data-header="branded">
    <Heading level={1} id={headingId}>
      {heading}
    </Heading>
    {description !== null && description !== undefined && <p>{description}</p>}
    {actions}
  </header>
);

const StatefulContent = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount(count + 1)}>Count: {count}</Button>;
};

const ReadConfiguration = () => {
  const { Layout, PageHeader } = useAdminBuildingBlocks();
  return (
    <output>
      {Layout === BrandedLayout && PageHeader === BrandedPageHeader
        ? "Inherited"
        : "Default"}
    </output>
  );
};

describe("admin building blocks", () => {
  afterEach(cleanup);

  it("composes a semantic shell and named page without a provider", () => {
    render(
      <AdminLayout
        header="Example admin"
        navigation={<a href="/articles">Articles</a>}
        footer="Copyright"
      >
        <AdminPage
          heading="Articles"
          description="Manage articles"
          actions={<Button>Create article</Button>}
        >
          <p>Article list</p>
        </AdminPage>
      </AdminLayout>
    );
    expect(screen.getByRole("banner").textContent).toBe("Example admin");
    expect(
      screen.getByRole("navigation", { name: "Administration" })
    ).toBeDefined();
    const main = within(screen.getByRole("main"));
    const page = main.getByRole("region", { name: "Articles" });
    const heading = within(page).getByRole("heading", {
      level: 1,
      name: "Articles",
    });
    expect(page.getAttribute("aria-labelledby")).toBe(heading.id);
    expect([
      within(page).getByRole("button", { name: "Create article" }).textContent,
      within(page).getByText("Manage articles").textContent,
      within(page).getByText("Article list").textContent,
    ]).toStrictEqual(["Create article", "Manage articles", "Article list"]);
    expect(screen.getByRole("contentinfo").textContent).toBe("Copyright");
  });

  it("omits empty optional regions and uses unique heading associations", () => {
    render(
      <AdminLayout>
        <AdminPage heading="Articles" />
        <AdminPage heading="Authors" />
      </AdminLayout>
    );
    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("contentinfo")).toBeNull();
    const articleHeading = screen.getByRole("heading", { name: "Articles" });
    const authorHeading = screen.getByRole("heading", { name: "Authors" });
    expect(articleHeading.id).not.toBe(authorHeading.id);
    expect(
      screen
        .getByRole("region", { name: "Authors" })
        .getAttribute("aria-labelledby")
    ).toBe(authorHeading.id);
  });

  it("forwards root props, refs, and explicit accessible names", () => {
    const layoutRef = createRef<HTMLDivElement>();
    const pageRef = createRef<HTMLElement>();
    render(
      <AdminLayout
        ref={layoutRef}
        className="application"
        data-owner="example"
        navigation="Links"
        navigationLabel="Primary"
      >
        <AdminPage
          ref={pageRef}
          heading="Articles"
          aria-label="Editorial"
          className="page"
          tabIndex={-1}
        />
      </AdminLayout>
    );
    expect({
      className: layoutRef.current?.className,
      owner: layoutRef.current?.dataset.owner,
    }).toStrictEqual({ className: "application", owner: "example" });
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeDefined();
    expect(pageRef.current).toBe(
      screen.getByRole("region", { name: "Editorial" })
    );
    expect(pageRef.current?.className).toBe("page");
    pageRef.current?.focus();
    expect(document.activeElement).toBe(pageRef.current);
  });

  it("replaces whole blocks and lets defaults compose a customized page header", () => {
    render(
      <AdminBuildingBlocksProvider
        components={{
          Layout: BrandedLayout,
          Page: BrandedPage,
          PageHeader: BrandedPageHeader,
        }}
      >
        <AdminLayout data-testid="layout">
          <AdminPage
            heading="Articles"
            description="Editorial"
            actions={<Button>Save</Button>}
          />
        </AdminLayout>
      </AdminBuildingBlocksProvider>
    );
    expect(screen.getByTestId("layout").dataset.brand).toBe("bezny");
    const page = screen.getByRole("region", { name: "Articles" });
    expect(page.dataset.page).toBe("branded");
    expect(
      screen.getByRole("heading", { name: "Articles" }).parentElement?.dataset
        .header
    ).toBe("branded");
    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
    expect(screen.getByText("Editorial")).toBeDefined();
  });

  it("merges nested overrides, inherits undefined slots, and isolates siblings", () => {
    render(
      <>
        <AdminBuildingBlocksProvider components={{ Layout: BrandedLayout }}>
          <AdminBuildingBlocksProvider
            components={{ Layout: undefined, PageHeader: BrandedPageHeader }}
          >
            <ReadConfiguration />
          </AdminBuildingBlocksProvider>
        </AdminBuildingBlocksProvider>
        <ReadConfiguration />
      </>
    );
    expect(screen.getByText("Inherited")).toBeDefined();
    expect(screen.getByText("Default")).toBeDefined();
  });

  it("does not remount content when the override object identity changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AdminBuildingBlocksProvider components={{ Layout: BrandedLayout }}>
        <AdminLayout>
          <StatefulContent />
        </AdminLayout>
      </AdminBuildingBlocksProvider>
    );
    await user.click(screen.getByRole("button", { name: "Count: 0" }));
    rerender(
      <AdminBuildingBlocksProvider components={{ Layout: BrandedLayout }}>
        <AdminLayout>
          <StatefulContent />
        </AdminLayout>
      </AdminBuildingBlocksProvider>
    );
    expect(screen.getByRole("button", { name: "Count: 1" })).toBeDefined();
  });

  it("applies updated overrides and can return to inherited defaults", () => {
    const { rerender } = render(
      <AdminBuildingBlocksProvider
        components={{ PageHeader: BrandedPageHeader }}
      >
        <AdminPage heading="Articles" />
      </AdminBuildingBlocksProvider>
    );
    expect(screen.getByRole("heading").parentElement?.dataset.header).toBe(
      "branded"
    );
    rerender(
      <AdminBuildingBlocksProvider>
        <AdminPage heading="Articles" />
      </AdminBuildingBlocksProvider>
    );
    expect(
      screen.getByRole("heading").parentElement?.dataset.header
    ).toBeUndefined();
  });
});
