import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  products: defineTable({
    name: v.string(),
    sku: v.string(),
    category: v.string(),
    price: v.number(),
    costPrice: v.number(),
    stock: v.number(),
    unit: v.string(),
    imageUrl: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_sku", ["sku"])
    .index("by_category", ["category"])
    .searchIndex("search_name", { searchField: "name" }),

  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    totalSpent: v.number(),
    totalOrders: v.number(),
    debt: v.number(),
  })
    .index("by_phone", ["phone"])
    .searchIndex("search_name", { searchField: "name" }),

  orders: defineTable({
    orderCode: v.string(),
    customerId: v.optional(v.id("customers")),
    customerName: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
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
    createdBy: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_customer", ["customerId"])
    .searchIndex("search_code", { searchField: "orderCode" }),

  categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
  }),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
