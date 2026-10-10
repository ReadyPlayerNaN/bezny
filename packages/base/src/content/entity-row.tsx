import { useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";

import type { ContextMenuContentProps } from "../controls/context-menu.js";
import { Badge } from "./badge.js";
import {
  combineEntityRowActions,
  hasSharedActions,
} from "./entity-row-actions.js";
import type { EntityRowAction } from "./entity-row-actions.js";
import { EntityRowTitle } from "./entity-row-title.js";
import type { EntityRowVariant } from "./entity-row-title.js";
import { Section } from "./heading.js";
import { SelectableRow } from "./selectable-row.js";
import type { SelectableRowMenuItem } from "./selectable-row.js";
import { useRowSelectionDrag } from "./use-row-selection-drag.js";

import styles from "./entity-row.module.scss";

export interface EntityRowData {
  id: string;
  title: ReactNode;
  titleHref?: string;
  description?: ReactNode;
  icon?: ReactNode;
  decoration?: ReactNode;
  leading?: ReactNode;
  versionNumber?: number | null;
  versionHref?: string;
  badge?: ReactNode;
  meta?: string | null;
  trailing?: ReactNode;
  expanded?: ReactNode;
  actions?: readonly EntityRowAction[];
}
export type EntityRowProps = EntityRowData & {
  variant?: EntityRowVariant;
  onActionError?: (error: unknown) => void;
  menuContainer?: ContextMenuContentProps["container"];
};
const EntityRowContent = ({
  title,
  titleHref,
  leading,
  description,
  badge,
  trailing,
  meta,
  versionNumber,
  versionHref,
  expanded,
  variant = "default",
}: EntityRowProps) => (
  <div className={styles.content}>
    {leading}
    <Section className={styles.main}>
      <div className={styles.header}>
        <EntityRowTitle
          {...(titleHref ? { href: titleHref } : {})}
          variant={variant}
        >
          {title}
        </EntityRowTitle>
        {typeof badge === "string" ? <Badge>{badge}</Badge> : badge}
      </div>
      {description ? (
        <div className={styles.description}>{description}</div>
      ) : null}
      {expanded ? <div className={styles.expanded}>{expanded}</div> : null}
    </Section>
    <div className={styles.trailing}>
      {trailing}
      {meta ? <span className={styles.meta}>{meta}</span> : null}
      {typeof versionNumber === "number" && (versionHref ?? titleHref) ? (
        <a className={styles.version} href={versionHref ?? titleHref}>
          v{versionNumber}
        </a>
      ) : null}
    </div>
  </div>
);
export interface EntityRowListProps {
  rows: readonly EntityRowData[];
  selectedIds?: readonly string[];
  onSelectedIdsChange?: (ids: string[]) => void;
  selectable?: boolean;
  selectionMenu?: boolean;
  /** Explicit application-owned commands for a multi-selection. They own confirmation and clearing. */
  selectionActions?: readonly SelectableRowMenuItem[];
  selectLabel?: (row: EntityRowData, selected: boolean) => string;
  groupLabel?: (row: EntityRowData) => string;
  menuLabel?: (row: EntityRowData) => string;
  actionErrorLabel?: string;
  menuSummary?: (count: number) => ReactNode;
  variant?: EntityRowVariant;
  onActionError?: (error: unknown) => void;
  menuContainer?: ContextMenuContentProps["container"];
}
export const EntityRowList = ({
  rows,
  variant = "default",
  onActionError,
  menuContainer,
  selectedIds: controlledIds,
  onSelectedIdsChange,
  selectable: selectableOverride,
  selectionMenu = true,
  selectionActions,
  selectLabel,
  groupLabel,
  menuLabel,
  actionErrorLabel,
  menuSummary,
}: EntityRowListProps) => {
  const [storedIds, setStoredIds] = useState<string[]>([]);
  const eligibleIds = new Set<string>();
  for (const row of rows) {
    if (selectableOverride ?? hasSharedActions(row.actions)) {
      eligibleIds.add(row.id);
    }
  }
  const selectedIds = (controlledIds ?? storedIds).filter((id) =>
    eligibleIds.has(id)
  );
  if (controlledIds === undefined && storedIds.length !== selectedIds.length) {
    setStoredIds(selectedIds);
  }
  const updateSelection: Dispatch<SetStateAction<string[]>> = (next) => {
    if (controlledIds === undefined) {
      setStoredIds(next);
    } else {
      return onSelectedIdsChange?.(
        typeof next === "function" ? next([...controlledIds]) : next
      );
    }
  };
  const selectedSet = new Set(selectedIds);
  const selectedRows = rows.filter((row) => selectedSet.has(row.id));
  const selectionDrag = useRowSelectionDrag(selectedIds, updateSelection);
  return (
    <div className={styles.list} {...selectionDrag}>
      {rows.map((row) => {
        const selectable = eligibleIds.has(row.id);
        const selected = selectedSet.has(row.id);
        const contexts = selected && selectionMenu ? selectedRows : [row];
        const handleSelect = () =>
          updateSelection((current) => {
            const currentSet = new Set(current);
            return currentSet.has(row.id)
              ? current.filter((id) => id !== row.id)
              : [...current, row.id];
          });
        return (
          <SelectableRow
            key={row.id}
            selectionId={row.id}
            groupLabel={groupLabel?.(row)}
            menuLabel={menuLabel?.(row)}
            actionErrorLabel={actionErrorLabel}
            selected={selected}
            selectable={selectable}
            selectLabel={
              selectLabel?.(row, selected) ??
              `${selected ? "Deselect" : "Select"} ${typeof row.title === "string" ? row.title : row.id}`
            }
            onSelect={handleSelect}
            onSurfaceClick={() => {
              if (selectedIds.length > 0) {
                handleSelect();
              }
            }}
            menuItems={
              contexts.length > 1 && selectionActions !== undefined
                ? selectionActions
                : combineEntityRowActions(contexts, () => {
                    if (selectionMenu && selectionActions === undefined) {
                      updateSelection([]);
                    }
                  })
            }
            menuSummary={
              contexts.length > 1
                ? (menuSummary?.(contexts.length) ??
                  `${contexts.length} selected`)
                : null
            }
            variant={variant}
            icon={row.icon}
            decoration={row.decoration}
            {...(onActionError ? { onActionError } : {})}
            {...(menuContainer ? { menuContainer } : {})}
          >
            <EntityRowContent {...row} variant={variant} />
          </SelectableRow>
        );
      })}
    </div>
  );
};
export const EntityRow = ({
  variant = "default",
  onActionError,
  menuContainer,
  ...row
}: EntityRowProps) => (
  <EntityRowList
    rows={[row]}
    variant={variant}
    {...(onActionError ? { onActionError } : {})}
    {...(menuContainer ? { menuContainer } : {})}
  />
);
