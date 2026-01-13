import { ConvexError, v } from "convex/values";

import { patientProfileSchema } from "../lib/validators/patientProfile";
import { mutation } from "./_generated/server";

import type { SexAtBirth } from "../lib/validators/patientProfile";
import type { FieldError } from "../lib/validators/types";

export const upsertProfile = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    sexAtBirth: v.string(),
    dateOfBirth: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ kind: "auth", message: "Not authenticated" });
    }

    const parsed = patientProfileSchema.safeParse(args);
    if (!parsed.success) {
      const fieldErrors: FieldError[] = parsed.error.issues.map((issue) => ({
        field: issue.path[0] ? String(issue.path[0]) : "form",
        message: issue.message,
      }));
      throw new ConvexError({ kind: "validation", fieldErrors });
    }

    const userId = identity.tokenIdentifier;
    const existing = await ctx.db
      .query("patients")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const profileData = {
      ...parsed.data,
      sexAtBirth: parsed.data.sexAtBirth as SexAtBirth,
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
