import { QueryTypes } from "sequelize";
import type { Transaction, InferAttributes } from "sequelize";
import { sequelize } from "../../config/database.js";
import {
  Order,
  OrderItem,
  Payment,
  Invoice,
  OrderHistory,
} from "./coffee.model.js";
import { HttpError } from "../../core/errors/http-error.js";
export async function nextNumber(
  day: string,
  trx: Transaction,
): Promise<string> {
  await sequelize.query(
    "INSERT INTO order_counters (day,value) VALUES (:day,1) ON DUPLICATE KEY UPDATE value=value+1",
    { replacements: { day }, transaction: trx },
  );
  const rows = await sequelize.query<{ value: number }>(
    "SELECT value FROM order_counters WHERE day=:day FOR UPDATE",
    { replacements: { day }, type: QueryTypes.SELECT, transaction: trx },
  );
  const value = rows[0]?.value;
  if (!value) throw HttpError.internal("COUNTER_FAILED");
  return `ORD-${day}-${String(value).padStart(4, "0")}`;
}
type SafeOrder = Omit<
  InferAttributes<Order>,
  "accessToken" | "requestHash" | "idempotencyKey"
>;
export interface OrderDetail extends SafeOrder {
  items: OrderItem[];
  payment: Payment | null;
  invoice: Invoice | null;
  history: OrderHistory[];
}
export async function orderDetail(order: Order): Promise<OrderDetail> {
  const detail = (await orderDetails([order]))[0];
  if (!detail) throw HttpError.notFound("ORDER_NOT_FOUND");
  return detail;
}
export async function orderDetails(orders: Order[]): Promise<OrderDetail[]> {
  if (!orders.length) return [];
  const ids = orders.map((order) => order.id);
  const [items, payments, invoices, history] = await Promise.all([
    OrderItem.findAll({ where: { orderId: ids } }),
    Payment.findAll({ where: { orderId: ids } }),
    Invoice.findAll({ where: { orderId: ids } }),
    OrderHistory.findAll({
      where: { orderId: ids },
      order: [["createdAt", "ASC"]],
    }),
  ]);
  return orders.map((order) => {
    const {
      accessToken: _token,
      requestHash: _hash,
      idempotencyKey: _key,
      ...safe
    } = order.get();
    return {
      ...safe,
      items: items.filter((item) => item.orderId === order.id),
      payment: payments.find((payment) => payment.orderId === order.id) ?? null,
      invoice: invoices.find((invoice) => invoice.orderId === order.id) ?? null,
      history: history.filter((event) => event.orderId === order.id),
    };
  });
}
export async function guestOrder(id: string, token: string): Promise<Order> {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw HttpError.notFound("ORDER_NOT_FOUND");
  const order = await Order.findOne({ where: { id, accessToken: token } });
  if (!order) throw HttpError.notFound("ORDER_NOT_FOUND");
  return order;
}
export async function pendingPayments(): Promise<Payment[]> {
  return Payment.findAll({
    where: { status: "PENDING" },
    limit: 100,
    order: [["updatedAt", "ASC"]],
  });
}
