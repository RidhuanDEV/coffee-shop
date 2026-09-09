import { z } from "zod";
export const localeSchema = z.enum(["id", "en", "ms"]);
export type Locale = z.infer<typeof localeSchema>;
export const localizedSchema = z.object({
  id: z.string(),
  en: z.string(),
  ms: z.string(),
});
export type LocalizedText = z.infer<typeof localizedSchema>;
export const productSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: localizedSchema,
  description: localizedSchema,
  categoryId: z.string(),
  image: z.string(),
  price: z.number().int(),
  available: z.boolean(),
  featured: z.boolean(),
});
export type Product = z.infer<typeof productSchema>;
export const categorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: localizedSchema,
  sortOrder: z.number(),
});
export type Category = z.infer<typeof categorySchema>;
export const tableSchema = z.object({
  id: z.string().optional(),
  code: z.string(),
  name: z.string(),
  token: z.string(),
  area: z.string(),
  active: z.boolean().optional(),
});
export type CafeTable = z.infer<typeof tableSchema>;
export const shopSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  hours: localizedSchema,
  story: localizedSchema,
  promotion: localizedSchema,
});
export type Shop = z.infer<typeof shopSchema>;
export const orderStatusSchema = z.enum([
  "PENDING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export const paymentStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
  "REFUNDED",
]);
export const paymentSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  provider: z.enum(["mock", "midtrans"]),
  reference: z.string(),
  transactionId: z.string().nullable(),
  amount: z.number(),
  status: paymentStatusSchema,
  qrUrl: z.string().nullable(),
  expiresAt: z.string(),
  paidAt: z.string().nullable(),
  reconcile: z.boolean(),
  createdAt: z.string(),
});
export type Payment = z.infer<typeof paymentSchema>;
export const invoiceSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  paymentId: z.string(),
  number: z.string(),
  shopName: z.string(),
  issuedAt: z.string(),
});
export const itemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: localizedSchema,
  categoryName: localizedSchema,
  unitPrice: z.number(),
  quantity: z.number(),
  lineTotal: z.number(),
  notes: z.string(),
});
export const orderSchema = z.object({
  id: z.string(),
  number: z.string(),
  fulfillment: z.enum(["DINE_IN", "TAKEAWAY"]),
  tableName: z.string().nullable(),
  customerName: z.string(),
  phone: z.string(),
  notes: z.string(),
  total: z.number(),
  subtotal: z.number(),
  status: orderStatusSchema,
  createdAt: z.string(),
  items: z.array(itemSchema),
  payment: paymentSchema.nullable(),
  invoice: invoiceSchema.nullable(),
  history: z.array(
    z.object({ status: orderStatusSchema, createdAt: z.string() }),
  ),
});
export type Order = z.infer<typeof orderSchema>;
export const reportSchema = z.object({
  from: z.string(),
  to: z.string(),
  revenue: z.number(),
  count: z.number(),
  average: z.number(),
  todayRevenue: z.number(),
  weekRevenue: z.number(),
  monthRevenue: z.number(),
  categoryRevenue: z.array(z.object({ name: z.string(), revenue: z.number() })),
  activeOrders: z.number(),
  pendingOrders: z.number(),
  completedOrders: z.number(),
  refunded: z.number(),
  rows: z.array(
    z.object({ date: z.string(), revenue: z.number(), count: z.number() }),
  ),
  bestSellers: z.array(
    z.object({ name: z.string(), quantity: z.number(), revenue: z.number() }),
  ),
});
export const staffSchema = z.object({
  id: z.string(),
  email: z.string(),
  roleId: z.string(),
  role: z.object({ name: z.string() }),
});
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
});
export const checkoutSchema = z.object({
  idempotencyKey: z.uuid(),
  fulfillment: z.enum(["DINE_IN", "TAKEAWAY"]),
  tableToken: z.string().nullable(),
  customerName: z.string().max(100),
  phone: z.string().max(30),
  notes: z.string().max(1000),
  locale: localeSchema,
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(50),
        notes: z.string().max(300),
      }),
    )
    .min(1),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export const checkoutResultSchema = z.object({
  id: z.string(),
  accessToken: z.string(),
});
export interface CartLine {
  productId: string;
  quantity: number;
  notes: string;
}
