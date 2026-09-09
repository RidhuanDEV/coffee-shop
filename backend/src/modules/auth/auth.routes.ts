import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../../core/auth/auth.middleware.js";
import { validate } from "../../core/middleware/validate.middleware.js";
import { loginSchema } from "./auth.schema.js";

const router = Router();
const controller = new AuthController();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "TOO_MANY_REQUESTS", errors: [] },
  }),
  validate({ body: loginSchema }),
  controller.login,
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user info (password excluded)
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, controller.me);

export const path = "/auth";
export default router;
