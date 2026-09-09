import { createHash, timingSafeEqual } from "node:crypto";
import type { OrderStatus, PaymentStatus } from "./coffee.types.js";
export function nextOrderStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case "PAID":
      return "CONFIRMED";
    case "CONFIRMED":
      return "PREPARING";
    case "PREPARING":
      return "READY";
    case "READY":
      return "COMPLETED";
    default:
      return null;
  }
}
export function validPaymentTransition(
  current: PaymentStatus,
  next: PaymentStatus,
): boolean {
  if (current === next || current === "REFUNDED") return false;
  if (current === "PAID") return next === "REFUNDED";
  return next === "PAID" || current === "PENDING";
}
export function verifySignature(
  orderId: string,
  statusCode: string,
  amount: string,
  key: string,
  signature: string,
): boolean {
  if (!/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHash("sha512")
    .update(orderId + statusCode + amount + key)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function rupiah(value: string): number {
  if (!/^\d+(\.00)?$/.test(value)) throw new Error("INVALID_AMOUNT");
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw new Error("INVALID_AMOUNT");
  return amount;
}
export function jakartaDay(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("-", "");
}
