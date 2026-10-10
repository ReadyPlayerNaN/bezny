import { useState } from "react";
import type { ReactNode } from "react";

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
export type EntityRowProps = EntityRowData & { variant?: EntityRowVariant };
export const EntityRow = ({
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
  variant?: EntityRowVariant;
  onActionError?: (error: unknown) => void;
}
export const EntityRowList = ({
  rows,
  variant = "default",
  onActionError,
}: EntityRowListProps) => {
  const [storedIds, setStoredIds] = useState<string[]>([]);
  const eligibleIds = new Set<string>();
  for (const row of rows) {
    if (hasSharedActions(row.actions)) {
      eligibleIds.add(row.id);
    }
  }
  const selectedIds = storedIds.filter((id) => eligibleIds.has(id));
  if (storedIds.length !== selectedIds.length) {
    setStoredIds(selectedIds);
  }
  const selectedSet = new Set(selectedIds);
  const selectedRows = rows.filter((row) => selectedSet.has(row.id));
  const selectionDrag = useRowSelectionDrag(selectedIds, setStoredIds);
  return (
    <div className={styles.list} {...selectionDrag}>
      {rows.map((row) => {
        const selectable = eligibleIds.has(row.id);
        const selected = selectedSet.has(row.id);
        const contexts = selected ? selectedRows : [row];
        const handleSelect = () =>
          setStoredIds((current) => {
            const currentSet = new Set(current);
            return currentSet.has(row.id)
              ? current.filter((id) => id !== row.id)
              : [...current, row.id];
          });
        return (
          <SelectableRow
            key={row.id}
            selectionId={row.id}
            selected={selected}
            selectable={selectable}
            selectLabel={`${selected ? "Deselect" : "Select"} ${typeof row.title === "string" ? row.title : row.id}`}
            onSelect={handleSelect}
            onSurfaceClick={() => {
              if (selectedIds.length > 0) {
                handleSelect();
              }
            }}
            menuItems={combineEntityRowActions(contexts, () =>
              setStoredIds([])
            )}
            menuSummary={
              contexts.length > 1 ? `${contexts.length} selected` : null
            }
            variant={variant}
            icon={row.icon}
            decoration={row.decoration}
            {...(onActionError ? { onActionError } : {})}
          >
            <EntityRow {...row} variant={variant} />
          </SelectableRow>
        );
      })}
    </div>
  );
};
