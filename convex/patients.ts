import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { CLINICAL_EVENT_KIND, PATIENT_MEASUREMENT_KIND } from "./common/consts";
import { patientProfileSchema } from "./validators/patients";

import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import type {
  TClinicalEventKind,
  TPatientMeasurementKind,
} from "./common/types";
import type { TSexAtBirth } from "./validators/patients";
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

export const getOnboardingData = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      profile: v.object({
        firstName: v.string(),
        lastName: v.string(),
        sexAtBirth: v.union(v.literal("FEMALE"), v.literal("MALE")),
        dateOfBirth: v.string(),
      }),
      measurements: v.object({
        totalCholesterol: v.union(v.number(), v.null()),
        hdlCholesterol: v.union(v.number(), v.null()),
        systolicBP: v.union(v.number(), v.null()),
        bmi: v.union(v.number(), v.null()),
        eGFR: v.union(v.number(), v.null()),
      }),
      clinical: v.object({
        isDiabetes: v.union(v.boolean(), v.null()),
        isSmoker: v.union(v.boolean(), v.null()),
        isTakingAntihypertensive: v.union(v.boolean(), v.null()),
        isTakingStatin: v.union(v.boolean(), v.null()),
      }),
    }),
  ),
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
      return null;
    }

    const [measurements, clinical] = await Promise.all([
      getLatestMeasurements(ctx, patient._id),
      getLatestClinicalEvents(ctx, patient._id),
    ]);

    return {
      profile: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        sexAtBirth: patient.sexAtBirth,
        dateOfBirth: patient.dateOfBirth,
      },
      measurements: {
        totalCholesterol: measurements.TOTAL_CHOLESTEROL,
        hdlCholesterol: measurements.HDL_CHOLESTEROL,
        systolicBP: measurements.SYSTOLIC_BP,
        bmi: measurements.BMI,
        eGFR: measurements.EGFR,
      },
      clinical: {
        isDiabetes: clinical.DIABETES,
        isSmoker: clinical.SMOKING,
        isTakingAntihypertensive: clinical.ANTIHYPERTENSIVE,
        isTakingStatin: clinical.STATIN,
      },
    };
  },
});

export const upsertProfile = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    sexAtBirth: v.string(),
    dateOfBirth: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError({ kind: "auth", message: "Not authenticated" });
    }

    const parsed = patientProfileSchema.safeParse(args);
    if (!parsed.success) {
      const fieldErrors: TFieldError[] = parsed.error.issues.map((issue) => ({
        field: issue.path[0] ? String(issue.path[0]) : "form",
        message: issue.message,
      }));
      throw new ConvexError({ kind: "validation", fieldErrors });
    }

    const existing = await ctx.db
      .query("patients")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const profileData = {
      ...parsed.data,
      sexAtBirth: parsed.data.sexAtBirth as TSexAtBirth,
    };

    if (existing) {
      await ctx.db.patch(existing._id, profileData);
      return null;
    }

    await ctx.db.insert("patients", {
      userId,
      ...profileData,
    });

    return null;
  },
});
