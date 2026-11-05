import { useComposedRefs } from "@radix-ui/react-compose-refs";
import { useId, useRef, useState } from "react";
import type { ComponentPropsWithRef, DragEvent } from "react";

import { Button } from "../controls/button.js";

import styles from "./file-dropzone.module.scss";

export interface FileDropzoneLabels {
  choose: string;
  drop: string;
  clear: string;
}
export type FileDropzoneProps = Omit<
  ComponentPropsWithRef<"input">,
  | "type"
  | "value"
  | "defaultValue"
  | "multiple"
  | "onChange"
  | "children"
  | "required"
> & {
  value: File | null;
  onValueChange: (file: File | null) => void;
  labels?: Partial<FileDropzoneLabels>;
  formatSize?: (bytes: number) => string;
};
const defaults: FileDropzoneLabels = {
  choose: "Choose a file",
  clear: "Clear file",
  drop: "or drop it here",
};
const sizeFormatter = new Intl.NumberFormat();
const defaultFormatSize = (bytes: number) =>
  `${sizeFormatter.format(bytes)} bytes`;

/** Single-file selection only; the host owns validation, RHF binding, and upload. */
export const FileDropzone = ({
  value,
  onValueChange,
  disabled = false,
  labels: overrides,
  formatSize = defaultFormatSize,
  className,
  ref,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  ...props
}: FileDropzoneProps) => {
  const labels = { ...defaults, ...overrides };
  const input = useRef<HTMLInputElement>(null);
  const composedRef = useComposedRefs(input, ref);
  const summaryId = useId();
  const [dragging, setDragging] = useState(false);
  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
    setDragging(!disabled);
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const [file] = event.dataTransfer.files;
    if (!disabled && file) {
      onValueChange(file);
    }
  };
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      data-disabled={disabled || undefined}
    >
      <div
        className={styles.target}
        data-dragging={(!disabled && dragging) || undefined}
        onDragOver={onDragOver}
        onDragLeave={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            setDragging(false);
          }
        }}
        onDrop={onDrop}
      >
        <input
          {...props}
          ref={composedRef}
          type="file"
          multiple={false}
          disabled={disabled}
          className={styles.input}
          aria-label={ariaLabel ?? labels.choose}
          aria-describedby={
            [describedBy, value ? summaryId : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
          onChange={(event) => {
            const [file] = event.currentTarget.files ?? [];
            event.currentTarget.value = "";
            if (!disabled && file) {
              onValueChange(file);
            }
          }}
        />
        <span className={styles.primary}>{labels.choose}</span>
        <span className={styles.secondary}>{labels.drop}</span>
      </div>
      {value ? (
        <div className={styles.selection}>
          <output id={summaryId} className={styles.summary}>
            <span>{value.name}</span>
            <span>{formatSize(value.size)}</span>
          </output>
          <Button
            variant="secondary"
            size="small"
            disabled={disabled}
            onClick={() => {
              onValueChange(null);
              if (input.current) {
                input.current.value = "";
                input.current.focus();
              }
            }}
          >
            {labels.clear}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
