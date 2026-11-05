import { Root, Trigger, Content } from "@radix-ui/react-collapsible";
import { useMemo, useState } from "react";
import type { ComponentPropsWithRef, ReactNode } from "react";

import { Button } from "../controls/button.js";
import { ToggleGroup, ToggleGroupItem } from "../inputs/toggle-group.js";
import {
  describeJsonValue,
  expandableJsonPaths,
  jsonPointerChild,
  stringifyJsonValue,
} from "./json-value.js";

import styles from "./json-viewer.module.scss";

export type JsonViewerMode = "tree" | "raw";
export interface JsonViewerLeafRenderContext {
  value: unknown;
  /** Displayed key; array indices use brackets. Null at the document root. */
  key: string | null;
  formattedValue: string;
  /** RFC 6901 pointer: empty at root, escaped ~0 and ~1 in tokens. */
  path: string;
}
export interface JsonViewerLabels {
  tree: string;
  raw: string;
  mode: string;
  expandAll: string;
  collapseAll: string;
  root: string;
}
export type JsonViewerProps = Omit<
  ComponentPropsWithRef<"section">,
  "children"
> & {
  value: unknown;
  defaultMode?: JsonViewerMode;
  label?: string;
  labels?: Partial<JsonViewerLabels>;
  renderLeaf?: (context: JsonViewerLeafRenderContext) => ReactNode | undefined;
};

const defaultLabels: JsonViewerLabels = {
  collapseAll: "Collapse all",
  expandAll: "Expand all",
  mode: "JSON viewer mode",
  raw: "Raw",
  root: "Root",
  tree: "Tree",
};

interface JsonNodeProps {
  value: unknown;
  path: string;
  label: string | null;
  rootLabel: string;
  expandedPaths: ReadonlySet<string>;
  onExpandedChange: (path: string, expanded: boolean) => void;
  ancestors: readonly object[];
  renderLeaf: JsonViewerProps["renderLeaf"];
}

const JsonNode = ({
  value,
  path,
  label,
  rootLabel,
  expandedPaths,
  onExpandedChange,
  ancestors,
  renderLeaf,
}: JsonNodeProps) => {
  const descriptor = describeJsonValue(value, ancestors);
  if (descriptor.kind === "leaf") {
    const rendered = renderLeaf?.({
      formattedValue: descriptor.label,
      key: label,
      path,
      value,
    });
    return (
      <div className={styles.leaf}>
        {label === null ? null : <span className={styles.key}>{label}: </span>}
        <span>{rendered ?? descriptor.label}</span>
      </div>
    );
  }
  const expanded = expandedPaths.has(path);
  const nextAncestors =
    typeof value === "object" && value !== null
      ? [...ancestors, value]
      : ancestors;
  return (
    <Root open={expanded} onOpenChange={(open) => onExpandedChange(path, open)}>
      <Trigger className={styles.branch}>
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        <span className={styles.key}>{label ?? rootLabel}:</span>{" "}
        <span>{descriptor.label}</span>
      </Trigger>
      <Content forceMount hidden={!expanded} className={styles.children}>
        {expanded
          ? descriptor.children.map((child) => {
              const childPath = jsonPointerChild(path, child.key);
              return (
                <JsonNode
                  key={childPath}
                  value={child.value}
                  path={childPath}
                  label={
                    descriptor.kind === "array" ? `[${child.key}]` : child.key
                  }
                  rootLabel={rootLabel}
                  expandedPaths={expandedPaths}
                  onExpandedChange={onExpandedChange}
                  ancestors={nextAncestors}
                  renderLeaf={renderLeaf}
                />
              );
            })
          : null}
      </Content>
    </Root>
  );
};

/** Read-only JSON presentation; custom leaf content and domain annotations remain host-owned. */
export const JsonViewer = ({
  value,
  defaultMode = "tree",
  label = "JSON value",
  labels: labelOverrides,
  renderLeaf,
  className,
  dir,
  ...props
}: JsonViewerProps) => {
  const labels = { ...defaultLabels, ...labelOverrides };
  const [mode, setMode] = useState<JsonViewerMode>(defaultMode);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set([""])
  );
  const rawText = useMemo(() => stringifyJsonValue(value), [value]);
  const onExpandedChange = (path: string, expanded: boolean) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (expanded) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });
  };
  return (
    <section
      aria-label={label}
      dir={dir}
      {...props}
      className={[styles.viewer, className].filter(Boolean).join(" ")}
    >
      <div className={styles.toolbar}>
        <ToggleGroup
          type="single"
          dir={dir === "ltr" || dir === "rtl" ? dir : undefined}
          value={mode}
          aria-label={labels.mode}
          onValueChange={(next) => {
            if (next === "tree" || next === "raw") {
              setMode(next);
            }
          }}
        >
          <ToggleGroupItem value="tree">{labels.tree}</ToggleGroupItem>
          <ToggleGroupItem value="raw">{labels.raw}</ToggleGroupItem>
        </ToggleGroup>
        <Button
          size="small"
          variant="secondary"
          disabled={mode !== "tree"}
          onClick={() => setExpandedPaths(expandableJsonPaths(value))}
        >
          {labels.expandAll}
        </Button>
        <Button
          size="small"
          variant="secondary"
          disabled={mode !== "tree"}
          onClick={() => setExpandedPaths(new Set())}
        >
          {labels.collapseAll}
        </Button>
      </div>
      {mode === "tree" ? (
        <div className={styles.tree}>
          <JsonNode
            value={value}
            path=""
            label={null}
            rootLabel={labels.root}
            expandedPaths={expandedPaths}
            onExpandedChange={onExpandedChange}
            ancestors={[]}
            renderLeaf={renderLeaf}
          />
        </div>
      ) : (
        <pre
          className={styles.raw}
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Raw JSON needs a tab stop for keyboard scrolling.
          tabIndex={0}
          aria-label={labels.raw}
        >
          <code>{rawText}</code>
        </pre>
      )}
    </section>
  );
};
