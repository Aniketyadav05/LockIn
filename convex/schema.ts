import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. User Profiles (New)
  users: defineTable({
    email: v.string(),
    name: v.string(),
    username: v.string(),
  })
  .index("by_email", ["email"])
  .index("by_username", ["username"]), // 👈 Ensures Uniqueness

  // 2. Live Stats (Existing)
  stats: defineTable({
    email: v.string(),
    minutes: v.number(),
    song: v.string(),
    status: v.string(),
  }).index("by_email", ["email"]),

  // 3. Links (Existing)
  links: defineTable({
    user1: v.string(),
    user2: v.string(),
    theme: v.object({
      type: v.string(),
      value: v.string(),
    }),
  })
  .index("by_user1", ["user1"])
  .index("by_user2", ["user2"]),
});