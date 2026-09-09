import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { z } from "zod";

test("running worker recovers an API-created payment from durable database scan", async () => {
  if (
    process.env["NODE_ENV"] !== "test" ||
    !process.env["DATABASE_URL"]?.endsWith("/coffee_test")
  )
    throw Error("Runtime smoke requires the isolated local test environment");
  const base = "http://127.0.0.1:3000/api";
  const menu = z
    .object({
      data: z.array(z.object({ id: z.string(), available: z.boolean() })),
    })
    .parse(await (await fetch(base + "/menu")).json());
  const product = menu.data.find((item) => item.available);
  if (!product) throw Error("Seed a product before runtime testing");
  const response = await fetch(base + "/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(),
      fulfillment: "TAKEAWAY",
      tableToken: null,
      customerName: "Worker smoke",
      phone: "",
      notes: "Runtime recovery verification",
      locale: "id",
      items: [{ productId: product.id, quantity: 1, notes: "" }],
    }),
  });
  assert.equal(response.status, 201);
  const order = z
    .object({ data: z.object({ id: z.string(), accessToken: z.string() }) })
    .parse(await response.json()).data;
  const headers = { "X-Order-Token": order.accessToken };
  try {
    let initialized = false;
    const deadline = Date.now() + 25000;
    while (Date.now() < deadline) {
      const detail = z
        .object({
          data: z.object({
            payment: z.object({
              transactionId: z.string().nullable(),
              provider: z.literal("mock"),
            }),
          }),
        })
        .parse(
          await (await fetch(base + "/orders/" + order.id, { headers })).json(),
        );
      if (detail.data.payment.transactionId?.startsWith("mock-")) {
        initialized = true;
        break;
      }
      await setTimeout(500);
    }
    assert.equal(
      initialized,
      true,
      "Start the BullMQ worker; API checkout does not initialize provider charges itself",
    );
  } finally {
    await fetch(base + "/orders/" + order.id + "/cancel", {
      method: "POST",
      headers,
    });
  }
});
