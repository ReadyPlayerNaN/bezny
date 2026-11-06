import { CheckboxInput, FieldLabel } from "@bezny/base";
import { useId } from "react";
import { useController } from "react-hook-form";

import type { AdminCommand } from "./admin-entity-model.js";
import {
  adminFilterSelectionLimit,
  decodeAdminFilterSelection,
  encodeAdminFilterSelection,
} from "./admin-filter-values.js";

import styles from "./admin-collection.module.scss";

export const AdminCommandMultiChoice = ({
  input,
}: {
  input: NonNullable<AdminCommand["input"]>;
}) => {
  const id = useId();
  const { field } = useController<{ value: string }>({ name: "value" });
  const selected = decodeAdminFilterSelection(field.value);
  const selectedSet = new Set(selected);
  return (
    <fieldset className={styles.choiceEditor}>
      <legend>{input.label}</legend>
      {input.options?.map((option, index) => {
        const checked = selectedSet.has(option.value);
        return (
          <div key={option.value}>
            <CheckboxInput
              id={`${id}-${index}`}
              ref={index === 0 ? field.ref : undefined}
              autoFocus={index === 0}
              checked={checked}
              disabled={
                !checked && selected.length >= adminFilterSelectionLimit
              }
              onBlur={() => field.onBlur()}
              onCheckedChange={(next) =>
                field.onChange(
                  encodeAdminFilterSelection(
                    next
                      ? [...selected, option.value]
                      : selected.filter((value) => value !== option.value)
                  )
                )
              }
            />
            <FieldLabel htmlFor={`${id}-${index}`}>{option.label}</FieldLabel>
          </div>
        );
      })}
    </fieldset>
  );
};
