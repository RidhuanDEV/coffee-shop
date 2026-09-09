import { z } from "zod";
import { env } from "../src/config/env.js";
import { sequelize } from "../src/config/database.js";
import { redis } from "../src/config/redis.js";
import { loadModels } from "../src/database/models/index.js";
import { Payment } from "../src/modules/coffee/coffee.model.js";
import { recordResult } from "../src/modules/payments/payment.service.js";

if (
  env.NODE_ENV !== "test" ||
  env.PAYMENT_PROVIDER !== "mock" ||
  !env.DATABASE_URL.endsWith("/coffee_test")
)
  throw Error(
    "This fixture requires the isolated coffee_test database and explicit test/mock configuration",
  );
try {
  await loadModels(sequelize);
  const orderId = z.uuid().parse(process.argv[2]);
  const payment = await Payment.findOne({
    where: { orderId, provider: "mock" },
  });
  if (!payment) throw Error("Mock payment not found");
  await recordResult(payment, {
    reference: payment.reference,
    amount: payment.amount,
    status: "PAID",
    transactionId: payment.transactionId ?? "mock-" + payment.reference,
    qrUrl: null,
  });
} finally {
  await sequelize.close();
  redis.disconnect();
}
