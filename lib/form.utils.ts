import { z } from "zod";

export const toNumber = (value: string | number | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  if (Number.isNaN(value)) {
    return undefined;
  }

  return value;
};

export const rangedNumberField = (
  label: string,
  range: { min: number; max: number },
) => {
  const rangeMessage = `${label} must be between ${range.min} and ${range.max}`;

  return z.preprocess(
    toNumber,
    z
      .number({
        error: `${label} is required`,
      })
      .min(range.min, rangeMessage)
      .max(range.max, rangeMessage),
  );
};

export const getTodayDate = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const getAgeInYears = (date: Date, today = getTodayDate()) => {
  const birthDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

export const getDateYearsAgo = (years: number, fromDate = getTodayDate()) =>
  new Date(
    fromDate.getFullYear() - years,
    fromDate.getMonth(),
    fromDate.getDate(),
  );
