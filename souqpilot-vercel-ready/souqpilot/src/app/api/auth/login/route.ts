import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signAccessToken, issueRefreshToken } from "@/lib/jwt";
import { LoginSchema } from "@/lib/validate";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 422 });
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true, role: true, passwordHash: true },
  });

  // Timing-safe: always run bcrypt even for missing user
  const hash = user?.passwordHash ?? "$2b$12$invalidhashpadding000000000000000000000000000000000";
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const { passwordHash: _, ...safeUser } = user;
  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = await issueRefreshToken(
    user.id,
    req.headers.get("x-forwarded-for") ?? undefined,
    req.headers.get("user-agent") ?? undefined
  );

  const res = NextResponse.json({ user: safeUser, accessToken });
  res.cookies.set("refresh_token", refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", maxAge: 7 * 24 * 60 * 60, path: "/api/auth/refresh",
  });
  return res;
}
