import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import { requireAuthenticatedUser } from "../../core/http/request-context.js";
import { sendSuccess } from "../../utils/response.js";

const service = new AuthService();

export class AuthController {
  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await service.login(req.body);
      sendSuccess(res, { data: result });
    } catch (err) {
      next(err);
    }
  };

  me = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authUser = requireAuthenticatedUser(req);
      const user = await service.me(authUser.id);
      sendSuccess(res, { data: user });
    } catch (err) {
      next(err);
    }
  };
}
