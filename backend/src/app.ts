import express from "express";
import helmet from "helmet";
import cors from "cors";
import { configureZodLocale } from "./core/validation/zod-error-map.js";
import { requestIdMiddleware } from "./core/middleware/request-id.middleware.js";
import { accessLogMiddleware } from "./core/middleware/access-log.middleware.js";
import { rateLimitMiddleware } from "./core/middleware/rate-limit.middleware.js";
import { errorMiddleware } from "./core/middleware/error.middleware.js";
import { setupSwagger } from "./docs/swagger.js";
import { loadRoutes } from "./routes/index.js";
import { sendSuccess } from "./utils/response.js";
import { env } from "./config/env.js";
import { setupCoffeeDocs } from "./modules/coffee/coffee.openapi.js";
import { uploadDirectory } from "./modules/coffee/coffee.upload.js";

// Configure Zod to return Bahasa Indonesia validation messages globally.
configureZodLocale();

const app = express();

app.use(helmet());
app.use(
  "/assets/uploads",
  express.static(uploadDirectory, {
    immutable: true,
    maxAge: "1y",
    fallthrough: false,
  }),
);
app.use(
  cors({
    origin:
      env.NODE_ENV === "production"
        ? env.PUBLIC_WEB_URL
        : [
            env.PUBLIC_WEB_URL,
            "http://127.0.0.1:5173",
            "http://127.0.0.1:4173",
          ],
    allowedHeaders: ["Content-Type", "Authorization", "X-Order-Token"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIdMiddleware);
app.use(accessLogMiddleware);
app.use(rateLimitMiddleware);

setupCoffeeDocs(app);
setupSwagger(app);

app.get("/health", (_req, res) => {
  sendSuccess(res, { data: { status: "ok" } });
});

await loadRoutes(app);

app.use(errorMiddleware);

export { app };
