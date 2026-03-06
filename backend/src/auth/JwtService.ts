import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "../common/errors/AppError";
import { loadEnv } from "../config/env";

export type AccessTokenPayload = {
  sub: string;
  email: string;
};

export class JwtService {
  sign(payload: AccessTokenPayload): string {
    const env = loadEnv();
    const options = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions;
    return jwt.sign({ sub: payload.sub, email: payload.email }, env.JWT_SECRET, options);
  }

  verify(token: string): AccessTokenPayload {
    const env = loadEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string" || !decoded || typeof decoded !== "object") {
      throw new AppError(401, "UNAUTHORIZED", "Invalid token payload.");
    }
    const sub = (decoded as jwt.JwtPayload).sub;
    const email = (decoded as jwt.JwtPayload).email;
    if (typeof sub !== "string" || typeof email !== "string") {
      throw new AppError(401, "UNAUTHORIZED", "Invalid token payload.");
    }
    return { sub, email };
  }
}
