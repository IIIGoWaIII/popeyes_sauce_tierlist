import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tierlist: defineTable({
    key: v.string(),
    gowa: v.any(),
    kata: v.any(),
  }).index("by_key", ["key"]),
});
