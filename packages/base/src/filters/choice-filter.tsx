import { ModeFilter } from "./mode-filter.js";
import type { ModeFilterProps } from "./mode-filter.js";

export type ChoiceFilterProps<TValue extends string = string> = Omit<
  ModeFilterProps<TValue>,
  "value" | "onChange" | "multiple" | "allowAll"
> & { value: TValue | null; onChange: (value: TValue | null) => void };
export const ChoiceFilter = <TValue extends string = string>({
  onChange,
  ...props
}: ChoiceFilterProps<TValue>) => (
  <ModeFilter
    {...props}
    onChange={(value) => {
      if (!Array.isArray(value)) {
        onChange(value);
      }
    }}
  />
);
