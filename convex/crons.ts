import { cronJobs } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const RENDER_SERVICE_URL = "https://cv-risk-prediction.onrender.com";
const JITTER_MS = 1000 * 60 * 2;

export const wait = internalAction({
  args: {},
  returns: v.null(),
  handler: async () => {
    // noop
  },
});

export const renderKeepAlive = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const jitterMs = Math.floor(Math.random() * (JITTER_MS + 1));

    await ctx.scheduler.runAfter(jitterMs, internal.crons.wait);

    const response = await fetch(RENDER_SERVICE_URL, { method: "GET" });
    if (!response.ok) {
      console.warn(`${RENDER_SERVICE_URL} is not responding.`, {
        status: response.status,
        statusText: response.statusText,
      });
    }

    return null;
  },
});

const crons = cronJobs();

crons.interval(
  `${RENDER_SERVICE_URL} keepAlive`,
  { minutes: 12 },
  internal.crons.renderKeepAlive,
);

export default crons;
