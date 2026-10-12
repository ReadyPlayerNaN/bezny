import { describe, expect, it } from "vitest";

import {
  navigationAlphabet,
  navigationHintCodes,
} from "../src/admin-navigation-hint-codes.js";

const prefixFree = (codes: string[]) => {
  const sorted = codes.toSorted();
  return !sorted.slice(1).some((code, index) => {
    const previous = sorted[index];
    return previous !== undefined && code.startsWith(previous);
  });
};

describe("navigation hint codes", () => {
  it.each([0, 1, 9, 10, 81, 82, 729, 1000, 10_000])(
    "assigns %i unique prefix-free codes",
    (count) => {
      const codes = navigationHintCodes(count);
      expect(codes).toHaveLength(count);
      expect(new Set(codes).size).toBe(count);
      expect(prefixFree(codes)).toBeTruthy();
    }
  );

  it("expands beyond three letters instead of dropping targets", () => {
    expect(
      Math.max(...navigationHintCodes(1000).map((code) => code.length))
    ).toBe(4);
  });

  it("supports small configurable alphabets with stable case-insensitive assignments", () => {
    const codes = navigationHintCodes(100, "AB");
    expect(codes).toStrictEqual(navigationHintCodes(100, "ab"));
    expect(
      codes.every((code) => [...code].every((letter) => "ab".includes(letter)))
    ).toBeTruthy();
    expect(prefixFree(codes)).toBeTruthy();
  });

  it.each(["", "a", "aa", "aA", "ab1", "a b", "éa", "ſa", "Ka"])(
    "rejects invalid alphabet %s",
    (alphabet) => {
      expect(() => navigationAlphabet(alphabet)).toThrow(TypeError);
    }
  );

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid count %s",
    (count) => {
      expect(() => navigationHintCodes(count)).toThrow(RangeError);
    }
  );
});
