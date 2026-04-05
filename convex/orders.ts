import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("refunded")
    )),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("orders").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    customerName: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        sku: v.string(),
        quantity: v.number(),
        price: v.number(),
        discount: v.number(),
        total: v.number(),
      })
    ),
    subtotal: v.number(),
    discount: v.number(),
    tax: v.number(),
    total: v.number(),
    amountPaid: v.number(),
    change: v.number(),
    paymentMethod: v.union(v.literal("cash"), v.literal("card"), v.literal("transfer")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const orderCount = await ctx.db.query("orders").collect();
    const orderCode = `HD${String(orderCount.length + 1).padStart(6, "0")}`;

    const orderId = await ctx.db.insert("orders", {
      ...args,
      orderCode,
      status: "completed",
      createdBy: userId,
    });

    // Deduct stock for each item
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          stock: Math.max(0, product.stock - item.quantity),
        });
      }
    }

    // Update customer stats
    if (args.customerId) {
      const customer = await ctx.db.get(args.customerId);
      if (customer) {
        await ctx.db.patch(args.customerId, {
          totalSpent: customer.totalSpent + args.total,
          totalOrders: customer.totalOrders + 1,
        });
      }
    }

    return orderId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const allOrders = await ctx.db.query("orders").collect();
    const completedOrders = allOrders.filter((o) => o.status === "completed");
    const todayOrders = completedOrders.filter((o) => o._creationTime >= todayMs);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

    const products = await ctx.db.query("products").collect();
    const customers = await ctx.db.query("customers").collect();

    const lowStock = products.filter((p) => p.stock <= 5 && p.isActive);

    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      totalRevenue,
      totalOrders: completedOrders.length,
      totalProducts: products.length,
      totalCustomers: customers.length,
      lowStockCount: lowStock.length,
      recentOrders: allOrders.slice(-5).reverse(),
    };
  },
});
