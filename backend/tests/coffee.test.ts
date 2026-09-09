import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { checkoutSchema } from "../src/modules/coffee/coffee.schema.js";
import {
  nextOrderStatus,
  validPaymentTransition,
  verifySignature,
  rupiah,
  jakartaDay,
} from "../src/modules/coffee/coffee.logic.js";
const input = {
  idempotencyKey: crypto.randomUUID(),
  fulfillment: "TAKEAWAY",
  tableToken: null,
  customerName: "",
  phone: "",
  notes: "",
  locale: "id",
  items: [{ productId: crypto.randomUUID(), quantity: 1, notes: "" }],
};
test("checkout rejects injected price and negative/fractional quantities", () => {
  assert.equal(checkoutSchema.safeParse({ ...input, total: 1 }).success, false);
  for (const quantity of [-1, 0, 1.5, 51])
    assert.equal(
      checkoutSchema.safeParse({
        ...input,
        items: input.items.map((item) => ({ ...item, quantity })),
      }).success,
      false,
    );
});
test("checkout rejects duplicate product lines and missing dine-in table", () => {
  assert.equal(
    checkoutSchema.safeParse({
      ...input,
      items: [...input.items, ...input.items],
    }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({ ...input, fulfillment: "DINE_IN" }).success,
    false,
  );
});
test("kitchen cannot prepare unpaid orders or skip stages", () => {
  assert.equal(nextOrderStatus("PENDING_PAYMENT"), null);
  assert.equal(nextOrderStatus("PAID"), "CONFIRMED");
  assert.equal(nextOrderStatus("COMPLETED"), null);
});
test("payment state is monotonic, including a late settlement", () => {
  assert.equal(validPaymentTransition("PAID", "PENDING"), false);
  assert.equal(validPaymentTransition("PAID", "PAID"), false);
  assert.equal(validPaymentTransition("CANCELLED", "PAID"), true);
  assert.equal(validPaymentTransition("PAID", "REFUNDED"), true);
  assert.equal(validPaymentTransition("REFUNDED", "PAID"), false);
});
test("signature rejects tampering and malformed hexadecimal", () => {
  const signature = createHash("sha512")
    .update("order" + "200" + "25000.00" + "test-key")
    .digest("hex");
  assert.equal(
    verifySignature("order", "200", "25000.00", "test-key", signature),
    true,
  );
  assert.equal(
    verifySignature("order", "200", "1.00", "test-key", signature),
    false,
  );
  assert.equal(
    verifySignature("order", "200", "25000.00", "test-key", "x".repeat(128)),
    false,
  );
});
test("rupiah parser never rounds fractional payments", () => {
  assert.equal(rupiah("25000.00"), 25000);
  assert.throws(() => rupiah("25000.01"));
  assert.throws(() => rupiah("1e5"));
});
test("order day uses Jakarta midnight", () => {
  assert.equal(jakartaDay(new Date("2026-09-08T17:01:00Z")), "20260909");
});
