// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Badge } from "../src/index.js";

describe(Badge, () => {
  afterEach(cleanup);

  it.each(["neutral", "info", "success", "warning", "critical"] as const)(
    "preserves %s tone, text, span props and ref",
    (type) => {
      const ref = createRef<HTMLSpanElement>();
      render(
        <Badge type={type} ref={ref} className="custom" title="Status">
          Ready
        </Badge>
      );
      expect(ref.current).toBe(screen.getByText("Ready"));
      expect(ref.current?.dataset.type).toBe(type);
      expect(ref.current?.title).toBe("Status");
      expect(ref.current?.classList.contains("custom")).toBeTruthy();
    }
  );
});
