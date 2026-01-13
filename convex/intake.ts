import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { CLINICAL_EVENT_KIND, PATIENT_MEASUREMENT_KIND } from "./common/consts";
import { validateRange } from "./validators/form";
import { PATIENT_MEASUREMENT_LIMITS } from "./validators/intake";

import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import type {
  TClinicalEventKind,
  TPatientMeasurementKind,
} from "./common/types";
import type { TFieldError } from "./validators/types";

const getLatestMeasurements = async (
  ctx: QueryCtx,
  patientId: Id<"patients">,
) => {
  const latest: Record<TPatientMeasurementKind, number | null> = {
    TOTAL_CHOLESTEROL: null,
    HDL_CHOLESTEROL: null,
    SYSTOLIC_BP: null,
    BMI: null,
    EGFR: null,
  };

  let remaining = PATIENT_MEASUREMENT_KIND.length;
  for await (const measurement of ctx.db
    .query("patientMeasurements")
    .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
    .order("desc")) {
    const kind = measurement.kind as TPatientMeasurementKind;
    if (latest[kind] === null) {
      latest[kind] = measurement.value;
      remaining -= 1;
      if (remaining === 0) {
        break;
      }
    }
  }

  return latest;
};

const getLatestClinicalEvents = async (
  ctx: QueryCtx,
  patientId: Id<"patients">,
) => {
  const latest: Record<TClinicalEventKind, boolean | null> = {
    DIABETES: null,
    SMOKING: null,
    ANTIHYPERTENSIVE: null,
    STATIN: null,
  };

  let remaining = CLINICAL_EVENT_KIND.length;
  for await (const event of ctx.db
    .query("patientClinicalEvents")
    .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
    .order("desc")) {
    const kind = event.kind as TClinicalEventKind;
    if (latest[kind] === null) {
      latest[kind] = event.value;
      remaining -= 1;
      if (remaining === 0) {
        break;
      }
    }
  }

  return latest;
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
    const userId = await getAuthUserId(ctx);

    if (!userId) {
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
      .withIndex("by_userId", (q) => q.eq("userId", userId))
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

export const getIntake = query({
  args: {},
  returns: {
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
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError({ kind: "auth", message: "Not authenticated" });
    }

    const patient = await ctx.db
      .query("patients")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!patient) {
      throw new ConvexError({
        kind: "not_found",
        message: "Patient profile not found",
      });
    }

    const [measurements, clinical] = await Promise.all([
      getLatestMeasurements(ctx, patient._id),
      getLatestClinicalEvents(ctx, patient._id),
    ]);

    if (
      measurements.TOTAL_CHOLESTEROL === null ||
      measurements.HDL_CHOLESTEROL === null ||
      measurements.SYSTOLIC_BP === null ||
      measurements.BMI === null ||
      measurements.EGFR === null ||
      clinical.DIABETES === null ||
      clinical.SMOKING === null ||
      clinical.ANTIHYPERTENSIVE === null ||
      clinical.STATIN === null
    ) {
      throw new ConvexError({
        kind: "not_found",
        message: "Patient intake data not found",
      });
    }

    return {
      totalCholesterol: measurements.TOTAL_CHOLESTEROL,
      hdlCholesterol: measurements.HDL_CHOLESTEROL,
      systolicBP: measurements.SYSTOLIC_BP,
      bmi: measurements.BMI,
      eGFR: measurements.EGFR,
      isDiabetes: clinical.DIABETES,
      isSmoker: clinical.SMOKING,
      isTakingAntihypertensive: clinical.ANTIHYPERTENSIVE,
      isTakingStatin: clinical.STATIN,
    };
  },
});
