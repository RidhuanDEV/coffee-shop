import { DataTypes } from "sequelize";
import type { QueryInterface } from "sequelize";
export async function up(q: QueryInterface): Promise<void> {
  await q.createTable("categories", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    name: { type: DataTypes.JSON, allowNull: false },
    sort_order: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("products", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    name: { type: DataTypes.JSON, allowNull: false },
    description: { type: DataTypes.JSON, allowNull: false },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "categories", key: "id" },
      onDelete: "RESTRICT",
    },
    image: { type: DataTypes.STRING(255), allowNull: false },
    price: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    available: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("cafe_tables", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    code: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    area: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("orders", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    number: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    access_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    idempotency_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    request_hash: { type: DataTypes.STRING(255), allowNull: false },
    fulfillment: { type: DataTypes.STRING(255), allowNull: false },
    table_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "cafe_tables", key: "id" },
      onDelete: "RESTRICT",
    },
    table_name: { type: DataTypes.STRING(255), allowNull: true },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "",
    },
    phone: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    locale: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "id",
    },
    subtotal: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    total: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "PENDING_PAYMENT",
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("order_items", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "orders", key: "id" },
      onDelete: "RESTRICT",
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "products", key: "id" },
      onDelete: "RESTRICT",
    },
    name: { type: DataTypes.JSON, allowNull: false },
    category_name: { type: DataTypes.JSON, allowNull: false },
    unit_price: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    line_total: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("payments", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "orders", key: "id" },
      onDelete: "RESTRICT",
    },
    provider: { type: DataTypes.STRING(255), allowNull: false },
    reference: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    amount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "PENDING",
    },
    qr_url: { type: DataTypes.TEXT, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    reconcile: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("payment_events", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    payment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "payments", key: "id" },
      onDelete: "RESTRICT",
    },
    fingerprint: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    status: { type: DataTypes.STRING(255), allowNull: false },
    transaction_id: { type: DataTypes.STRING(255), allowNull: false },
    amount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    processed_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("invoices", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "orders", key: "id" },
      onDelete: "RESTRICT",
    },
    payment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "payments", key: "id" },
      onDelete: "RESTRICT",
    },
    number: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    shop_name: { type: DataTypes.STRING(255), allowNull: false },
    issued_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("order_history", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "orders", key: "id" },
      onDelete: "RESTRICT",
    },
    status: { type: DataTypes.STRING(255), allowNull: false },
    actor_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "RESTRICT",
    },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("shop_settings", {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    address: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    phone: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    email: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
    hours: { type: DataTypes.JSON, allowNull: false },
    story: { type: DataTypes.JSON, allowNull: false },
    promotion: { type: DataTypes.JSON, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await q.createTable("order_counters", {
    day: { type: DataTypes.STRING(8), primaryKey: true },
    value: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  });
  await q.addIndex("orders", ["status", "created_at"]);
  await q.addIndex("payments", ["status", "paid_at"]);
  await q.addIndex("order_items", ["order_id"]);
  await q.addIndex("payment_events", ["processed_at"]);
  await q.addIndex("products", ["category_id", "available"]);
}
export async function down(q: QueryInterface): Promise<void> {
  await q.dropTable("order_counters");
  await q.dropTable("shop_settings");
  await q.dropTable("order_history");
  await q.dropTable("invoices");
  await q.dropTable("payment_events");
  await q.dropTable("payments");
  await q.dropTable("order_items");
  await q.dropTable("orders");
  await q.dropTable("cafe_tables");
  await q.dropTable("products");
  await q.dropTable("categories");
}
