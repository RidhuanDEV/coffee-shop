import { DataTypes, Model } from "sequelize";
import type {
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { generateUuidV7 } from "../../utils/uuid.js";
import type {
  LocalizedText,
  Fulfillment,
  Locale,
  OrderStatus,
  PaymentStatus,
  ProviderName,
} from "./coffee.types.js";
export class Category extends Model<
  InferAttributes<Category>,
  InferCreationAttributes<Category>
> {
  declare id: CreationOptional<string>;
  declare slug: string;
  declare name: LocalizedText;
  declare sortOrder: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export class Product extends Model<
  InferAttributes<Product>,
  InferCreationAttributes<Product>
> {
  declare id: CreationOptional<string>;
  declare slug: string;
  declare name: LocalizedText;
  declare description: LocalizedText;
  declare categoryId: string;
  declare image: string;
  declare price: number;
  declare available: CreationOptional<boolean>;
  declare featured: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export class CafeTable extends Model<
  InferAttributes<CafeTable>,
  InferCreationAttributes<CafeTable>
> {
  declare id: CreationOptional<string>;
  declare code: string;
  declare name: string;
  declare token: string;
  declare area: CreationOptional<string>;
  declare active: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export class Order extends Model<
  InferAttributes<Order>,
  InferCreationAttributes<Order>
> {
  declare id: CreationOptional<string>;
  declare number: string;
  declare accessToken: string;
  declare idempotencyKey: string;
  declare requestHash: string;
  declare fulfillment: Fulfillment;
  declare tableId: string | null;
  declare tableName: string | null;
  declare customerName: CreationOptional<string>;
  declare phone: CreationOptional<string>;
  declare notes: CreationOptional<string>;
  declare locale: CreationOptional<Locale>;
  declare subtotal: number;
  declare total: number;
  declare status: CreationOptional<OrderStatus>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export class OrderItem extends Model<
  InferAttributes<OrderItem>,
  InferCreationAttributes<OrderItem>
> {
  declare id: CreationOptional<string>;
  declare orderId: string;
  declare productId: string;
  declare name: LocalizedText;
  declare categoryName: LocalizedText;
  declare unitPrice: number;
  declare quantity: number;
  declare lineTotal: number;
  declare notes: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export class Payment extends Model<
  InferAttributes<Payment>,
  InferCreationAttributes<Payment>
> {
  declare id: CreationOptional<string>;
  declare orderId: string;
  declare provider: ProviderName;
  declare reference: string;
  declare transactionId: string | null;
  declare amount: number;
  declare status: CreationOptional<PaymentStatus>;
  declare qrUrl: string | null;
  declare expiresAt: Date;
  declare paidAt: Date | null;
  declare reconcile: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export class PaymentEvent extends Model<
  InferAttributes<PaymentEvent>,
  InferCreationAttributes<PaymentEvent>
> {
  declare id: CreationOptional<string>;
  declare paymentId: string;
  declare fingerprint: string;
  declare status: PaymentStatus;
  declare transactionId: string;
  declare amount: number;
  declare processedAt: Date | null;
  declare occurredAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export class Invoice extends Model<
  InferAttributes<Invoice>,
  InferCreationAttributes<Invoice>
> {
  declare id: CreationOptional<string>;
  declare orderId: string;
  declare paymentId: string;
  declare number: string;
  declare shopName: string;
  declare issuedAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export class OrderHistory extends Model<
  InferAttributes<OrderHistory>,
  InferCreationAttributes<OrderHistory>
> {
  declare id: CreationOptional<string>;
  declare orderId: string;
  declare status: OrderStatus;
  declare actorId: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export class ShopSettings extends Model<
  InferAttributes<ShopSettings>,
  InferCreationAttributes<ShopSettings>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare address: CreationOptional<string>;
  declare phone: CreationOptional<string>;
  declare email: CreationOptional<string>;
  declare hours: LocalizedText;
  declare story: LocalizedText;
  declare promotion: LocalizedText;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;
}
export function initCoffeeModels(sequelize: Sequelize): void {
  Category.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      name: { type: DataTypes.JSON, allowNull: false },
      sortOrder: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "categories", underscored: true, paranoid: true },
  );
  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      name: { type: DataTypes.JSON, allowNull: false },
      description: { type: DataTypes.JSON, allowNull: false },
      categoryId: {
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
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "products", underscored: true, paranoid: true },
  );
  CafeTable.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      code: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      area: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "" },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "cafe_tables", underscored: true, paranoid: true },
  );
  Order.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      number: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      accessToken: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      idempotencyKey: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      requestHash: { type: DataTypes.STRING(255), allowNull: false },
      fulfillment: { type: DataTypes.STRING(255), allowNull: false },
      tableId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "cafe_tables", key: "id" },
        onDelete: "RESTRICT",
      },
      tableName: { type: DataTypes.STRING(255), allowNull: true },
      customerName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      phone: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
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
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "orders", underscored: true, paranoid: true },
  );
  OrderItem.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "orders", key: "id" },
        onDelete: "RESTRICT",
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "RESTRICT",
      },
      name: { type: DataTypes.JSON, allowNull: false },
      categoryName: { type: DataTypes.JSON, allowNull: false },
      unitPrice: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      lineTotal: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "order_items", underscored: true, paranoid: true },
  );
  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: "orders", key: "id" },
        onDelete: "RESTRICT",
      },
      provider: { type: DataTypes.STRING(255), allowNull: false },
      reference: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      transactionId: {
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
      qrUrl: { type: DataTypes.TEXT, allowNull: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      paidAt: { type: DataTypes.DATE, allowNull: true },
      reconcile: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "payments", underscored: true, paranoid: true },
  );
  PaymentEvent.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      paymentId: {
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
      transactionId: { type: DataTypes.STRING(255), allowNull: false },
      amount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      processedAt: { type: DataTypes.DATE, allowNull: true },
      occurredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "payment_events",
      underscored: true,
      paranoid: true,
    },
  );
  Invoice.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: "orders", key: "id" },
        onDelete: "RESTRICT",
      },
      paymentId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: "payments", key: "id" },
        onDelete: "RESTRICT",
      },
      number: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      shopName: { type: DataTypes.STRING(255), allowNull: false },
      issuedAt: { type: DataTypes.DATE, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    { sequelize, tableName: "invoices", underscored: true, paranoid: true },
  );
  OrderHistory.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "orders", key: "id" },
        onDelete: "RESTRICT",
      },
      status: { type: DataTypes.STRING(255), allowNull: false },
      actorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "order_history",
      underscored: true,
      paranoid: true,
    },
  );
  ShopSettings.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateUuidV7,
      },
      name: { type: DataTypes.STRING(255), allowNull: false },
      address: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
      phone: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      hours: { type: DataTypes.JSON, allowNull: false },
      story: { type: DataTypes.JSON, allowNull: false },
      promotion: { type: DataTypes.JSON, allowNull: false },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize,
      tableName: "shop_settings",
      underscored: true,
      paranoid: true,
    },
  );
}
