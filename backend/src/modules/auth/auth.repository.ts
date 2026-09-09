import { User } from "../user/user.model.js";

export class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
}
