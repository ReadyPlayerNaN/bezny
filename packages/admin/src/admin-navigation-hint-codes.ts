export const defaultNavigationAlphabet = "asdfghjkl";
const alphabetPattern = /^[a-zA-Z]+$/u;

export const navigationAlphabet = (alphabet: string): string[] => {
  const letters = [...alphabet.toLowerCase()];
  if (
    !alphabetPattern.test(alphabet) ||
    letters.length < 2 ||
    new Set(letters).size !== letters.length
  ) {
    throw new TypeError(
      "Navigation hints require at least two distinct ASCII letters, without duplicates."
    );
  }
  return letters;
};

/** Expand alphabet-tree leaves in linear space. Assigned codes never prefix one another. */
export const navigationHintCodes = (
  count: number,
  alphabet = defaultNavigationAlphabet
): string[] => {
  const letters = navigationAlphabet(alphabet);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError(
      "The navigation hint count must be a non-negative safe integer."
    );
  }
  if (count === 0) {
    return [];
  }
  const codes = [...letters];
  let offset = 0;
  while (codes.length - offset < count) {
    const prefix = codes[offset];
    if (prefix === undefined) {
      throw new Error("The navigation hint tree has no expandable leaf.");
    }
    offset += 1;
    for (const letter of letters) {
      codes.push(prefix + letter);
    }
  }
  return codes.slice(offset, offset + count);
};
