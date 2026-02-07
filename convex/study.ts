import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ... (keep registerUser, getUser, resolveInvite as they were) ...

export const registerUser = mutation({
  args: { email: v.string(), name: v.string(), username: v.string() },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", args.username)).first();
    if (existingUser) return { success: false, message: "Username taken" };

    const existingEmail = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", args.email)).first();
    if (existingEmail) {
        await ctx.db.patch(existingEmail._id, { name: args.name, username: args.username });
    } else {
        await ctx.db.insert("users", { ...args });
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

// ✅ FIXED ADD FRIEND LOGIC
export const addFriend = mutation({
  args: { myEmail: v.string(), friendUsername: v.string() }, // 👈 Accepts Username now
  handler: async (ctx, args) => {
    // 1. Find the friend's email using their username
    const friend = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.friendUsername))
      .first();

    if (!friend) {
      // ❌ User doesn't exist
      return { success: false, message: "User not found. Check the username." };
    }

    const friendEmail = friend.email;

    if (friendEmail === args.myEmail) {
        return { success: false, message: "You cannot add yourself." };
    }

    // 2. Check if link already exists (User1 -> User2 OR User2 -> User1)
    const link1 = await ctx.db.query("links")
      .withIndex("by_user1", (q) => q.eq("user1", args.myEmail))
      .filter((q) => q.eq(q.field("user2"), friendEmail))
      .first();
      
    const link2 = await ctx.db.query("links")
      .withIndex("by_user1", (q) => q.eq("user1", friendEmail))
      .filter((q) => q.eq(q.field("user2"), args.myEmail))
      .first();

    if (link1 || link2) return { success: true, message: "Already connected!" };

    // 3. Create the Link
    await ctx.db.insert("links", {
      user1: args.myEmail,
      user2: friendEmail,
      theme: { type: "video", value: "https://motionbgs.com/media/8/son-goku-ultra-power.mp4" },
    });

    return { success: true };
  },
});

// ... (keep syncStats, leaveSpace, updateTheme, getSpace as they were) ...
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
    const link1 = await ctx.db.query("links").withIndex("by_user1", q => q.eq("user1", args.email)).first();
    if (link1) return await ctx.db.delete(link1._id);
    const link2 = await ctx.db.query("links").withIndex("by_user2", q => q.eq("user2", args.email)).first();
    if (link2) return await ctx.db.delete(link2._id);
  }
});

export const updateTheme = mutation({
  args: { email: v.string(), type: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const link1 = await ctx.db.query("links").withIndex("by_user1", q => q.eq("user1", args.email)).first();
    if (link1) return await ctx.db.patch(link1._id, { theme: { type: args.type, value: args.value } });
    const link2 = await ctx.db.query("links").withIndex("by_user2", q => q.eq("user2", args.email)).first();
    if (link2) return await ctx.db.patch(link2._id, { theme: { type: args.type, value: args.value } });
  }
});

export const getSpace = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const link1 = await ctx.db.query("links").withIndex("by_user1", q => q.eq("user1", args.email)).first();
    const link2 = await ctx.db.query("links").withIndex("by_user2", q => q.eq("user2", args.email)).first();
    
    const link = link1 || link2;
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
    type: v.string() 
  },
  handler: async (ctx, args) => {
    // A. Save the session record
    await ctx.db.insert("sessions", {
      userEmail: args.email,
      duration: args.duration,
      type: args.type,
      timestamp: Date.now(),
    });

    // B. Update User's Total Stats (Level Up Logic)
    const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", args.email)).first();
    if (user) {
      const currentTotal = user.totalMinutes || 0;
      const newTotal = currentTotal + args.duration;
      
      // RPG Logic: Level = Sqrt(TotalMinutes) / 2 (Simple curve)
      const newLevel = Math.floor(Math.sqrt(newTotal) * 0.5) + 1;

      await ctx.db.patch(user._id, { 
        totalMinutes: newTotal,
        level: newLevel
      });
    }
  },
});

// 2️⃣ GET SQUADRON STATS (The Dashboard Data)
export const getSquadronStats = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // A. Find Partner
    const link1 = await ctx.db.query("links").withIndex("by_user1", q => q.eq("user1", args.email)).first();
    const link2 = await ctx.db.query("links").withIndex("by_user2", q => q.eq("user2", args.email)).first();
    const link = link1 || link2;

    // B. Determine Squad Members
    const members = [args.email];
    if (link) {
      const partnerEmail = link.user1 === args.email ? link.user2 : link.user1;
      members.push(partnerEmail);
    }

    // C. Fetch Sessions for ALL members
    // (In a real app, we'd limit this to last 30 days for speed, but this is fine for now)
    let allSessions = [];
    let squadTotalMinutes = 0;
    
    // Fetch stats for each member
    const memberStats = await Promise.all(members.map(async (m) => {
       const user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", m)).first();
       
       // Get recent sessions for this user
       const sessions = await ctx.db.query("sessions")
         .withIndex("by_user", q => q.eq("userEmail", m))
         .order("desc")
         .take(100);
       
       const totalMins = user?.totalMinutes || 0;
       squadTotalMinutes += totalMins;
       allSessions.push(...sessions);

       return {
         email: m,
         name: user?.name || m.split('@')[0],
         level: user?.level || 1,
         totalMinutes: totalMins
       };
    }));

    // D. Calculate Squad Level
    // Squad Level is based on COMBINED effort
    const squadLevel = Math.floor(Math.sqrt(squadTotalMinutes) * 0.5) + 1;
    const nextLevelMins = Math.pow((squadLevel) / 0.5, 2); // Inverse of level formula
    const progressToNext = Math.min(100, (squadTotalMinutes / nextLevelMins) * 100);

    return {
      squadLevel,
      squadTotalMinutes,
      progressToNext,
      members: memberStats,
      history: allSessions.sort((a,b) => b.timestamp - a.timestamp) // Unified timeline
    };
  }
});