import { test, mock } from "node:test";
import assert from "node:assert/strict";
process.env["DATABASE_URL"] ??= "mysql://unused/coffee_test";
process.env["REDIS_URL"] ??= "redis://127.0.0.1:16379";
process.env["JWT_SECRET"] ??= "provider-unit-tests-only-secret-32-characters";
process.env["NODE_ENV"] = "test";
const { MidtransProvider, normalize, midtransSchema } =
  await import("../src/modules/payments/payment.provider.js");
const transaction = {
  order_id: "ORD-TEST",
  transaction_id: "tx-123",
  gross_amount: "25000.00",
  currency: "IDR",
  payment_type: "qris",
  transaction_status: "pending",
  status_code: "200",
};
test("Midtrans transport validates response and allows only QRIS", async () => {
  const request = mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          ...transaction,
          actions: [
            {
              name: "generate-qr-code",
              method: "GET",
              url: "https://api.sandbox.midtrans.com/qr/tx-123",
            },
          ],
        }),
        { status: 200 },
      ),
  );
  try {
    const adapter = new MidtransProvider();
    const result = await adapter.charge("ORD-TEST", 25000);
    assert.equal(result.amount, 25000);
    assert.equal(result.status, "PENDING");
    assert.equal(request.mock.calls.length, 1);
  } finally {
    request.mock.restore();
  }
});
test("Midtrans status distinguishes missing transaction from provider outage", async () => {
  const adapter = new MidtransProvider();
  const request = mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify({ status_code: "404" }), { status: 200 }),
  );
  try {
    assert.equal(await adapter.status("ORD-TEST"), null);
    request.mock.mockImplementation(
      async () => new Response("unavailable", { status: 503 }),
    );
    await assert.rejects(adapter.status("ORD-TEST"));
  } finally {
    request.mock.restore();
  }
});
test("Midtrans timeout is propagated without fabricating success", async () => {
  const request = mock.method(globalThis, "fetch", async () => {
    throw new Error("Request timed out");
  });
  try {
    await assert.rejects(new MidtransProvider().charge("ORD-TEST", 25000));
  } finally {
    request.mock.restore();
  }
});
test("Midtrans invalid currency, non-QRIS and hostile QR URL are rejected", () => {
  assert.equal(
    midtransSchema.safeParse({ ...transaction, currency: "USD" }).success,
    false,
  );
  assert.equal(
    midtransSchema.safeParse({ ...transaction, payment_type: "credit_card" })
      .success,
    false,
  );
  assert.throws(() =>
    normalize(
      midtransSchema.parse({
        ...transaction,
        actions: [
          {
            name: "generate-qr-code",
            method: "GET",
            url: "https://attacker.example/qr",
          },
        ],
      }),
    ),
  );
});
