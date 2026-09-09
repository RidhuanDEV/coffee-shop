import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { env } from "../../src/config/env.js";
import type { Server } from "node:http";
import { z } from "zod";
import { app } from "../../src/app.js";
import { sequelize } from "../../src/config/database.js";
import { redis } from "../../src/config/redis.js";
import { loadModels } from "../../src/database/models/index.js";
import {
  Product,
  CafeTable,
  Order,
  Payment,
  Invoice,
  PaymentEvent,
} from "../../src/modules/coffee/coffee.model.js";
import {
  checkout,
  transition,
  cancelOrder,
} from "../../src/modules/coffee/coffee.service.js";
import {
  guestOrder,
  orderDetail,
} from "../../src/modules/coffee/coffee.repository.js";
import {
  reconcilePayment,
  recordResult,
  applyEvent,
} from "../../src/modules/payments/payment.service.js";
import type { CheckoutInput } from "../../src/modules/coffee/coffee.schema.js";
import type {
  PaymentProvider,
  ProviderResult,
} from "../../src/modules/coffee/coffee.types.js";
let server: Server;
let base = "";
let product: Product;
let table: CafeTable;
let adminToken = "";
before(async () => {
  if (!process.env["DATABASE_URL"]?.includes("coffee_test"))
    throw Error("Integration tests require isolated coffee_test database");
  await loadModels(sequelize);
  await sequelize.authenticate();
  const p = await Product.findOne({ where: { available: true } });
  const tb = await CafeTable.findOne({ where: { active: true } });
  if (!p || !tb) throw Error("Run coffee seed first");
  product = p;
  table = tb;
  server = await new Promise<Server>((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  const address = server.address();
  if (!address || typeof address === "string") throw Error("No address");
  base = `http://127.0.0.1:${address.port}/api`;
  const login = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env["DEV_ADMIN_EMAIL"],
      password: process.env["DEV_ADMIN_PASSWORD"],
    }),
  });
  assert.equal(login.status, 200);
  adminToken = z
    .object({ data: z.object({ token: z.string() }) })
    .parse(await login.json()).data.token;
});
after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await sequelize.close();
  redis.disconnect();
});
function input(): CheckoutInput {
  return {
    idempotencyKey: crypto.randomUUID(),
    fulfillment: "TAKEAWAY",
    tableToken: null,
    customerName: "Integration Guest",
    phone: "",
    notes: "",
    locale: "id",
    items: [{ productId: product.id, quantity: 2, notes: "less sugar" }],
  };
}
async function paymentFor(orderId: string): Promise<Payment> {
  const payment = await Payment.findOne({ where: { orderId } });
  assert.ok(payment);
  return payment;
}
test("HTTP auth, price manipulation, and guest access are enforced", async () => {
  const protectedResponse = await fetch(base + "/admin/orders");
  assert.equal(protectedResponse.status, 401);
  const injected = await fetch(base + "/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input(), total: 1 }),
  });
  assert.equal(injected.status, 400);
  const invalid = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "invalid@example.test",
      password: "invalid",
    }),
  });
  assert.equal(invalid.status, 401);
  assert.equal(
    (
      await fetch(base + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    ).status,
    404,
  );
  const created = await checkout(input());
  assert.equal((await fetch(base + "/orders/" + created.id)).status, 404);
  assert.equal(
    (
      await fetch(base + "/orders/" + created.id, {
        headers: { "X-Order-Token": created.accessToken },
      })
    ).status,
    200,
  );
});
test("invalid/inactive tables and unavailable products are rejected", async () => {
  await assert.rejects(
    checkout({ ...input(), fulfillment: "DINE_IN", tableToken: "invalid" }),
  );
  await table.update({ active: false });
  try {
    await assert.rejects(
      checkout({ ...input(), fulfillment: "DINE_IN", tableToken: table.token }),
    );
  } finally {
    await table.update({ active: true });
  }
  await product.update({ available: false });
  try {
    await assert.rejects(checkout(input()));
  } finally {
    await product.update({ available: true });
  }
});
test("concurrent checkout retries return one order; mismatched payload conflicts", async () => {
  const body = input();
  const results = await Promise.all([checkout(body), checkout(body)]);
  assert.equal(results[0]?.id, results[1]?.id);
  assert.equal(
    await Order.count({ where: { idempotencyKey: body.idempotencyKey } }),
    1,
  );
  await assert.rejects(checkout({ ...body, notes: "different" }));
});
test("concurrent new orders receive unique numbers", async () => {
  const result = await Promise.all(
    Array.from({ length: 5 }, () => checkout(input())),
  );
  const orders = await Order.findAll({
    where: { id: result.map((r) => r.id) },
  });
  assert.equal(new Set(orders.map((o) => o.number)).size, 5);
});
test("paid receipt is idempotent and preserves original prices", async () => {
  const created = await checkout({
    ...input(),
    fulfillment: "DINE_IN",
    tableToken: table.token,
  });
  const payment = await paymentFor(created.id);
  await reconcilePayment(payment.id);
  await payment.reload();
  assert.ok(payment.transactionId);
  const result = {
    reference: payment.reference,
    amount: payment.amount,
    status: "PAID",
    transactionId: payment.transactionId,
    qrUrl: null,
  } satisfies Parameters<typeof recordResult>[1];
  await recordResult(payment, result);
  await recordResult(payment, result);
  assert.equal(await Invoice.count({ where: { orderId: created.id } }), 1);
  const original = product.price;
  await product.update({ price: original + 1000 });
  try {
    const detail = await orderDetail(
      await guestOrder(created.id, created.accessToken),
    );
    assert.equal(detail.total, original * 2);
    assert.equal(detail.items[0]?.unitPrice, original);
    assert.equal(detail.status, "PAID");
  } finally {
    await product.update({ price: original });
  }
  const me = await fetch(base + "/auth/me", {
    headers: { Authorization: "Bearer " + adminToken },
  });
  const adminId = z
    .object({ data: z.object({ id: z.string() }) })
    .parse(await me.json()).data.id;
  await assert.rejects(transition(created.id, "READY", adminId));
  for (const status of [
    "CONFIRMED",
    "PREPARING",
    "READY",
    "COMPLETED",
  ] satisfies Parameters<typeof transition>[1][])
    await transition(created.id, status, adminId);
  await recordResult(payment, { ...result, status: "PENDING" });
  assert.equal((await payment.reload()).status, "PAID");
});
test("cancelled order receiving late payment stays out of kitchen", async () => {
  const created = await checkout(input());
  await cancelOrder(created.id);
  const payment = await paymentFor(created.id);
  await recordResult(payment, {
    reference: payment.reference,
    amount: payment.amount,
    status: "PAID",
    transactionId: "late-" + payment.reference,
    qrUrl: null,
  });
  assert.equal((await Order.findByPk(created.id))?.status, "CANCELLED");
  assert.equal((await payment.reload()).reconcile, true);
});
test("durable payment event can be resumed after interrupted processing", async () => {
  const created = await checkout(input());
  const payment = await paymentFor(created.id);
  const event = await PaymentEvent.create({
    paymentId: payment.id,
    fingerprint: crypto.randomUUID(),
    status: "PAID",
    transactionId: "recovery-" + payment.reference,
    amount: payment.amount,
    processedAt: null,
  });
  await applyEvent(event.id);
  await applyEvent(event.id);
  assert.equal((await payment.reload()).status, "PAID");
  assert.equal(await Invoice.count({ where: { orderId: created.id } }), 1);
});
test("forged webhook and mismatched amounts cannot mark paid", async () => {
  const created = await checkout(input());
  const payment = await paymentFor(created.id);
  await assert.rejects(
    recordResult(payment, {
      reference: payment.reference,
      amount: 1,
      status: "PAID",
      transactionId: "tampered",
      qrUrl: null,
    }),
  );
  const response = await fetch(base + "/payments/webhooks/midtrans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: payment.reference,
      transaction_id: "forged",
      transaction_status: "settlement",
      gross_amount: String(payment.amount),
      currency: "IDR",
      payment_type: "qris",
      status_code: "200",
      signature_key: "a".repeat(128),
    }),
  });
  assert.equal(response.status, 401);
  assert.equal((await payment.reload()).status, "PENDING");
});

test("signed duplicate webhook creates one invoice and uses provider settlement time", async () => {
  const created = await checkout(input());
  const payment = await paymentFor(created.id);
  await payment.update({ provider: "midtrans", transactionId: null });
  const previousKey = env.MIDTRANS_SERVER_KEY;
  env.MIDTRANS_SERVER_KEY = "isolated-webhook-test-key";
  try {
    const amount = payment.amount + ".00";
    const body = {
      order_id: payment.reference,
      transaction_id: "webhook-" + payment.reference,
      transaction_status: "settlement",
      gross_amount: amount,
      currency: "IDR",
      payment_type: "qris",
      status_code: "200",
      settlement_time: "2026-09-08 12:30:00",
      signature_key: createHash("sha512")
        .update(payment.reference + "200" + amount + env.MIDTRANS_SERVER_KEY)
        .digest("hex"),
    };
    for (let n = 0; n < 2; n++) {
      const response = await fetch(base + "/payments/webhooks/midtrans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 200);
    }
    assert.equal(await Invoice.count({ where: { orderId: created.id } }), 1);
    assert.equal(
      (await payment.reload()).paidAt?.toISOString(),
      "2026-09-08T05:30:00.000Z",
    );
    assert.equal(
      (
        await fetch(base + "/admin/payments/" + payment.id + "/simulate", {
          method: "POST",
          headers: { Authorization: "Bearer " + adminToken },
        })
      ).status,
      404,
    );
  } finally {
    env.MIDTRANS_SERVER_KEY = previousKey;
  }
});

test("table QR rotation invalidates old token and malformed upload is rejected", async () => {
  const headers = {
    Authorization: "Bearer " + adminToken,
    "Content-Type": "application/json",
  };
  const created = await fetch(base + "/admin/tables", {
    method: "POST",
    headers,
    body: JSON.stringify({
      code: "T" + Date.now(),
      name: "QR test",
      area: "",
      active: true,
    }),
  });
  assert.equal(created.status, 201);
  const record = z
    .object({ data: z.object({ id: z.string(), token: z.string() }) })
    .parse(await created.json()).data;
  const rotated = await fetch(base + "/admin/tables/" + record.id + "/rotate", {
    method: "POST",
    headers,
  });
  assert.equal(rotated.status, 200);
  assert.equal(
    (await fetch(base + "/tables/resolve/" + record.token)).status,
    404,
  );
  const invalid = await fetch(base + "/admin/uploads", {
    method: "POST",
    headers: { ...headers, "Content-Type": "image/png" },
    body: "invalid image",
  });
  assert.equal(invalid.status, 400);
  await CafeTable.destroy({ where: { id: record.id } });
});

test("reports retain gross settled revenue after refund and localize snapshot labels", async () => {
  const reportSchema = z.object({
    data: z.object({
      revenue: z.number(),
      refunded: z.number(),
      categoryRevenue: z.array(
        z.object({ name: z.string(), revenue: z.number() }),
      ),
    }),
  });
  const report = async (
    locale: string,
  ): Promise<z.infer<typeof reportSchema>["data"]> => {
    const response = await fetch(base + "/admin/reports?locale=" + locale, {
      headers: { Authorization: "Bearer " + adminToken },
    });
    assert.equal(response.status, 200);
    return reportSchema.parse(await response.json()).data;
  };
  const created = await checkout(input());
  const payment = await paymentFor(created.id);
  const result: ProviderResult = {
    reference: payment.reference,
    amount: payment.amount,
    status: "PAID",
    transactionId: "refund-" + payment.reference,
    qrUrl: null,
  };
  await recordResult(payment, result);
  const beforeRefund = await report("id");
  await recordResult(await payment.reload(), { ...result, status: "REFUNDED" });
  const afterRefund = await report("id");
  assert.equal(afterRefund.revenue, beforeRefund.revenue);
  assert.equal(afterRefund.refunded, beforeRefund.refunded + payment.amount);
  assert.ok((await report("en")).categoryRevenue.length > 0);
  assert.ok((await report("ms")).categoryRevenue.length > 0);
});
test("staff can process orders but cannot access finance or products", async () => {
  const email = `staff-${crypto.randomUUID()}@example.test`;
  const created = await fetch(base + "/admin/staff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + adminToken,
    },
    body: JSON.stringify({
      email,
      password: "local-test-staff-password",
      role: "staff",
    }),
  });
  assert.equal(created.status, 201);
  const login = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "local-test-staff-password" }),
  });
  const token = z
    .object({ data: z.object({ token: z.string() }) })
    .parse(await login.json()).data.token;
  const headers = { Authorization: "Bearer " + token };
  assert.equal((await fetch(base + "/admin/orders", { headers })).status, 200);
  assert.equal((await fetch(base + "/admin/reports", { headers })).status, 403);
  assert.equal(
    (await fetch(base + "/admin/products", { headers })).status,
    403,
  );
});
test("worker recovers a charge timeout by checking provider status before charging again", async () => {
  const created = await checkout(input());
  const payment = await paymentFor(created.id);
  await payment.update({ provider: "midtrans" });
  let charged = 0;
  let remote: ProviderResult | null = null;
  const adapter: PaymentProvider = {
    verifyNotification: (): boolean => false,
    status: (): Promise<ProviderResult | null> => Promise.resolve(remote),
    charge: (): Promise<ProviderResult> => {
      charged++;
      remote = {
        reference: payment.reference,
        amount: payment.amount,
        transactionId: "timeout-" + payment.reference,
        status: "PENDING",
        qrUrl: null,
      };
      return Promise.reject(
        new Error("response lost after provider accepted charge"),
      );
    },
    cancel: (): Promise<void> => Promise.resolve(),
  };
  await assert.rejects(reconcilePayment(payment.id, adapter));
  assert.equal((await payment.reload()).status, "PENDING");
  await reconcilePayment(payment.id, adapter);
  assert.equal(charged, 1);
  assert.equal(
    (await payment.reload()).transactionId,
    "timeout-" + payment.reference,
  );
  await payment.update({ status: "CANCELLED" });
});
