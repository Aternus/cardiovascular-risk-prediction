import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ⚠️ `_creationTime` is automatically added to the end of each index.

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),
  patients: defineTable({
    ownerUserId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    sexAtBirth: v.union(v.literal("FEMALE"), v.literal("MALE")),
    dateOfBirth: v.string(), // YYYY-MM-DD
    isActive: v.boolean(),
  })
    .index("by_ownerUserId", ["ownerUserId"])
    .index("by_ownerUserId_isActive", ["ownerUserId", "isActive"]),
  patientMeasurements: defineTable({
    patientId: v.id("patients"),
    kind: v.union(
      v.literal("TOTAL_CHOLESTEROL"),
      v.literal("HDL_CHOLESTEROL"),
      v.literal("SYSTOLIC_BP"),
      v.literal("BMI"),
      v.literal("EGFR"),
    ),
    value: v.number(),
    unit: v.string(),
    measuredAt: v.number(), // unix ms
    source: v.union(v.literal("CLINICIAN"), v.literal("IMPORT")),
  })
    .index("by_patientId_measuredAt", ["patientId", "measuredAt"])
    .index("by_patientId_kind_measuredAt", ["patientId", "kind", "measuredAt"]),
  patientClinicalEvents: defineTable({
    patientId: v.id("patients"),
    kind: v.union(
      v.literal("DIABETES"),
      v.literal("SMOKING_STATUS"),
      v.literal("ON_ANTIHYPERTENSIVE"),
      v.literal("ON_STATIN"),
    ),
    value: v.boolean(),
    recordedAt: v.number(), // unix ms
    source: v.union(v.literal("CLINICIAN"), v.literal("IMPORT")),
  })
    .index("by_patientId_recordedAt", ["patientId", "recordedAt"])
    .index("by_patientId_kind_recordedAt", ["patientId", "kind", "recordedAt"]),
  riskAssessments: defineTable({
    patientId: v.id("patients"),
    model: v.literal("PREVENT"),
    modelVersion: v.literal("2023"),
    inputSnapshot: v.any(),
    results: v.array(
      v.object({
        timeHorizon: v.union(v.literal("10_YEARS"), v.literal("30_YEARS")),
        setName: v.literal("RISKS"),
        setUnits: v.literal("%"),
        data: v.object({
          totalCVD: v.string(),
          ASCVD: v.string(),
          heartFailure: v.string(),
          coronaryHeartDisease: v.string(),
          stroke: v.string(),
        }),
        contributions: v.optional(
          v.array(
            v.object({
              factor: v.string(),
              value: v.number(),
              direction: v.union(v.literal("PROTECTIVE"), v.literal("HARMFUL")),
            }),
          ),
        ),
      }),
    ),
  }).index("by_patientId", ["patientId"]),
  recommendations: defineTable({
    patientId: v.id("patients"),
    assessmentId: v.id("riskAssessments"),
    rulesetId: v.string(),
    items: v.array(
      v.object({
        code: v.string(),
        title: v.string(),
        summary: v.string(),
        rationale: v.string(),
        priority: v.union(v.literal(1), v.literal(2), v.literal(3)),
        tags: v.array(v.string()),
        ruleHits: v.array(v.string()),
      }),
    ),
  }).index("by_patientId_assessmentId", ["patientId", "assessmentId"]),
});
