import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("products")
        .withSearchIndex("search_name", (q) => q.search("name", args.search!))
        .collect();
    }
    if (args.category) {
      return await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    }
    return await ctx.db.query("products").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    sku: v.string(),
    category: v.string(),
    price: v.number(),
    costPrice: v.number(),
    stock: v.number(),
    unit: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("products", { ...args, imageUrl: undefined });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    sku: v.optional(v.string()),
    category: v.optional(v.string()),
    price: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    stock: v.optional(v.number()),
    unit: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});

export const adjustStock = mutation({
  args: { id: v.id("products"), delta: v.number() },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    await ctx.db.patch(args.id, { stock: product.stock + args.delta });
  },
});
