import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Op, QueryTypes } from "sequelize";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { sequelize } from "../../config/database.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { requirePermission } from "../../core/auth/rbac.middleware.js";
import { HttpError } from "../../core/errors/http-error.js";
import { buildPaginationMeta } from "../../utils/pagination.js";
import { sendSuccess, sendCreated } from "../../utils/response.js";
import { User } from "../user/user.model.js";
import { Role } from "../roles/role.model.js";
import {
  Category,
  Product,
  CafeTable,
  Order,
  Payment,
  Invoice,
  ShopSettings,
} from "./coffee.model.js";
import {
  checkoutSchema,
  productSchema,
  categorySchema,
  tableSchema,
  statusSchema,
  settingsSchema,
  staffSchema,
  listSchema,
} from "./coffee.schema.js";
import { checkout, transition, cancelOrder } from "./coffee.service.js";
import { orderDetail, orderDetails, guestOrder } from "./coffee.repository.js";
import { jakartaDay } from "./coffee.logic.js";
import {
  notificationSchema,
  normalize,
  MidtransProvider,
} from "../payments/payment.provider.js";
import { recordResult } from "../payments/payment.service.js";
import { cacheService } from "../../core/cache/cache.service.js";
import { setupUpload } from "./coffee.upload.js";
type Handler = (req: Request, res: Response) => Promise<void>;
function route(
  fn: Handler,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next): void => {
    void fn(req, res).catch(next);
  };
}
function id(req: Request): string {
  return z.uuid().parse(req.params["id"]);
}
function token(req: Request): string {
  return req.header("X-Order-Token") ?? "";
}
const router = Router();
router.get(
  "/menu",
  route(async (_req, res) => {
    sendSuccess(res, {
      data: await Product.findAll({ order: [["createdAt", "ASC"]] }),
    });
  }),
);
router.get(
  "/categories",
  route(async (_req, res) => {
    sendSuccess(res, {
      data: await Category.findAll({ order: [["sortOrder", "ASC"]] }),
    });
  }),
);
router.get(
  "/shop",
  route(async (_req, res) => {
    const shop = await ShopSettings.findOne();
    if (!shop) throw HttpError.notFound("SHOP_NOT_CONFIGURED");
    sendSuccess(res, { data: shop });
  }),
);
router.get(
  "/tables",
  route(async (_req, res) => {
    sendSuccess(res, {
      data: await CafeTable.findAll({
        where: { active: true },
        attributes: ["code", "name", "token", "area"],
        order: [["code", "ASC"]],
      }),
    });
  }),
);
router.get(
  "/tables/resolve/:token",
  route(async (req, res) => {
    const table = await CafeTable.findOne({
      where: {
        token: z.string().max(128).parse(req.params["token"]),
        active: true,
      },
      attributes: ["code", "name", "token", "area"],
    });
    if (!table) throw HttpError.notFound("INVALID_TABLE");
    sendSuccess(res, { data: table });
  }),
);
router.post(
  "/orders",
  route(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    sendCreated(res, await checkout(checkoutSchema.parse(req.body)));
  }),
);
router.get(
  "/orders/:id",
  route(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    sendSuccess(res, {
      data: await orderDetail(await guestOrder(id(req), token(req))),
    });
  }),
);
router.get(
  "/orders/:id/receipt",
  route(async (req, res) => {
    const detail = await orderDetail(await guestOrder(id(req), token(req)));
    if (!detail.invoice) throw HttpError.conflict("RECEIPT_UNAVAILABLE");
    res.setHeader("Cache-Control", "no-store");
    sendSuccess(res, { data: detail });
  }),
);
router.post(
  "/orders/:id/cancel",
  route(async (req, res) => {
    const order = await guestOrder(id(req), token(req));
    await cancelOrder(order.id);
    sendSuccess(res);
  }),
);
router.post(
  "/payments/webhooks/midtrans",
  route(async (req, res) => {
    const body = notificationSchema.parse(req.body);
    if (
      !new MidtransProvider().verifyNotification(
        body.order_id,
        body.status_code,
        body.gross_amount,
        body.signature_key,
      )
    )
      throw HttpError.unauthorized("INVALID_SIGNATURE");
    const payment = await Payment.findOne({
      where: { reference: body.order_id, provider: "midtrans" },
    });
    if (!payment) throw HttpError.notFound("PAYMENT_NOT_FOUND");
    await recordResult(payment, normalize(body));
    sendSuccess(res);
  }),
);
router.use("/admin", authenticate, (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.get(
  "/admin/orders",
  requirePermission("view_orders"),
  route(async (req, res) => {
    const query = listSchema.parse(req.query);
    const where = {
      ...(query.search ? { number: { [Op.like]: `%${query.search}%` } } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const result = await Order.findAndCountAll({
      where,
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      order: [["createdAt", "DESC"]],
    });
    sendSuccess(res, {
      data: await orderDetails(result.rows),
      meta: buildPaginationMeta(query.page, query.limit, result.count),
    });
  }),
);
router.get(
  "/admin/orders/:id",
  requirePermission("view_orders"),
  route(async (req, res) => {
    const order = await Order.findByPk(id(req));
    if (!order) throw HttpError.notFound("ORDER_NOT_FOUND");
    sendSuccess(res, { data: await orderDetail(order) });
  }),
);
router.patch(
  "/admin/orders/:id/status",
  requirePermission("update_orders"),
  route(async (req, res) => {
    if (!req.user) throw HttpError.unauthorized();
    await transition(id(req), statusSchema.parse(req.body).status, req.user.id);
    sendSuccess(res);
  }),
);
router.use("/admin", requirePermission("manage_users"));
setupUpload(router);
router.get(
  "/admin/products",
  route(async (req, res) => {
    const q = listSchema.parse(req.query);
    const result = await Product.findAndCountAll({
      limit: q.limit,
      offset: (q.page - 1) * q.limit,
      order: [["createdAt", "DESC"]],
    });
    sendSuccess(res, {
      data: result.rows,
      meta: buildPaginationMeta(q.page, q.limit, result.count),
    });
  }),
);
router.post(
  "/admin/products",
  route(async (req, res) => {
    const body = productSchema.parse(req.body);
    if (!(await Category.findByPk(body.categoryId)))
      throw HttpError.badRequest("INVALID_CATEGORY");
    sendCreated(res, await Product.create(body));
  }),
);
router.put(
  "/admin/products/:id",
  route(async (req, res) => {
    const body = productSchema.parse(req.body);
    const product = await Product.findByPk(id(req));
    if (!product) throw HttpError.notFound();
    if (!(await Category.findByPk(body.categoryId)))
      throw HttpError.badRequest("INVALID_CATEGORY");
    sendSuccess(res, { data: await product.update(body) });
  }),
);
router.delete(
  "/admin/products/:id",
  route(async (req, res) => {
    await Product.destroy({ where: { id: id(req) } });
    sendSuccess(res);
  }),
);
router.post(
  "/admin/categories",
  route(async (req, res) => {
    sendCreated(res, await Category.create(categorySchema.parse(req.body)));
  }),
);
router.put(
  "/admin/categories/:id",
  route(async (req, res) => {
    const category = await Category.findByPk(id(req));
    if (!category) throw HttpError.notFound();
    sendSuccess(res, {
      data: await category.update(categorySchema.parse(req.body)),
    });
  }),
);
router.get(
  "/admin/tables",
  route(async (req, res) => {
    const q = listSchema.parse(req.query);
    const result = await CafeTable.findAndCountAll({
      limit: q.limit,
      offset: (q.page - 1) * q.limit,
      order: [["code", "ASC"]],
    });
    sendSuccess(res, {
      data: result.rows,
      meta: buildPaginationMeta(q.page, q.limit, result.count),
    });
  }),
);
router.post(
  "/admin/tables",
  route(async (req, res) => {
    sendCreated(
      res,
      await CafeTable.create({
        ...tableSchema.parse(req.body),
        token: randomBytes(24).toString("hex"),
      }),
    );
  }),
);
router.put(
  "/admin/tables/:id",
  route(async (req, res) => {
    const table = await CafeTable.findByPk(id(req));
    if (!table) throw HttpError.notFound();
    sendSuccess(res, { data: await table.update(tableSchema.parse(req.body)) });
  }),
);
router.post(
  "/admin/tables/:id/rotate",
  route(async (req, res) => {
    const table = await CafeTable.findByPk(id(req));
    if (!table) throw HttpError.notFound();
    sendSuccess(res, {
      data: await table.update({ token: randomBytes(24).toString("hex") }),
    });
  }),
);
router.get(
  "/admin/payments",
  route(async (req, res) => {
    const q = listSchema.parse(req.query);
    const result = await Payment.findAndCountAll({
      where: {
        ...(q.search ? { reference: { [Op.like]: `%${q.search}%` } } : {}),
        ...(q.status ? { status: q.status } : {}),
      },
      limit: q.limit,
      offset: (q.page - 1) * q.limit,
      order: [["createdAt", "DESC"]],
    });
    sendSuccess(res, {
      data: result.rows,
      meta: buildPaginationMeta(q.page, q.limit, result.count),
    });
  }),
);
router.get(
  "/admin/invoices",
  route(async (req, res) => {
    const q = listSchema.parse(req.query);
    const result = await Invoice.findAndCountAll({
      where: q.search ? { number: { [Op.like]: `%${q.search}%` } } : {},
      limit: q.limit,
      offset: (q.page - 1) * q.limit,
      order: [["createdAt", "DESC"]],
    });
    sendSuccess(res, {
      data: result.rows,
      meta: buildPaginationMeta(q.page, q.limit, result.count),
    });
  }),
);
router.put(
  "/admin/settings",
  route(async (req, res) => {
    const shop = await ShopSettings.findOne();
    if (!shop) throw HttpError.notFound();
    sendSuccess(res, {
      data: await shop.update(settingsSchema.parse(req.body)),
    });
  }),
);
router.get(
  "/admin/staff",
  route(async (req, res) => {
    const q = listSchema.parse(req.query);
    const result = await User.findAndCountAll({
      attributes: ["id", "email", "roleId"],
      include: [{ model: Role, as: "role", attributes: ["name"] }],
      limit: q.limit,
      offset: (q.page - 1) * q.limit,
      order: [["createdAt", "DESC"]],
    });
    sendSuccess(res, {
      data: result.rows,
      meta: buildPaginationMeta(q.page, q.limit, result.count),
    });
  }),
);
router.post(
  "/admin/staff",
  route(async (req, res) => {
    const body = staffSchema.parse(req.body);
    const role = await Role.findOne({ where: { name: body.role } });
    if (!role) throw HttpError.badRequest("INVALID_ROLE");
    const user = await User.create({
      email: body.email,
      password: await bcrypt.hash(body.password, 12),
      roleId: role.id,
    });
    sendCreated(res, { id: user.id, email: user.email, roleId: user.roleId });
  }),
);
router.delete(
  "/admin/staff/:id",
  route(async (req, res) => {
    const userId = id(req);
    if (userId === req.user?.id) throw HttpError.conflict("CANNOT_DELETE_SELF");
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: "role" }],
    });
    if (user?.role?.name === "admin")
      throw HttpError.conflict("ADMIN_PROTECTED");
    await user?.destroy();
    await cacheService.del("user:active:" + userId);
    await cacheService.del("permissions:" + userId);
    sendSuccess(res);
  }),
);
interface RevenueRow {
  date: string;
  revenue: number;
  count: number;
}
interface BestSeller {
  name: string;
  quantity: number;
  revenue: number;
}
router.get(
  "/admin/reports",
  route(async (req, res) => {
    const query = listSchema.parse(req.query);
    const today = jakartaDay();
    const date = `${today.slice(0, 4)}-${today.slice(4, 6)}-${today.slice(6, 8)}`;
    const from = query.from ?? date.slice(0, 7) + "-01",
      to = query.to ?? date;
    if (from > to) throw HttpError.badRequest("INVALID_RANGE");
    const rows = await sequelize.query<RevenueRow>(
      "SELECT DATE_FORMAT(CONVERT_TZ(paid_at,'+00:00','+07:00'),'%Y-%m-%d') AS date, CAST(SUM(amount) AS UNSIGNED) AS revenue,COUNT(*) AS count FROM payments WHERE status IN ('PAID','REFUNDED') AND paid_at >= CONVERT_TZ(:from,'+07:00','+00:00') AND paid_at < DATE_ADD(CONVERT_TZ(:to,'+07:00','+00:00'),INTERVAL 1 DAY) GROUP BY date ORDER BY date",
      {
        replacements: {
          from: from + " 00:00:00",
          to: to + " 00:00:00",
          localePath: "$." + query.locale,
        },
        type: QueryTypes.SELECT,
      },
    );
    const bestSellers = await sequelize.query<BestSeller>(
      "SELECT COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(i.name,:localePath)),''),JSON_UNQUOTE(JSON_EXTRACT(i.name,'$.id'))) AS name,CAST(SUM(i.quantity) AS UNSIGNED) AS quantity,CAST(SUM(i.line_total) AS UNSIGNED) AS revenue FROM order_items i JOIN payments p ON p.order_id=i.order_id WHERE p.status IN ('PAID','REFUNDED') AND p.paid_at >= CONVERT_TZ(:from,'+07:00','+00:00') AND p.paid_at < DATE_ADD(CONVERT_TZ(:to,'+07:00','+00:00'),INTERVAL 1 DAY) GROUP BY i.product_id,1 ORDER BY quantity DESC LIMIT 10",
      {
        replacements: {
          from: from + " 00:00:00",
          to: to + " 00:00:00",
          localePath: "$." + query.locale,
        },
        type: QueryTypes.SELECT,
      },
    );
    const revenue = rows.reduce((sum, r) => sum + Number(r.revenue), 0),
      count = rows.reduce((sum, r) => sum + Number(r.count), 0);
    const dayStart = new Date(date + "T00:00:00+07:00");
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const localDay = new Date(date + "T00:00:00Z").getUTCDay();
    const weekStart = new Date(
      dayStart.getTime() - ((localDay + 6) % 7) * 86400000,
    );
    const monthStart = new Date(date.slice(0, 7) + "-01T00:00:00+07:00");
    const [
      activeOrders,
      pendingOrders,
      completedOrders,
      refunded,
      todayRevenue,
      weekRevenue,
      monthRevenue,
    ] = await Promise.all([
      Order.count({
        where: { status: ["PAID", "CONFIRMED", "PREPARING", "READY"] },
      }),
      Payment.count({ where: { status: "PENDING" } }),
      Order.count({ where: { status: "COMPLETED" } }),
      Payment.sum("amount", {
        where: {
          status: "REFUNDED",
          updatedAt: {
            [Op.gte]: new Date(from + "T00:00:00+07:00"),
            [Op.lt]: new Date(
              new Date(to + "T00:00:00+07:00").getTime() + 86400000,
            ),
          },
        },
      }),
      ...[dayStart, weekStart, monthStart].map((start) =>
        Payment.sum("amount", {
          where: {
            status: ["PAID", "REFUNDED"],
            paidAt: { [Op.gte]: start, [Op.lt]: dayEnd },
          },
        }),
      ),
    ]);
    const categoryRevenue = await sequelize.query<{
      name: string;
      revenue: number;
    }>(
      "SELECT COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(i.category_name,:localePath)),''),JSON_UNQUOTE(JSON_EXTRACT(i.category_name,'$.id'))) AS name,CAST(SUM(i.line_total) AS UNSIGNED) AS revenue FROM order_items i JOIN payments p ON p.order_id=i.order_id WHERE p.status IN ('PAID','REFUNDED') AND p.paid_at >= CONVERT_TZ(:from,'+07:00','+00:00') AND p.paid_at < DATE_ADD(CONVERT_TZ(:to,'+07:00','+00:00'),INTERVAL 1 DAY) GROUP BY 1 ORDER BY revenue DESC",
      {
        replacements: {
          from: from + " 00:00:00",
          to: to + " 00:00:00",
          localePath: "$." + query.locale,
        },
        type: QueryTypes.SELECT,
      },
    );
    sendSuccess(res, {
      data: {
        from,
        to,
        revenue,
        count,
        average: count ? Math.round(revenue / count) : 0,
        todayRevenue: todayRevenue || 0,
        weekRevenue: weekRevenue || 0,
        monthRevenue: monthRevenue || 0,
        activeOrders,
        pendingOrders,
        completedOrders,
        refunded: refunded || 0,
        categoryRevenue: categoryRevenue.map((row) => ({
          ...row,
          revenue: Number(row.revenue),
        })),
        rows: rows.map((r) => ({
          ...r,
          revenue: Number(r.revenue),
          count: Number(r.count),
        })),
        bestSellers: bestSellers.map((r) => ({
          ...r,
          quantity: Number(r.quantity),
          revenue: Number(r.revenue),
        })),
      },
    });
  }),
);
export default router;
