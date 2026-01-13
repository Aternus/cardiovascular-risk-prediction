import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";

export const createRiskAssessment = mutation({
  args: {
    inputSnapshot: v.any(),
    results: v.any(),
  },
  returns: v.id("riskAssessments"),
  handler: async (ctx, args) => {
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

    return await ctx.db.insert("riskAssessments", {
      patientId: patient._id,
      model: "PREVENT",
      modelVersion: "2023",
      inputSnapshot: args.inputSnapshot,
      results: args.results,
    });
  },
});
