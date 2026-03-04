import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../common/errors/AppError";
import { isDuplicateKeyError } from "../common/dbErrors";
import { JwtService } from "../auth/JwtService";
import { UserRepository } from "../repositories/UserRepository";

const BCRYPT_ROUNDS = 10;

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwt: JwtService
  ) { }

  async register(input: {
    name: string;
    email: string;
    password: string;
    phone?: string | null;
  }): Promise<{ token: string; user: { id: string; name: string; email: string } }> {
    const email = input.email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const id = uuidv4();
    try {
      await this.users.insert({
        id,
        name: input.name.trim(),
        email,
        passwordHash,
        phone: input.phone?.trim() || null,
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new AppError(409, "DUPLICATE_EMAIL", "An account with this email already exists.");
      }
      throw err;
    }

    const token = this.jwt.sign({ sub: id, email });
    return { token, user: { id, name: input.name.trim(), email } };
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: { id: string; name: string; email: string } }> {
    const email = input.email.toLowerCase().trim();
    const user = await this.users.findByEmail(email);
    if (!user || !user.is_active) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }
    const ok = await bcrypt.compare(input.password, user.password_hash);
    if (!ok) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}
