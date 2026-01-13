import { z } from "zod";

import { getAgeInYearsUTC } from "./form";

export const PATIENT_PROFILE_LIMITS = {
  age: { min: 30, max: 79 },
  name: { min: 2, max: 255 },
} as const;

const SEX_AT_BIRTH_VALUES = ["FEMALE", "MALE"] as const;

export type TSexAtBirth = (typeof SEX_AT_BIRTH_VALUES)[number];

export const SEX_AT_BIRTH_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

const DATE_OF_BIRTH_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .min(
      PATIENT_PROFILE_LIMITS.name.min,
      `${label} must be at least ${PATIENT_PROFILE_LIMITS.name.min} characters`,
    )
    .max(
      PATIENT_PROFILE_LIMITS.name.max,
      `${label} must be at most ${PATIENT_PROFILE_LIMITS.name.max} characters`,
    );

const sexAtBirthSchema = z
  .string()
  .min(1, "Sex at birth is required")
  .refine(
    (value) =>
      SEX_AT_BIRTH_VALUES.includes(
        value as (typeof SEX_AT_BIRTH_VALUES)[number],
      ),
    "Sex at birth must be a valid option",
  );

const dateOfBirthSchema = z
  .string()
  .trim()
  .min(1, "Date of Birth is required")
  .superRefine((value, ctx) => {
    if (value.length === 0) {
      return;
    }

    if (!DATE_OF_BIRTH_REGEX.test(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date of Birth must be in YYYY-MM-DD format",
      });
      return;
    }

    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid date of birth",
      });
      return;
    }

    const age = getAgeInYearsUTC(parsed);
    if (
      age < PATIENT_PROFILE_LIMITS.age.min ||
      age > PATIENT_PROFILE_LIMITS.age.max
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Age must be between ${PATIENT_PROFILE_LIMITS.age.min} and ${PATIENT_PROFILE_LIMITS.age.max}`,
      });
    }
  });

export const patientProfileSchema = z.object({
  firstName: nameSchema("First Name"),
  lastName: nameSchema("Last Name"),
  sexAtBirth: sexAtBirthSchema,
  dateOfBirth: dateOfBirthSchema,
});
