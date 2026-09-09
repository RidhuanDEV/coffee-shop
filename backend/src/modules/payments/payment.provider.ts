import { z } from "zod";
import { env } from "../../config/env.js";
import type {
  PaymentProvider,
  ProviderResult,
  PaymentStatus,
} from "../coffee/coffee.types.js";
import { rupiah, verifySignature } from "../coffee/coffee.logic.js";
export const midtransSchema = z.object({
  order_id: z.string(),
  transaction_id: z.string(),
  transaction_status: z.enum([
    "pending",
    "settlement",
    "expire",
    "deny",
    "cancel",
    "refund",
    "partial_refund",
  ]),
  gross_amount: z.string(),
  currency: z.literal("IDR"),
  payment_type: z.literal("qris"),
  settlement_time: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    .optional(),
  actions: z
    .array(z.object({ name: z.string(), url: z.url(), method: z.string() }))
    .optional(),
});
export const notificationSchema = midtransSchema.extend({
  status_code: z.string(),
  signature_key: z.string(),
});
export type MidtransTransaction = z.infer<typeof midtransSchema>;
export function normalize(transaction: MidtransTransaction): ProviderResult {
  let status: PaymentStatus = "PENDING";
  switch (transaction.transaction_status) {
    case "settlement":
      status = "PAID";
      break;
    case "expire":
      status = "EXPIRED";
      break;
    case "deny":
      status = "FAILED";
      break;
    case "cancel":
      status = "CANCELLED";
      break;
    case "refund":
      status = "REFUNDED";
      break;
    case "partial_refund":
      throw new Error("PARTIAL_REFUND_REQUIRES_RECONCILIATION");
  }
  const qr =
    transaction.actions?.find((a) => a.name === "generate-qr-code-v2") ??
    transaction.actions?.find((a) => a.name === "generate-qr-code");
  if (
    qr &&
    !["api.midtrans.com", "api.sandbox.midtrans.com"].includes(
      new URL(qr.url).hostname,
    )
  )
    throw new Error("INVALID_QR_HOST");
  return {
    ...(transaction.settlement_time
      ? {
          paidAt: new Date(
            transaction.settlement_time.replace(" ", "T") + "+07:00",
          ),
        }
      : {}),
    transactionId: transaction.transaction_id,
    reference: transaction.order_id,
    amount: rupiah(transaction.gross_amount),
    status,
    qrUrl: qr?.url ?? null,
  };
}
export class MidtransProvider implements PaymentProvider {
  verifyNotification(
    reference: string,
    statusCode: string,
    amount: string,
    signature: string,
  ): boolean {
    return (
      !!env.MIDTRANS_SERVER_KEY &&
      verifySignature(
        reference,
        statusCode,
        amount,
        env.MIDTRANS_SERVER_KEY,
        signature,
      )
    );
  }
  private readonly base =
    env.MIDTRANS_PRODUCTION === "true"
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";
  private async request(
    path: string,
    body?: {
      payment_type?: string;
      transaction_details?: { order_id: string; gross_amount: number };
      custom_expiry?: { expiry_duration: number; unit: string };
    },
  ): Promise<Response> {
    return fetch(this.base + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(env.MIDTRANS_SERVER_KEY + ":").toString("base64"),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
  }
  async charge(reference: string, amount: number): Promise<ProviderResult> {
    const response = await this.request("/v2/charge", {
      payment_type: "qris",
      transaction_details: { order_id: reference, gross_amount: amount },
      custom_expiry: { expiry_duration: 15, unit: "minute" },
    });
    if (!response.ok) throw new Error(`MIDTRANS_CHARGE_${response.status}`);
    return normalize(midtransSchema.parse(await response.json()));
  }
  async status(reference: string): Promise<ProviderResult | null> {
    const response = await this.request(
      "/v2/" + encodeURIComponent(reference) + "/status",
    );
    if (response.status === 404) return null;
    const payload: z.infer<typeof statusEnvelope> = statusEnvelope.parse(
      await response.json(),
    );
    if (payload.status_code === "404") return null;
    if (!response.ok) throw new Error(`MIDTRANS_STATUS_${response.status}`);
    return normalize(midtransSchema.parse(payload));
  }
  async cancel(reference: string): Promise<void> {
    const response = await this.request(
      "/v2/" + encodeURIComponent(reference) + "/cancel",
      {},
    );
    if (!response.ok) throw new Error("MIDTRANS_CANCEL_FAILED");
  }
}
const statusEnvelope = z.object({ status_code: z.string() }).passthrough();
export class MockProvider implements PaymentProvider {
  verifyNotification(): boolean {
    return false;
  }
  async charge(reference: string, amount: number): Promise<ProviderResult> {
    return {
      reference,
      amount,
      transactionId: "mock-" + reference,
      status: "PENDING",
      qrUrl: null,
    };
  }
  async status(_reference: string): Promise<ProviderResult | null> {
    return null;
  }
  async cancel(_reference: string): Promise<void> {
    return;
  }
}
export function provider(name: "mock" | "midtrans"): PaymentProvider {
  return name === "midtrans" ? new MidtransProvider() : new MockProvider();
}
