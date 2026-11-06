// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ModeFilter } from "../src/filters/mode-filter.js";

const Filter = ({ multiple }: { multiple: boolean }) => {
  const [value, setValue] = useState<string | string[] | null>(null);
  return (
    <ModeFilter
      label="Category"
      value={value}
      onChange={setValue}
      multiple={multiple}
      allowAll
      options={[
        { label: "Complete collection", value: "all" },
        { label: "Other collection", value: "option-0" },
      ]}
    />
  );
};

describe("mode filter label associations", () => {
  afterEach(cleanup);

  it.each([true, false])(
    "keeps the All control distinct from opaque option IDs (multiple=%s)",
    async (multiple) => {
      const user = userEvent.setup();
      render(<Filter multiple={multiple} />);
      await user.click(screen.getByRole("button", { name: "Category: All" }));
      await user.click(
        screen.getByText("Complete collection", { selector: "label" })
      );
      const trigger = screen.getByRole("button", {
        name: "Category: Complete collection",
      });
      if (!multiple) {
        await user.click(trigger);
      }
      const role = multiple ? "checkbox" : "radio";
      const selected = screen.getByRole(role, { name: "Complete collection" });
      expect(selected.getAttribute("aria-checked")).toBe("true");
      expect(
        screen.getByRole(role, { name: "All" }).getAttribute("aria-checked")
      ).toBe("false");
      await user.click(
        screen.getByText("Other collection", { selector: "label" })
      );
      expect(
        screen.getByRole("button", {
          name: multiple
            ? "Category: Complete collection, Other collection"
            : "Category: Other collection",
        })
      ).toBeTruthy();
    }
  );
});
