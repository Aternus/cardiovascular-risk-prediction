import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";
import { validateRange } from "./validators/form";
import { PATIENT_MEASUREMENT_LIMITS } from "./validators/intake";

import type { TFieldError } from "./validators/types";

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

    const errors: TFieldError[] = [];
    validateRange(
      errors,
      "totalCholesterol",
      "Total cholesterol",
      args.totalCholesterol,
      PATIENT_MEASUREMENT_LIMITS.totalCholesterol,
    );
    validateRange(
      errors,
      "hdlCholesterol",
      "HDL cholesterol",
      args.hdlCholesterol,
      PATIENT_MEASUREMENT_LIMITS.hdlCholesterol,
    );
    validateRange(
      errors,
      "systolicBP",
      "Systolic BP",
      args.systolicBP,
      PATIENT_MEASUREMENT_LIMITS.systolicBP,
    );
    validateRange(
      errors,
      "bmi",
      "BMI",
      args.bmi,
      PATIENT_MEASUREMENT_LIMITS.bmi,
    );
    validateRange(
      errors,
      "eGFR",
      "eGFR",
      args.eGFR,
      PATIENT_MEASUREMENT_LIMITS.eGFR,
    );

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
