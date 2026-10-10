import { ModeFilter } from "./mode-filter.js";
import type { ModeFilterProps } from "./mode-filter.js";

export type TagFilterProps<TValue extends string = string> = Omit<
  ModeFilterProps<TValue>,
  "value" | "onChange" | "multiple" | "allowAll"
> & { value: TValue[]; onChange: (value: TValue[]) => void };
const tagSummary = (label: string, labels: readonly string[]) => {
  if (labels.length === 0) {
    return `${label}: All`;
  }
  if (labels.length === 1) {
    return `${label}: ${labels[0]}`;
  }
  return `${label}: ${labels.length} selected`;
};
export const TagFilter = <TValue extends string = string>({
  onChange,
  ...props
}: TagFilterProps<TValue>) => (
  <ModeFilter
    summarize={tagSummary}
    {...props}
    multiple
    allowAll
    onChange={(value) => onChange(Array.isArray(value) ? value : [])}
  />
);
