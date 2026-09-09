import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
export async function settleMock(orderId: string): Promise<void> {
  const backend = resolve(process.cwd(), "../backend");
  await promisify(execFile)(
    process.execPath,
    [
      resolve(backend, "node_modules/tsx/dist/cli.mjs"),
      "tests/settle-mock.ts",
      orderId,
    ],
    {
      cwd: backend,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PAYMENT_PROVIDER: "mock",
        DATABASE_URL:
          process.env["DATABASE_URL"] ??
          "mysql://root:coffee-local-test-only@127.0.0.1:13308/coffee_test",
        REDIS_URL: process.env["REDIS_URL"] ?? "redis://127.0.0.1:16379",
        JWT_SECRET:
          process.env["JWT_SECRET"] ??
          "coffee-local-test-jwt-secret-at-least-32",
      },
    },
  );
}
