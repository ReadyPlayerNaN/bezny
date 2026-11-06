export interface AdminNumberConstraints {
  min?: number;
  max?: number;
  step?: number | "any";
}
/** Numeric field/command validation without silently accepting whitespace or infinities. */
export const isAdminNumberValue = (
  value: unknown,
  constraints: AdminNumberConstraints
) => {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    String(value).trim() === ""
  ) {
    return false;
  }
  const number = Number(value);
  if (
    !Number.isFinite(number) ||
    number < (constraints.min ?? -Infinity) ||
    number > (constraints.max ?? Infinity)
  ) {
    return false;
  }
  if (constraints.step === undefined || constraints.step === "any") {
    return true;
  }
  if (!Number.isFinite(constraints.step) || constraints.step <= 0) {
    return false;
  }
  const steps = (number - (constraints.min ?? 0)) / constraints.step;
  return (
    Math.abs(steps - Math.round(steps)) <=
    Number.EPSILON * Math.max(1, Math.abs(steps)) * 8
  );
};
