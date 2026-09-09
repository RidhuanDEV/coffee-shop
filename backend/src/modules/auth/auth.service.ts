import bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository.js";
import { signToken } from "../../core/auth/jwt.service.js";
import { HttpError } from "../../core/errors/http-error.js";
import { auditService } from "../../core/audit/audit.service.js";
import { AuditAction } from "../../constants/audit.constants.js";
import { AUTH_MODULE } from "../../constants/modules.constants.js";
import type { LoginDto } from "./auth.schema.js";
import { User as UserModel } from "../user/user.model.js";
import { Role } from "../roles/role.model.js";
import { Permission } from "../permissions/permission.model.js";

const repository = new AuthRepository();

export class AuthService {
  async login(dto: LoginDto): Promise<{ token: string }> {
    const user = await repository.findByEmail(dto.email);

    if (!user) {
      throw HttpError.unauthorized("INVALID_CREDENTIALS");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw HttpError.unauthorized("INVALID_CREDENTIALS");
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    auditService.log(AuditAction.LOGIN, AUTH_MODULE, user.id, {
      email: user.email,
    });

    return { token };
  }

  async me(
    userId: string,
  ): Promise<{
    id: string;
    email: string;
    name: string;
    permissions: string[];
  }> {
    const user = await UserModel.findByPk(userId, {
      include: [
        {
          model: Role,
          as: "role",
          include: [{ model: Permission, as: "permissions" }],
        },
      ],
    });
    if (!user) throw HttpError.notFound("USER_NOT_FOUND");
    return {
      id: user.id,
      email: user.email,
      name: user.email.split("@")[0] ?? user.email,
      permissions: user.role?.permissions?.map((p) => p.name) ?? [],
    };
  }
}
