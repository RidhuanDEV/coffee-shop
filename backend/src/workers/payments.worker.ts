import { Queue, Worker } from "bullmq";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { sequelize } from "../config/database.js";
import { loadModels } from "../database/models/index.js";
import { Payment, PaymentEvent } from "../modules/coffee/coffee.model.js";
import { pendingPayments } from "../modules/coffee/coffee.repository.js";
import {
  applyEvent,
  reconcilePayment,
} from "../modules/payments/payment.service.js";
import { logger } from "../core/logger/logger.js";
interface PaymentJob {
  id: string;
}
await loadModels(sequelize);
await sequelize.authenticate();
const url = new URL(env.REDIS_URL);
const connection = {
  host: url.hostname,
  port: Number(url.port) || 6379,
  ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
  ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
  db: Number(url.pathname.slice(1)) || 0,
  ...(url.protocol === "rediss:" ? { tls: {} } : {}),
};
const queue = new Queue<PaymentJob>("coffee-payments", { connection });
const worker = new Worker<PaymentJob>(
  "coffee-payments",
  async (job) => {
    await reconcilePayment(job.data.id);
    await Payment.update(
      { updatedAt: new Date() },
      { where: { id: job.data.id } },
    );
  },
  { connection, concurrency: 3 },
);
worker.on("failed", (job, error) =>
  logger.error(
    { jobId: job?.id, message: error.message },
    "Payment reconciliation failed",
  ),
);
worker.on("error", (error) =>
  logger.error({ message: error.message }, "Payment worker error"),
);
let scanning = false;
async function scan(): Promise<void> {
  if (scanning) return;
  scanning = true;
  try {
    for (const event of await PaymentEvent.findAll({
      where: { processedAt: null },
      limit: 100,
    })) {
      try {
        await applyEvent(event.id);
      } catch (error) {
        await Payment.update(
          { reconcile: true },
          { where: { id: event.paymentId } },
        );
        logger.error(
          { eventId: event.id, error },
          "Payment event requires reconciliation",
        );
      }
    }
    for (const payment of await pendingPayments()) {
      const previous = await queue.getJob(payment.id);
      if (previous && (await previous.getState()) === "failed")
        await previous.remove();
      await queue.add(
        "reconcile",
        { id: payment.id },
        {
          jobId: payment.id,
          attempts: 5,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    }
  } catch (error) {
    logger.error({ error }, "Payment scan failed");
  } finally {
    scanning = false;
  }
}
await scan();
const timer = setInterval(() => void scan(), 10000);
async function shutdown(): Promise<void> {
  clearInterval(timer);
  await worker.close();
  await queue.close();
  await sequelize.close();
  redis.disconnect();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
