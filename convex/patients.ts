import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

type SexAtBirth = "FEMALE" | "MALE";
type MeasurementKind =
  | "TOTAL_CHOLESTEROL"
  | "HDL_CHOLESTEROL"
  | "SYSTOLIC_BP"
  | "BMI"
  | "EGFR";
type MeasurementSource = "CLINICIAN" | "IMPORT";
type ClinicalEventKind =
  | "DIABETES"
  | "SMOKING_STATUS"
  | "ON_ANTIHYPERTENSIVE"
  | "ON_STATIN";
type ClinicalEventSource = "CLINICIAN" | "IMPORT";
type RiskCategory = "LOW" | "BORDERLINE" | "INTERMEDIATE" | "HIGH";

type PatientDTO = {
  id: Id<"patients">;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sexAtBirth: SexAtBirth;
  isActive: boolean;
  updatedAt: number;
};

type PatientMeasurementDTO = {
  id: Id<"patientMeasurements">;
  patientId: Id<"patients">;
  kind: MeasurementKind;
  value: number;
  unit: string;
  measuredAt: number;
  source: MeasurementSource;
  updatedAt: number;
};

type PatientClinicalEventDTO = {
  id: Id<"patientClinicalEvents">;
  patientId: Id<"patients">;
  kind: ClinicalEventKind;
  value: boolean;
  recordedAt: number;
  source: ClinicalEventSource;
  updatedAt: number;
};

type PatientListItemDTO = {
  id: Id<"patients">;
  firstName: string;
  lastName: string;
  latestRisk: {
    riskCategory: RiskCategory;
    totalCVD: string;
  } | null;
};

const sexAtBirthValidator = v.union(v.literal("FEMALE"), v.literal("MALE"));
const measurementKindValidator = v.union(
  v.literal("TOTAL_CHOLESTEROL"),
  v.literal("HDL_CHOLESTEROL"),
  v.literal("SYSTOLIC_BP"),
  v.literal("BMI"),
  v.literal("EGFR"),
);
const measurementSourceValidator = v.union(
  v.literal("CLINICIAN"),
  v.literal("IMPORT"),
);
const clinicalEventKindValidator = v.union(
  v.literal("DIABETES"),
  v.literal("SMOKING_STATUS"),
  v.literal("ON_ANTIHYPERTENSIVE"),
  v.literal("ON_STATIN"),
);
const clinicalEventSourceValidator = v.union(
  v.literal("CLINICIAN"),
  v.literal("IMPORT"),
);
const riskCategoryValidator = v.union(
  v.literal("LOW"),
  v.literal("BORDERLINE"),
  v.literal("INTERMEDIATE"),
  v.literal("HIGH"),
);

const patientCreateValidator = v.object({
  firstName: v.string(),
  lastName: v.string(),
  dateOfBirth: v.string(),
  sexAtBirth: sexAtBirthValidator,
});

const measurementCreateValidator = v.object({
  kind: measurementKindValidator,
  value: v.number(),
  unit: v.string(),
  measuredAt: v.number(),
  source: measurementSourceValidator,
});

const clinicalEventCreateValidator = v.object({
  kind: clinicalEventKindValidator,
  value: v.boolean(),
  recordedAt: v.number(),
  source: clinicalEventSourceValidator,
});

const patientDTOValidator = v.object({
  id: v.id("patients"),
  firstName: v.string(),
  lastName: v.string(),
  dateOfBirth: v.string(),
  sexAtBirth: sexAtBirthValidator,
  isActive: v.boolean(),
  updatedAt: v.number(),
});

const measurementDTOValidator = v.object({
  id: v.id("patientMeasurements"),
  patientId: v.id("patients"),
  kind: measurementKindValidator,
  value: v.number(),
  unit: v.string(),
  measuredAt: v.number(),
  source: measurementSourceValidator,
  updatedAt: v.number(),
});

const clinicalEventDTOValidator = v.object({
  id: v.id("patientClinicalEvents"),
  patientId: v.id("patients"),
  kind: clinicalEventKindValidator,
  value: v.boolean(),
  recordedAt: v.number(),
  source: clinicalEventSourceValidator,
  updatedAt: v.number(),
});

const patientListItemValidator = v.object({
  id: v.id("patients"),
  firstName: v.string(),
  lastName: v.string(),
  latestRisk: v.union(
    v.object({
      riskCategory: riskCategoryValidator,
      totalCVD: v.string(),
    }),
    v.null(),
  ),
});

export const listPatients = query({
  args: {},
  returns: v.array(patientListItemValidator),
  handler: async (ctx): Promise<PatientListItemDTO[]> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const patients = await ctx.db
      .query("patients")
      .withIndex("by_ownerUserId_isActive", (q) =>
        q.eq("ownerUserId", userId).eq("isActive", true),
      )
      .order("desc")
      .collect();

    return patients.map((patient) => ({
      id: patient._id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      latestRisk: null,
    }));
  },
});

export const createPatientWithIntake = mutation({
  args: {
    patient: patientCreateValidator,
    measurements: v.optional(v.array(measurementCreateValidator)),
    clinicalEvents: v.optional(v.array(clinicalEventCreateValidator)),
  },
  returns: v.object({
    patient: patientDTOValidator,
    measurements: v.array(measurementDTOValidator),
    clinicalEvents: v.array(clinicalEventDTOValidator),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    patient: PatientDTO;
    measurements: PatientMeasurementDTO[];
    clinicalEvents: PatientClinicalEventDTO[];
  }> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated.");
    }

    const firstName = args.patient.firstName.trim();
    const lastName = args.patient.lastName.trim();
    if (!firstName || !lastName) {
      throw new Error("Patient name is required.");
    }

    const now = Date.now();
    const patientId = await ctx.db.insert("patients", {
      ownerUserId: userId,
      firstName,
      lastName,
      dateOfBirth: args.patient.dateOfBirth,
      sexAtBirth: args.patient.sexAtBirth,
      isActive: true,
    });

    const measurements: PatientMeasurementDTO[] = [];
    for (const measurement of args.measurements ?? []) {
      const measurementId = await ctx.db.insert("patientMeasurements", {
        patientId,
        ...measurement,
      });
      measurements.push({
        id: measurementId,
        patientId,
        ...measurement,
        updatedAt: now,
      });
    }

    const clinicalEvents: PatientClinicalEventDTO[] = [];
    for (const event of args.clinicalEvents ?? []) {
      const eventId = await ctx.db.insert("patientClinicalEvents", {
        patientId,
        ...event,
      });
      clinicalEvents.push({
        id: eventId,
        patientId,
        ...event,
        updatedAt: now,
      });
    }

    return {
      patient: {
        id: patientId,
        firstName,
        lastName,
        dateOfBirth: args.patient.dateOfBirth,
        sexAtBirth: args.patient.sexAtBirth,
        isActive: true,
        updatedAt: now,
      },
      measurements,
      clinicalEvents,
    };
  },
});
