import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const STATE_KEY = "main";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("tierlist")
      .withIndex("by_key", (q) => q.eq("key", STATE_KEY))
      .unique();
    if (!row) return null;
    return { gowa: row.gowa, kata: row.kata };
  },
});

export const save = mutation({
  args: { gowa: v.any(), kata: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tierlist")
      .withIndex("by_key", (q) => q.eq("key", STATE_KEY))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { gowa: args.gowa, kata: args.kata });
    } else {
      await ctx.db.insert("tierlist", {
        key: STATE_KEY,
        gowa: args.gowa,
        kata: args.kata,
      });
    }
  },
});
