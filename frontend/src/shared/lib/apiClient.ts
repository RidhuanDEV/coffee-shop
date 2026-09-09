import { z } from "zod";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "@/types/api.types";
import { ROUTES } from "@/config/routes";
import { env } from "./env";
import { logger } from "./logger";
import { useAuthStore } from "@/store/auth.store";

class ApiClientError extends Error implements ApiError {
  status: number;
  errors?: { path: string; message: string }[];

  constructor({ message, status, errors }: ApiError) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

const errorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z
    .array(
      z.object({
        path: z.union([z.string(), z.array(z.union([z.string(), z.number()]))]),
        message: z.string(),
      }),
    )
    .optional(),
});

const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    logger.error("[API] Request interceptor error", error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status;
    const parsed = errorSchema.safeParse(error.response?.data);
    const message = parsed.success ? parsed.data.message : "REQUEST_FAILED";

    logger.error(`[API] Response error: ${status} - ${message}`);

    if (
      status === 401 &&
      (error.config?.url?.startsWith("/admin") ||
        error.config?.url === "/auth/me")
    ) {
      logger.warn("[API] Unauthorized response received. Clearing session.");
      useAuthStore.getState().logout();

      if (window.location.pathname !== ROUTES.LOGIN) {
        window.history.replaceState({}, "", ROUTES.LOGIN);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }

    const normalizedError = new ApiClientError({
      message,
      status: status ?? 500,
      errors: parsed.success
        ? parsed.data.errors?.map((issue) => ({
            path:
              typeof issue.path === "string"
                ? issue.path
                : issue.path.join("."),
            message: issue.message,
          }))
        : undefined,
    });

    return Promise.reject(normalizedError);
  },
);

export { apiClient };
