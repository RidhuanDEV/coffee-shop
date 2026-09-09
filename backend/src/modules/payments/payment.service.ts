import { createHash } from "node:crypto";
import { sequelize } from "../../config/database.js";
import {
  Payment,
  PaymentEvent,
  Order,
  OrderHistory,
  Invoice,
  ShopSettings,
} from "../coffee/coffee.model.js";
import type {
  ProviderResult,
  PaymentProvider,
} from "../coffee/coffee.types.js";
import { validPaymentTransition } from "../coffee/coffee.logic.js";
import { provider } from "./payment.provider.js";
import { HttpError } from "../../core/errors/http-error.js";

export async function recordResult(
  payment: Payment,
  result: ProviderResult,
): Promise<void> {
  if (
    result.reference !== payment.reference ||
    result.amount !== payment.amount ||
    (payment.transactionId && result.transactionId !== payment.transactionId)
  )
    throw HttpError.badRequest("PAYMENT_MISMATCH");
  const fingerprint = createHash("sha256")
    .update(
      [
        payment.id,
        result.transactionId,
        result.status,
        String(result.amount),
      ].join("|"),
    )
    .digest("hex");
  const [event] = await PaymentEvent.findOrCreate({
    where: { fingerprint },
    defaults: {
      paymentId: payment.id,
      fingerprint,
      status: result.status,
      amount: result.amount,
      transactionId: result.transactionId,
      processedAt: null,
      occurredAt: result.paidAt ?? new Date(),
    },
  });
  await applyEvent(event.id);
  if (result.qrUrl)
    await Payment.update(
      { qrUrl: result.qrUrl },
      { where: { id: payment.id, status: "PENDING" } },
    );
}
export async function applyEvent(id: string): Promise<void> {
  await sequelize.transaction(async (trx) => {
    const found = await PaymentEvent.findByPk(id, { transaction: trx });
    if (!found) return;
    const initial = await Payment.findByPk(found.paymentId, {
      transaction: trx,
    });
    if (!initial) return;
    // Consistent lock order with kitchen transitions and cancellation.
    const order = await Order.findByPk(initial.orderId, {
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    const payment = await Payment.findByPk(initial.id, {
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    const event = await PaymentEvent.findByPk(id, {
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (!order || !payment || !event || event.processedAt) return;
    if (payment.transactionId && payment.transactionId !== event.transactionId)
      throw HttpError.conflict("PAYMENT_MISMATCH");
    if (validPaymentTransition(payment.status, event.status)) {
      await payment.update(
        {
          status: event.status,
          transactionId: event.transactionId.startsWith("absent-")
            ? payment.transactionId
            : event.transactionId,
          paidAt: event.status === "PAID" ? event.occurredAt : payment.paidAt,
          reconcile: order.status === "CANCELLED" && event.status === "PAID",
        },
        { transaction: trx },
      );
      if (event.status === "PAID") {
        if (order.status === "PENDING_PAYMENT") {
          await order.update({ status: "PAID" }, { transaction: trx });
          await OrderHistory.create(
            { orderId: order.id, status: "PAID", actorId: null },
            { transaction: trx },
          );
        }
        const shop = await ShopSettings.findOne({ transaction: trx });
        await Invoice.findOrCreate({
          where: { orderId: order.id },
          defaults: {
            orderId: order.id,
            paymentId: payment.id,
            number: "INV-" + order.number.slice(4),
            shopName: shop?.name ?? "Toko Kopi",
            issuedAt: new Date(),
          },
          transaction: trx,
        });
      }
    } else if (!payment.transactionId) {
      await payment.update(
        { transactionId: event.transactionId },
        { transaction: trx },
      );
    }
    await event.update({ processedAt: new Date() }, { transaction: trx });
  });
}
export async function reconcilePayment(
  id: string,
  adapterOverride?: PaymentProvider,
): Promise<void> {
  const payment = await Payment.findByPk(id);
  if (!payment || payment.status !== "PENDING") return;
  const order = await Order.findByPk(payment.orderId);
  if (!order) return;
  const adapter = adapterOverride ?? provider(payment.provider);
  if (payment.provider === "mock") {
    if (
      order.status === "CANCELLED" ||
      payment.expiresAt.getTime() <= Date.now()
    )
      await recordResult(payment, {
        reference: payment.reference,
        transactionId: payment.transactionId ?? "mock-" + payment.reference,
        amount: payment.amount,
        status: order.status === "CANCELLED" ? "CANCELLED" : "EXPIRED",
        qrUrl: null,
      });
    else if (!payment.transactionId)
      await recordResult(
        payment,
        await adapter.charge(payment.reference, payment.amount),
      );
    return;
  }
  const remote = await adapter.status(payment.reference);
  if (remote) {
    await recordResult(payment, remote);
    if (remote.status === "PENDING" && order.status === "CANCELLED")
      await adapter.cancel(payment.reference);
    return;
  }
  if (
    payment.expiresAt.getTime() <= Date.now() ||
    order.status === "CANCELLED"
  ) {
    // Provider explicitly confirmed absence; do not create a charge after local expiry.
    await recordResult(payment, {
      reference: payment.reference,
      transactionId: payment.transactionId ?? "absent-" + payment.reference,
      amount: payment.amount,
      status: "EXPIRED",
      qrUrl: null,
    });
    return;
  }
  const charged = await adapter.charge(payment.reference, payment.amount);
  await recordResult(payment, charged);
}
