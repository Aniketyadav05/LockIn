import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const registerUser = mutation({
  args: { email: v.string(), name: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", args.username)).first();
    if (existingUser) return { success: false, message: "Username taken" };

    const existingEmail = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (existingEmail) {
        await ctx.db.patch(existingEmail._id, { name: args.name, username: args.username });
    } else {
        await ctx.db.insert("users", { ...args, level: 1, totalMinutes: 0 });
    }
    return { success: true };
  },
});

export const getUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
  }
});

export const resolveInvite = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_username", q => q.eq("username", args.username)).first();
    return user ? { email: user.email, name: user.name } : null;
  }
});

export const addFriend = mutation({
  args: { myEmail: v.string(), friendUsername: v.string() },
  handler: async (ctx, args) => {
    const friend = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.friendUsername))
      .first();

    if (!friend) return { success: false, message: "User not found." };
    const friendEmail = friend.email;
    if (friendEmail === args.myEmail) return { success: false, message: "You cannot add yourself." };

    const link1 = await ctx.db.query("links").withIndex("by_user1", (q) => q.eq("user1", args.myEmail)).filter((q) => q.eq(q.field("user2"), friendEmail)).first();
    const link2 = await ctx.db.query("links").withIndex("by_user1", (q) => q.eq("user1", friendEmail)).filter((q) => q.eq(q.field("user2"), args.myEmail)).first();

    if (link1 || link2) return { success: true, message: "Already connected!" };

    await ctx.db.insert("links", {
      user1: args.myEmail,
      user2: friendEmail,
      theme: { type: "video", value: "https://motionbgs.com/media/1397/goku-ultra-instinct_2.960x540.mp4" },
    });

    return { success: true };
  },
});

export const syncStats = mutation({
  args: { email: v.string(), minutes: v.number(), song: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("stats").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (existing) await ctx.db.patch(existing._id, args);
    else await ctx.db.insert("stats", args);
  },
});

export const leaveSpace = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const l1 = await ctx.db.query("links").withIndex("by_user1", q => q.eq("user1", args.email)).first();
    if (l1) await ctx.db.delete(l1._id);
    const l2 = await ctx.db.query("links").withIndex("by_user2", q => q.eq("user2", args.email)).first();
    if (l2) await ctx.db.delete(l2._id);
  }
});

export const updateTheme = mutation({
  args: { email: v.string(), type: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const l1 = await ctx.db.query("links").withIndex("by_user1", q => q.eq("user1", args.email)).first();
    if (l1) return await ctx.db.patch(l1._id, { theme: { type: args.type, value: args.value } });
    const l2 = await ctx.db.query("links").withIndex("by_user2", q => q.eq("user2", args.email)).first();
    if (l2) return await ctx.db.patch(l2._id, { theme: { type: args.type, value: args.value } });
  }
});

export const getSpace = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const l1 = await ctx.db.query("links").withIndex("by_user1", q => q.eq("user1", args.email)).first();
    const l2 = await ctx.db.query("links").withIndex("by_user2", q => q.eq("user2", args.email)).first();
    const link = l1 || l2;
    if (!link) return { status: "solo", partner: null, theme: null };

    const partnerEmail = link.user1 === args.email ? link.user2 : link.user1;
    const partnerStats = await ctx.db.query("stats").withIndex("by_email", q => q.eq("email", partnerEmail)).first();

    return {
      status: "linked",
      theme: link.theme,
      partner: partnerStats ? { ...partnerStats, email: partnerEmail } : { email: partnerEmail, status: "Offline", minutes: 0, song: "" }
    };
  }
});

export const logSession = mutation({
  args: { 
    email: v.string(), 
    duration: v.number(), 
    type: v.string(),
    name: v.optional(v.string()), // 👈 New Optional Fields
    tag: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", {
      userEmail: args.email,
      duration: args.duration,
      type: args.type,
      timestamp: Date.now(),
    });

    const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (user) {
      const newTotal = (user.totalMinutes || 0) + args.duration;
      const newLevel = Math.floor(Math.sqrt(newTotal) * 0.5) + 1;
      await ctx.db.patch(user._id, { totalMinutes: newTotal, level: newLevel });
    }
  },
});

export const getSquadronStats = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const l1 = await ctx.db.query("links").withIndex("by_user1", q => q.eq("user1", args.email)).first();
    const l2 = await ctx.db.query("links").withIndex("by_user2", q => q.eq("user2", args.email)).first();
    const link = l1 || l2;

    const memberEmails = [args.email];
    if (link) {
      memberEmails.push(link.user1 === args.email ? link.user2 : link.user1);
    }

    // 1️⃣ FIX: Initialize typed array to avoid TS7034
    let allSessions: any[] = [];
    
    const memberStats = await Promise.all(memberEmails.map(async (m) => {
       const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", m)).first();
       const sessions = await ctx.db.query("sessions")
         .withIndex("by_user", q => q.eq("userEmail", m))
         .order("desc")
         .take(50);
       
       allSessions.push(...sessions);

       return {
         email: m,
         name: user?.name || m.split('@')[0],
         level: user?.level || 1,
         totalMinutes: user?.totalMinutes || 0
       };
    }));

    // 2️⃣ FIX: Calculate total mins safely
    const squadTotalMinutes = memberStats.reduce((acc, curr) => acc + curr.totalMinutes, 0);
    const squadLevel = Math.floor(Math.sqrt(squadTotalMinutes) * 0.5) + 1;
    const nextLevelMins = Math.pow((squadLevel) / 0.5, 2);
    const progressToNext = Math.min(100, (squadTotalMinutes / nextLevelMins) * 100);

    return {
      squadLevel,
      squadTotalMinutes,
      progressToNext,
      members: memberStats,
      myEmail: args.email,
      history: allSessions.sort((a, b) => b.timestamp - a.timestamp)
    };
  }
});