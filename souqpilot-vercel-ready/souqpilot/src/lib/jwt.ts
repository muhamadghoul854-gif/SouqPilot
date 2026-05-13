import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "./db";

const SECRET = process.env.JWT_SECRET!;

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, SECRET, {
    expiresIn: "15m",
    algorithm: "HS256",
  });
}

export function verifyAccessToken(token: string): { sub: string; role: string } {
  return jwt.verify(token, SECRET) as { sub: string; role: string };
}

export async function issueRefreshToken(
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const raw = crypto.randomBytes(64).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.refreshToken.create({
    data: { userId, tokenHash: hash, expiresAt, ipAddress: ip, userAgent },
  });

  return raw;
}

export async function rotateRefreshToken(raw: string): Promise<string> {
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const stored = await db.refreshToken.findUnique({ where: { tokenHash: hash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new Error("Invalid or expired refresh token");
  }

  await db.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  return stored.userId;
}
