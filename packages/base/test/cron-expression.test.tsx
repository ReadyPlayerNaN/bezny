import { describe, expect, it } from "vitest";

import {
  buildCronExpression,
  describeCronExpression,
  parseCronExpression,
} from "../src/inputs/cron-expression.js";

describe("cron builder expression boundaries", () => {
  it.each([
    ["5 * * * *", "hourly"],
    ["59 */12 * * *", "hourly"],
    ["0 23 * * *", "daily"],
    ["15 8 * * 0,2,6", "weekly"],
    ["30 9 1,31 * *", "monthly"],
  ] as const)("round trips represented expression %s", (value, mode) => {
    const parsed = parseCronExpression(value);
    expect(parsed.mode).toBe(mode);
    expect(buildCronExpression(parsed.mode, parsed.parts)).toBe(value);
  });

  it.each([
    "",
    "invalid",
    "* * * * *",
    "60 0 * * *",
    "0 24 * * *",
    "0 */0 * * *",
    "0 */13 * * *",
    "0 0 0 * *",
    "0 0 32 * *",
    "0 0 * * 7",
    "0 0 * JAN MON",
    "0 0 1 * 1",
    "0 0 * * MON-FRI",
    "0 0 0 * * *",
  ])("retains unsupported or invalid raw source verbatim: %s", (value) => {
    const parsed = parseCronExpression(value);
    expect(parsed.mode).toBe("custom");
    expect(buildCronExpression("custom", parsed.parts)).toBe(value);
  });

  it("normalizes generated numeric lists only on explicit builder edits", () => {
    const parsed = parseCronExpression(" 05 08 * * 6,1,1 ");
    expect(parsed.parts.custom).toBe(" 05 08 * * 6,1,1 ");
    expect(buildCronExpression(parsed.mode, parsed.parts)).toBe("5 8 * * 1,6");
    expect(
      buildCronExpression("weekly", { ...parsed.parts, daysOfWeek: [] })
    ).toBe("5 8 * * *");
    expect(
      buildCronExpression("monthly", { ...parsed.parts, daysOfMonth: [] })
    ).toBe("5 8 * * *");
  });

  it("describes raw five-field schedules but leaves validation policy to the host", () => {
    expect(describeCronExpression("0 12 * * *", "Invalid")).toContain(
      "12:00 PM"
    );
    expect(describeCronExpression("* * * * *", "Invalid")).toContain(
      "Every minute"
    );
    expect(describeCronExpression("invalid", "Invalid")).toBe("Invalid");
    expect(describeCronExpression("0 0 0 * * *", "Invalid")).toBe("Invalid");
  });
});
