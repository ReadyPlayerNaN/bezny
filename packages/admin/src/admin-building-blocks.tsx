import { Heading, Main } from "@bezny/base";
import { createContext, useContext, useId, useMemo } from "react";
import type { ComponentPropsWithRef, ComponentType, ReactNode } from "react";

export type AdminLayoutProps = ComponentPropsWithRef<"div"> & {
  header?: ReactNode;
  navigation?: ReactNode;
  navigationLabel?: string;
  footer?: ReactNode;
};

export interface AdminPageHeaderProps {
  heading: ReactNode;
  headingId: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export type AdminPageProps = ComponentPropsWithRef<"section"> & {
  heading: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export interface AdminBuildingBlocks {
  Layout: ComponentType<AdminLayoutProps>;
  Page: ComponentType<AdminPageProps>;
  PageHeader: ComponentType<AdminPageHeaderProps>;
}

const AdminBuildingBlocksContext = createContext<AdminBuildingBlocks | null>(
  null
);

/** Semantic, unstyled shell. Supply navigation links rather than a second nav. */
export const DefaultAdminLayout = ({
  header,
  navigation,
  navigationLabel = "Administration",
  footer,
  children,
  ...rootProps
}: AdminLayoutProps) => (
  <div {...rootProps}>
    {header !== null && header !== undefined && <header>{header}</header>}
    {navigation !== null && navigation !== undefined && (
      <nav aria-label={navigationLabel}>{navigation}</nav>
    )}
    <Main>{children}</Main>
    {footer !== null && footer !== undefined && <footer>{footer}</footer>}
  </div>
);

export const DefaultAdminPageHeader = ({
  heading,
  headingId,
  description,
  actions,
}: AdminPageHeaderProps) => (
  <div>
    <div
      data-admin-page-heading-row
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Heading level={1} id={headingId} style={{ margin: 0, minWidth: 0 }}>
        {heading}
      </Heading>
      {actions !== null && actions !== undefined && (
        <div
          data-admin-page-actions
          style={{ flexShrink: 0, marginInlineStart: "auto" }}
        >
          {actions}
        </div>
      )}
    </div>
    {description !== null && description !== undefined && <p>{description}</p>}
  </div>
);

export const DefaultAdminPage = ({
  heading,
  description,
  actions,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...sectionProps
}: AdminPageProps) => {
  const headingId = useId();
  const PageHeader =
    useContext(AdminBuildingBlocksContext)?.PageHeader ??
    DefaultAdminPageHeader;
  return (
    <section
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel === undefined ? headingId : undefined)
      }
      {...sectionProps}
    >
      <PageHeader
        heading={heading}
        headingId={headingId}
        description={description}
        actions={actions}
      />
      {children}
    </section>
  );
};

export type AdminBuildingBlockOverrides = {
  [Block in keyof AdminBuildingBlocks]?: AdminBuildingBlocks[Block] | undefined;
};

const defaultBuildingBlocks: AdminBuildingBlocks = {
  Layout: DefaultAdminLayout,
  Page: DefaultAdminPage,
  PageHeader: DefaultAdminPageHeader,
};

/** Returns the nearest configuration, or the defaults outside a provider. */
export const useAdminBuildingBlocks = (): AdminBuildingBlocks =>
  useContext(AdminBuildingBlocksContext) ?? defaultBuildingBlocks;

export interface AdminBuildingBlocksProviderProps {
  children: ReactNode;
  components?: AdminBuildingBlockOverrides | undefined;
}

/** Nested providers replace only supplied blocks without resetting atom state. */
export const AdminBuildingBlocksProvider = ({
  children,
  components,
}: AdminBuildingBlocksProviderProps) => {
  const parent = useAdminBuildingBlocks();
  const Layout = components?.Layout ?? parent.Layout;
  const Page = components?.Page ?? parent.Page;
  const PageHeader = components?.PageHeader ?? parent.PageHeader;
  const value = useMemo(
    () => ({ Layout, Page, PageHeader }),
    [Layout, Page, PageHeader]
  );
  return (
    <AdminBuildingBlocksContext.Provider value={value}>
      {children}
    </AdminBuildingBlocksContext.Provider>
  );
};
