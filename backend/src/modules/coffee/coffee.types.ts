export type Locale = "id" | "en" | "ms";
export interface LocalizedText {
  id: string;
  en: string;
  ms: string;
}
export type Fulfillment = "DINE_IN" | "TAKEAWAY";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";
export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "REFUNDED";
export type ProviderName = "mock" | "midtrans";
export interface ProviderResult {
  paidAt?: Date;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  reference: string;
  qrUrl: string | null;
}
export interface PaymentProvider {
  verifyNotification(
    reference: string,
    statusCode: string,
    amount: string,
    signature: string,
  ): boolean;
  charge(reference: string, amount: number): Promise<ProviderResult>;
  status(reference: string): Promise<ProviderResult | null>;
  cancel(reference: string): Promise<void>;
}
