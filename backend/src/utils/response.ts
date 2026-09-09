import type { Response } from "express";
import type { PaginationMeta } from "../types/index.js";

interface SuccessOptions<T> {
  data?: T;
  meta?: PaginationMeta;
  statusCode?: number;
}

export function sendSuccess<T = null>(
  res: Response,
  options: SuccessOptions<T> = {},
): void {
  const { data = null, meta, statusCode = 200 } = options;
  const body = { success: true, data, ...(meta ? { meta } : {}) };
  res.status(statusCode).json(body);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, { data, statusCode: 201 });
}

export function sendNoContent(res: Response): void {
  res.status(204).end();
}
