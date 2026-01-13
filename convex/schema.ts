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
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    sexAtBirth: v.union(v.literal("FEMALE"), v.literal("MALE")),
    dateOfBirth: v.string(),
  }).index("by_userId", ["userId"]),

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
    source: v.union(v.literal("PATIENT"), v.literal("IMPORT")),
  })
    .index("by_patientId", ["patientId"])
    .index("by_patientId_kind", ["patientId", "kind"]),

  patientClinicalEvents: defineTable({
    patientId: v.id("patients"),
    kind: v.union(
      v.literal("DIABETES"),
      v.literal("SMOKING"),
      v.literal("ANTIHYPERTENSIVE"),
      v.literal("STATIN"),
    ),
    value: v.boolean(),
    source: v.union(v.literal("PATIENT"), v.literal("IMPORT")),
  })
    .index("by_patientId", ["patientId"])
    .index("by_patientId_kind", ["patientId", "kind"]),

  riskAssessments: defineTable({
    patientId: v.id("patients"),
    model: v.literal("PREVENT"),
    modelVersion: v.literal("2023"),
    inputSnapshot: v.any(),
    results: v.any(),
  }).index("by_patientId", ["patientId"]),
});
