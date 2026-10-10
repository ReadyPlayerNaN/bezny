import { useState } from "react";
import type { ReactNode } from "react";

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "../controls/context-menu.js";
import { CheckboxInput } from "../inputs/checkbox-input.js";
import type { EntityRowVariant } from "./entity-row-title.js";

import styles from "./entity-row.module.scss";

export type SelectableRowMenuItem = {
  key: string;
  label: string;
  tone?: "critical" | "secondary";
  disabled?: boolean;
} & (
  | { href: string; onSelect?: never; submenu?: never }
  | {
      href?: never;
      onSelect: () => void | Promise<void>;
      submenu?: readonly SelectableRowMenuItem[];
    }
);
export interface SelectableRowProps {
  selected: boolean;
  selectLabel: string;
  onSelect: () => void;
  onContextMenuOpen?: () => void;
  onActionError?: (error: unknown) => void;
  menuItems: readonly SelectableRowMenuItem[];
  menuSummary?: ReactNode;
  children: ReactNode;
  variant?: EntityRowVariant;
  selectDisabled?: boolean;
  selectable?: boolean;
  icon?: ReactNode;
  onSurfaceClick?: () => void;
  selectionId?: string;
  decoration?: ReactNode;
}
export const SelectableRow = ({
  selected,
  selectLabel,
  onSelect,
  onContextMenuOpen,
  onActionError,
  menuItems,
  menuSummary,
  children,
  variant = "default",
  selectDisabled = false,
  selectable = true,
  icon,
  onSurfaceClick,
  selectionId,
  decoration,
}: SelectableRowProps) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const handleAction = async (item: SelectableRowMenuItem) => {
    if (!item.onSelect) {
      return;
    }
    setBusy(item.key);
    setFailed(false);
    try {
      await item.onSelect();
      setOpen(false);
    } catch (error) {
      setFailed(true);
      setBusy(null);
      onActionError?.(error);
      return;
    }
    setBusy(null);
  };
  const renderActions = (items: readonly SelectableRowMenuItem[]): ReactNode =>
    items.map((item) => {
      const disabled = Boolean(item.disabled) || busy !== null;
      if (item.submenu?.length) {
        return (
          <ContextMenuSub key={item.key}>
            <ContextMenuSubTrigger disabled={disabled}>
              {item.label}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {renderActions(item.submenu)}
            </ContextMenuSubContent>
          </ContextMenuSub>
        );
      }
      const toneProps = item.tone ? { tone: item.tone } : {};
      if (item.href !== undefined) {
        return (
          <ContextMenuItem
            key={item.key}
            {...toneProps}
            disabled={disabled}
            asChild
          >
            <a
              href={item.href}
              onClick={(event) => {
                if (disabled) {
                  event.preventDefault();
                }
              }}
            >
              {item.label}
            </a>
          </ContextMenuItem>
        );
      }
      return (
        <ContextMenuItem
          key={item.key}
          {...toneProps}
          disabled={disabled}
          onSelect={(event) => {
            event.preventDefault();
            void handleAction(item);
          }}
        >
          {item.label}
        </ContextMenuItem>
      );
    });
  return (
    <ContextMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setFailed(false);
          onContextMenuOpen?.();
        }
      }}
    >
      <ContextMenuTrigger asChild disabled={menuItems.length === 0}>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Group delegates surface selection; actual actions remain native controls. */}
        <fieldset
          className={styles.row}
          aria-label={selectionId ? `Item ${selectionId}` : "Item"}
          data-selection-id={selectionId}
          data-selectable={selectable}
          data-select-disabled={selectDisabled}
          data-selected={selected}
          data-variant={variant}
          onClick={(event) => {
            if (
              !selectable ||
              selectDisabled ||
              !(event.target instanceof Element) ||
              event.target.closest(
                "a,button,input,textarea,select,label,[contenteditable=true]"
              )
            ) {
              return;
            }
            onSurfaceClick?.();
          }}
          onKeyDown={(event) => {
            if (
              event.target === event.currentTarget &&
              selectable &&
              !selectDisabled &&
              (event.key === " " || event.key === "Enter")
            ) {
              event.preventDefault();
              onSelect();
            }
          }}
        >
          {decoration ? (
            <div className={styles.decoration} aria-hidden="true">
              {decoration}
            </div>
          ) : null}
          {selectable || icon ? (
            <div className={styles.selection}>
              {icon ? <span aria-hidden="true">{icon}</span> : null}
              {selectable ? (
                <CheckboxInput
                  data-selection-control="true"
                  checked={selected}
                  disabled={selectDisabled}
                  aria-label={selectLabel}
                  onCheckedChange={() => onSelect()}
                />
              ) : null}
            </div>
          ) : null}
          {children}
        </fieldset>
      </ContextMenuTrigger>
      {menuItems.length > 0 ? (
        <ContextMenuContent>
          {menuSummary ? (
            <ContextMenuLabel>{menuSummary}</ContextMenuLabel>
          ) : null}
          {failed ? <div role="alert">Action failed. Please retry.</div> : null}
          {renderActions(menuItems)}
        </ContextMenuContent>
      ) : null}
    </ContextMenu>
  );
};
