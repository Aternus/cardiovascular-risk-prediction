import type { TFieldError } from "./types";

export function validateRange(
  errors: TFieldError[],
  field: string,
  label: string,
  value: number,
  range: { min: number; max: number },
) {
  if (value < range.min || value > range.max) {
    errors.push({
      field,
      message: `${label} must be between ${range.min} and ${range.max}`,
    });
  }
}

export function getAgeInYearsUTC(date: Date, today = new Date()) {
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - date.getUTCMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getUTCDate() < date.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}
