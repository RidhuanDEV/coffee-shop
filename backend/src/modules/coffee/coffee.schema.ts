import { z } from "zod";
export const localeSchema = z.enum(["id", "en", "ms"]);
export const localizedSchema = z
  .object({
    id: z.string().max(5000),
    en: z.string().max(5000),
    ms: z.string().max(5000),
  })
  .strict();
export const productSchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(120),
    name: localizedSchema.refine((v) => v.id.trim().length > 0),
    description: localizedSchema,
    categoryId: z.uuid(),
    image: z
      .string()
      .regex(/^\/assets\/[a-zA-Z0-9._/-]+$/)
      .max(255),
    price: z.number().int().min(1).max(10000000),
    available: z.boolean(),
    featured: z.boolean(),
  })
  .strict();
export const categorySchema = z
  .object({
    slug: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(120),
    name: localizedSchema.refine((v) => v.id.trim().length > 0),
    sortOrder: z.number().int().min(0).max(999),
  })
  .strict();
export const tableSchema = z
  .object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(80),
    area: z.string().max(80),
    active: z.boolean(),
  })
  .strict();
export const checkoutSchema = z
  .object({
    idempotencyKey: z.uuid(),
    fulfillment: z.enum(["DINE_IN", "TAKEAWAY"]),
    tableToken: z.string().max(128).nullable(),
    customerName: z.string().trim().max(100),
    phone: z.string().trim().max(30),
    notes: z.string().trim().max(1000),
    locale: localeSchema,
    items: z
      .array(
        z
          .object({
            productId: z.uuid(),
            quantity: z.number().int().min(1).max(50),
            notes: z.string().trim().max(300),
          })
          .strict(),
      )
      .min(1)
      .max(50),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.fulfillment === "DINE_IN" && !v.tableToken)
      ctx.addIssue({
        code: "custom",
        path: ["tableToken"],
        message: "TABLE_REQUIRED",
      });
    if (v.fulfillment === "TAKEAWAY" && v.tableToken)
      ctx.addIssue({
        code: "custom",
        path: ["tableToken"],
        message: "INVALID_TABLE",
      });
    if (new Set(v.items.map((i) => i.productId)).size !== v.items.length)
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "DUPLICATE_PRODUCT",
      });
  });
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export const statusSchema = z
  .object({ status: z.enum(["CONFIRMED", "PREPARING", "READY", "COMPLETED"]) })
  .strict();
export const settingsSchema = z
  .object({
    name: z.string().min(1).max(100),
    address: z.string().max(1000),
    phone: z.string().max(30),
    email: z.union([z.email(), z.literal("")]),
    hours: localizedSchema,
    story: localizedSchema,
    promotion: localizedSchema,
  })
  .strict();
export const staffSchema = z
  .object({
    email: z.email(),
    password: z.string().min(12).max(100),
    role: z.enum(["admin", "staff"]),
  })
  .strict();
export const listSchema = z.object({
  locale: z.enum(["id", "en", "ms"]).default("id"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().max(100).default(""),
  status: z.string().max(30).default(""),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});
