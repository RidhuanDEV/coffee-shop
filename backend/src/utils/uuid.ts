import { randomUUID } from "node:crypto";

// Extend the native RandomUUIDOptions to support Node 22's UUIDv7 option.
declare module "node:crypto" {
  interface RandomUUIDOptions {
    version?: 7;
  }
}

/**
 * Generates a native, secure, and time-ordered UUIDv7.
 * Requires Node.js v22.0.0 or higher.
 */
export function generateUuidV7(): string {
  return randomUUID({ version: 7 });
}
