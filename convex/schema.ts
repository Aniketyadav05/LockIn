import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()), // 👈 Add this
    tag: v.optional(v.string()),
    username: v.string(),
    // We add cumulative stats here for fast lookup
    totalMinutes: v.optional(v.number()), 
    level: v.optional(v.number()),
  })
  .index("by_email", ["email"])
  .index("by_username", ["username"]),

  // ☁️ NEW: SHARED SESSION HISTORY
  sessions: defineTable({
    userEmail: v.string(),
    duration: v.number(),
    type: v.string(), // "Focus" or "Stopwatch"
    timestamp: v.number(),
  })
  .index("by_user", ["userEmail"])
  .index("by_time", ["timestamp"]),

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