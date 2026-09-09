import { createHash, randomBytes } from "node:crypto";
import { UniqueConstraintError } from "sequelize";
import { sequelize } from "../../config/database.js";
import { env } from "../../config/env.js";
import { HttpError } from "../../core/errors/http-error.js";
import {
  Product,
  Category,
  CafeTable,
  Order,
  OrderItem,
  Payment,
  OrderHistory,
} from "./coffee.model.js";
import type { CheckoutInput } from "./coffee.schema.js";
import type { OrderStatus } from "./coffee.types.js";
import { jakartaDay, nextOrderStatus } from "./coffee.logic.js";
import { nextNumber } from "./coffee.repository.js";
export async function checkout(
  input: CheckoutInput,
): Promise<{ id: string; accessToken: string }> {
  const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const prior = await Order.findOne({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (prior) {
    if (prior.requestHash !== hash)
      throw HttpError.conflict("IDEMPOTENCY_CONFLICT");
    return { id: prior.id, accessToken: prior.accessToken };
  }
  try {
    return await sequelize.transaction(async (trx) => {
      const table =
        input.fulfillment === "DINE_IN" && input.tableToken
          ? await CafeTable.findOne({
              where: { token: input.tableToken, active: true },
              transaction: trx,
              lock: trx.LOCK.UPDATE,
            })
          : null;
      if (input.fulfillment === "DINE_IN" && !table)
        throw HttpError.badRequest("INVALID_TABLE");
      const products = await Product.findAll({
        where: { id: input.items.map((i) => i.productId) },
        order: [["id", "ASC"]],
        transaction: trx,
        lock: trx.LOCK.UPDATE,
      });
      const categories = await Category.findAll({ transaction: trx });
      const items = input.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product || !product.available)
          throw HttpError.conflict("PRODUCT_UNAVAILABLE");
        const category = categories.find((c) => c.id === product.categoryId);
        if (!category) throw HttpError.conflict("PRODUCT_UNAVAILABLE");
        return {
          productId: product.id,
          name: product.name,
          categoryName: category.name,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
          notes: item.notes,
        };
      });
      const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
      if (!Number.isSafeInteger(total) || total > 10000000)
        throw HttpError.badRequest("ORDER_LIMIT");
      const number = await nextNumber(jakartaDay(), trx);
      const order = await Order.create(
        {
          number,
          accessToken: randomBytes(32).toString("hex"),
          idempotencyKey: input.idempotencyKey,
          requestHash: hash,
          fulfillment: input.fulfillment,
          tableId: table?.id ?? null,
          tableName: table?.name ?? null,
          customerName: input.customerName,
          phone: input.phone,
          notes: input.notes,
          locale: input.locale,
          subtotal: total,
          total,
        },
        { transaction: trx },
      );
      await OrderItem.bulkCreate(
        items.map((i) => ({ ...i, orderId: order.id })),
        { transaction: trx },
      );
      await Payment.create(
        {
          orderId: order.id,
          provider: env.PAYMENT_PROVIDER,
          reference: number,
          transactionId: null,
          amount: total,
          qrUrl: null,
          expiresAt: new Date(Date.now() + 15 * 60000),
          paidAt: null,
        },
        { transaction: trx },
      );
      await OrderHistory.create(
        { orderId: order.id, status: "PENDING_PAYMENT", actorId: null },
        { transaction: trx },
      );
      return { id: order.id, accessToken: order.accessToken };
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      const existing = await Order.findOne({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing && existing.requestHash === hash)
        return { id: existing.id, accessToken: existing.accessToken };
      throw HttpError.conflict("IDEMPOTENCY_CONFLICT");
    }
    throw error;
  }
}
export async function transition(
  id: string,
  status: OrderStatus,
  actorId: string,
): Promise<void> {
  await sequelize.transaction(async (trx) => {
    const order = await Order.findByPk(id, {
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (!order) throw HttpError.notFound("ORDER_NOT_FOUND");
    const payment = await Payment.findOne({
      where: { orderId: id },
      transaction: trx,
    });
    if (payment?.status !== "PAID" || nextOrderStatus(order.status) !== status)
      throw HttpError.conflict("INVALID_TRANSITION");
    await order.update({ status }, { transaction: trx });
    await OrderHistory.create(
      { orderId: id, status, actorId },
      { transaction: trx },
    );
  });
}
export async function cancelOrder(id: string): Promise<void> {
  await sequelize.transaction(async (trx) => {
    const order = await Order.findByPk(id, {
      transaction: trx,
      lock: trx.LOCK.UPDATE,
    });
    if (!order || order.status !== "PENDING_PAYMENT")
      throw HttpError.conflict("INVALID_TRANSITION");
    await order.update({ status: "CANCELLED" }, { transaction: trx });
    await OrderHistory.create(
      { orderId: id, status: "CANCELLED", actorId: null },
      { transaction: trx },
    );
  });
}
