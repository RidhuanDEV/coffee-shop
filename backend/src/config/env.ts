import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  PAYMENT_PROVIDER: z.enum(["mock", "midtrans"]),
  MIDTRANS_SERVER_KEY: z.string().default(""),
  MIDTRANS_PRODUCTION: z.enum(["true", "false"]).default("false"),
  PUBLIC_WEB_URL: z.url().default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
if (
  env.NODE_ENV === "production" &&
  (env.PAYMENT_PROVIDER !== "midtrans" ||
    !env.MIDTRANS_SERVER_KEY ||
    env.MIDTRANS_PRODUCTION !== "true")
) {
  throw new Error(
    "Production requires live Midtrans credentials; mock payments are forbidden.",
  );
}
if (env.PAYMENT_PROVIDER === "midtrans" && !env.MIDTRANS_SERVER_KEY)
  throw new Error("MIDTRANS_SERVER_KEY is required");
export type Env = z.infer<typeof envSchema>;
