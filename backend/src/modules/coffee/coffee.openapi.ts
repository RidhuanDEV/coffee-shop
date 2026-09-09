import { z } from "zod";
import type { Express } from "express";
import {
  checkoutSchema,
  productSchema,
  categorySchema,
  tableSchema,
  settingsSchema,
  staffSchema,
  statusSchema,
} from "./coffee.schema.js";
import { notificationSchema } from "../payments/payment.provider.js";
interface Endpoint {
  path: string;
  method: "get" | "post" | "put" | "patch" | "delete";
  summary: string;
  auth: "public" | "guest" | "staff" | "admin" | "midtrans";
  schema?: z.ZodType;
  upload?: boolean;
}
const endpoints: Endpoint[] = [
  {
    path: "/admin/uploads",
    method: "post",
    summary: "Upload JPEG/PNG/WebP, maximum 5 MB; returns data.image WebP path",
    auth: "admin",
    upload: true,
  },
  {
    path: "/menu",
    method: "get",
    summary: "Available public catalog, including unavailable products",
    auth: "public",
  },
  {
    path: "/categories",
    method: "get",
    summary: "Localized categories",
    auth: "public",
  },
  {
    path: "/shop",
    method: "get",
    summary: "Shop identity, hours, story and promotion",
    auth: "public",
  },
  {
    path: "/tables",
    method: "get",
    summary: "Active public table choices",
    auth: "public",
  },
  {
    path: "/tables/resolve/{token}",
    method: "get",
    summary: "Validate active table QR token",
    auth: "public",
  },
  {
    path: "/orders",
    method: "post",
    summary: "Idempotent guest checkout; prices calculated by backend",
    auth: "public",
    schema: checkoutSchema,
  },
  {
    path: "/orders/{id}",
    method: "get",
    summary: "Guest order, payment, items, history and invoice",
    auth: "guest",
  },
  {
    path: "/orders/{id}/receipt",
    method: "get",
    summary: "Immutable receipt data, available after verified payment",
    auth: "guest",
  },
  {
    path: "/orders/{id}/cancel",
    method: "post",
    summary: "Cancel an unpaid order",
    auth: "guest",
  },
  {
    path: "/payments/webhooks/midtrans",
    method: "post",
    summary: "Verified Midtrans QRIS notification; idempotent",
    auth: "midtrans",
    schema: notificationSchema,
  },
  {
    path: "/admin/orders",
    method: "get",
    summary: "Paginated orders: page, limit, search, status",
    auth: "staff",
  },
  {
    path: "/admin/orders/{id}",
    method: "get",
    summary: "Operational order detail",
    auth: "staff",
  },
  {
    path: "/admin/orders/{id}/status",
    method: "patch",
    summary: "Advance one permitted kitchen state",
    auth: "staff",
    schema: statusSchema,
  },
  {
    path: "/admin/products",
    method: "get",
    summary: "Product management catalog",
    auth: "admin",
  },
  {
    path: "/admin/products",
    method: "post",
    summary: "Create product",
    auth: "admin",
    schema: productSchema,
  },
  {
    path: "/admin/products/{id}",
    method: "put",
    summary: "Update product",
    auth: "admin",
    schema: productSchema,
  },
  {
    path: "/admin/products/{id}",
    method: "delete",
    summary: "Archive product without changing historical orders",
    auth: "admin",
  },
  {
    path: "/admin/categories",
    method: "post",
    summary: "Create category",
    auth: "admin",
    schema: categorySchema,
  },
  {
    path: "/admin/categories/{id}",
    method: "put",
    summary: "Update category",
    auth: "admin",
    schema: categorySchema,
  },
  {
    path: "/admin/tables",
    method: "get",
    summary: "Table management",
    auth: "admin",
  },
  {
    path: "/admin/tables",
    method: "post",
    summary: "Create table with random QR token",
    auth: "admin",
    schema: tableSchema,
  },
  {
    path: "/admin/tables/{id}",
    method: "put",
    summary: "Update table",
    auth: "admin",
    schema: tableSchema,
  },
  {
    path: "/admin/tables/{id}/rotate",
    method: "post",
    summary: "Revoke old table QR token",
    auth: "admin",
  },
  {
    path: "/admin/payments",
    method: "get",
    summary: "Paginated payment records",
    auth: "admin",
  },
  {
    path: "/admin/invoices",
    method: "get",
    summary: "Paginated paid invoices",
    auth: "admin",
  },
  {
    path: "/admin/reports",
    method: "get",
    summary: "Paid revenue; filter from/to by Jakarta calendar date",
    auth: "admin",
  },
  {
    path: "/admin/staff",
    method: "get",
    summary: "Staff accounts without passwords",
    auth: "admin",
  },
  {
    path: "/admin/staff",
    method: "post",
    summary: "Create staff account",
    auth: "admin",
    schema: staffSchema,
  },
  {
    path: "/admin/staff/{id}",
    method: "delete",
    summary: "Deactivate a staff account; admin/self protected",
    auth: "admin",
  },
  {
    path: "/admin/settings",
    method: "put",
    summary: "Update shop content in three languages",
    auth: "admin",
    schema: settingsSchema,
  },
];
interface Operation {
  summary: string;
  description: string;
  tags: string[];
  security: Record<string, string[]>[];
  parameters: {
    name: string;
    in: string;
    required: boolean;
    schema: { type: string };
  }[];
  requestBody?: {
    required: boolean;
    content: Record<string, { schema: z.core.JSONSchema.JSONSchema }>;
  };
  responses: Record<string, { description: string }>;
}
export function setupCoffeeDocs(app: Express): void {
  const paths: Record<
    string,
    Partial<Record<Endpoint["method"], Operation>>
  > = {};
  for (const endpoint of endpoints) {
    const parameters = [...endpoint.path.matchAll(/\{([^}]+)\}/g)].map(
      (match) => ({
        name: match[1] ?? "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      }),
    );
    const operation: Operation = {
      summary: endpoint.summary,
      description:
        endpoint.auth === "admin"
          ? "Requires manage_users permission."
          : endpoint.auth === "staff"
            ? "Requires view_orders for reads or update_orders for status transitions."
            : "See request schema and response envelope.",
      tags: [
        endpoint.auth === "public" || endpoint.auth === "guest"
          ? "Coffee Public"
          : "Coffee Management",
      ],
      security:
        endpoint.auth === "guest"
          ? [{ orderToken: [] }]
          : endpoint.auth === "staff" || endpoint.auth === "admin"
            ? [{ bearerAuth: [] }]
            : [],
      parameters,
      ...(endpoint.schema
        ? {
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: z.toJSONSchema(endpoint.schema, {
                    target: "openapi-3.0",
                  }),
                },
              },
            },
          }
        : {}),
      ...(endpoint.upload
        ? {
            requestBody: {
              required: true,
              content: Object.fromEntries(
                ["image/jpeg", "image/png", "image/webp"].map((media) => [
                  media,
                  { schema: { type: "string", format: "binary" } },
                ]),
              ),
            },
          }
        : {}),
      responses: {
        "200": {
          description:
            "Success: { success: true, data, meta? }; page metadata uses page, limit, totalItems, totalPages, hasNextPage, hasPrevPage.",
        },
        "201": { description: "Created: { success: true, data }" },
        "400": {
          description:
            "Invalid request: { success: false, message: stable error code, errors: [{ path, message }] }",
        },
        "401": { description: "Authentication or webhook signature invalid" },
        "403": { description: "Missing required permission" },
        "404": { description: "Resource/token not found" },
        "409": {
          description:
            "Idempotency conflict, unavailable product or invalid state transition",
        },
      },
    };
    const path = paths[endpoint.path] ?? {};
    path[endpoint.method] = operation;
    paths[endpoint.path] = path;
  }
  app.get("/docs/specs/coffee.json", (_req, res) => {
    res.json({
      openapi: "3.0.3",
      info: {
        title: "Toko Kopi API",
        version: "1.0.0",
        description:
          "Amounts are integer IDR. Content locale keys: id, en, ms. Guest access token must be supplied in X-Order-Token. See docs/IMPLEMENTATION.md for response contracts and test fixtures.",
      },
      servers: [{ url: "/api" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          orderToken: { type: "apiKey", in: "header", name: "X-Order-Token" },
        },
      },
      paths,
    });
  });
}
