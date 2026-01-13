import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";

import type { FieldError } from "../lib/validators/types";

const FIELD_RANGES = {
  totalCholesterol: { min: 130, max: 320 },
  hdlCholesterol: { min: 20, max: 100 },
  systolicBP: { min: 90, max: 200 },
  bmi: { min: 18.5, max: 39.9 },
  eGFR: { min: 15, max: 150 },
} as const;

const validateRange = (
  errors: FieldError[],
  field: string,
  label: string,
  value: number,
  range: { min: number; max: number },
) => {
  if (value < range.min || value > range.max) {
    errors.push({
      field,
      message: `${label} must be between ${range.min} and ${range.max}`,
    });
  }
};

export const upsertIntake = mutation({
  args: {
    totalCholesterol: v.number(),
    hdlCholesterol: v.number(),
    systolicBP: v.number(),
    bmi: v.number(),
    eGFR: v.number(),
    isDiabetes: v.boolean(),
    isSmoker: v.boolean(),
    isTakingAntihypertensive: v.boolean(),
    isTakingStatin: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ kind: "auth", message: "Not authenticated" });
    }

    const errors: FieldError[] = [];
    validateRange(
      errors,
      "totalCholesterol",
      "Total cholesterol",
      args.totalCholesterol,
      FIELD_RANGES.totalCholesterol,
    );
    validateRange(
      errors,
      "hdlCholesterol",
      "HDL cholesterol",
      args.hdlCholesterol,
      FIELD_RANGES.hdlCholesterol,
    );
    validateRange(
      errors,
      "systolicBP",
      "Systolic BP",
      args.systolicBP,
      FIELD_RANGES.systolicBP,
    );
    validateRange(errors, "bmi", "BMI", args.bmi, FIELD_RANGES.bmi);
    validateRange(errors, "eGFR", "eGFR", args.eGFR, FIELD_RANGES.eGFR);

    if (errors.length > 0) {
      throw new ConvexError({ kind: "validation", fieldErrors: errors });
    }

    const patient = await ctx.db
      .query("patients")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .unique();

    if (!patient) {
      throw new ConvexError({
        kind: "not_found",
        message: "Patient profile not found",
      });
    }

    const measurements = [
      {
        kind: "TOTAL_CHOLESTEROL",
        value: args.totalCholesterol,
        unit: "mg/dL",
      },
      {
        kind: "HDL_CHOLESTEROL",
        value: args.hdlCholesterol,
        unit: "mg/dL",
      },
      { kind: "SYSTOLIC_BP", value: args.systolicBP, unit: "mmHg" },
      { kind: "BMI", value: args.bmi, unit: "kg/m2" },
      { kind: "EGFR", value: args.eGFR, unit: "mL/min/1.73 m2" },
    ] as const;

    for (const measurement of measurements) {
      await ctx.db.insert("patientMeasurements", {
        patientId: patient._id,
        kind: measurement.kind,
        value: measurement.value,
        unit: measurement.unit,
        source: "PATIENT",
      });
    }

    const events = [
      { kind: "DIABETES", value: args.isDiabetes },
      { kind: "SMOKING", value: args.isSmoker },
      { kind: "ANTIHYPERTENSIVE", value: args.isTakingAntihypertensive },
      { kind: "STATIN", value: args.isTakingStatin },
    ] as const;

    for (const event of events) {
      await ctx.db.insert("patientClinicalEvents", {
        patientId: patient._id,
        kind: event.kind,
        value: event.value,
        source: "PATIENT",
      });
    }

    return null;
  },
});
