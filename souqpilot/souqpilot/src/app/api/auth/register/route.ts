import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signAccessToken, issueRefreshToken } from "@/lib/jwt";
import { RegisterSchema } from "@/lib/validate";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 });
  }

  const { email, password, fullName, role } = parsed.data;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { email, passwordHash, fullName, role },
    select: { id: true, email: true, fullName: true, role: true },
  });

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = await issueRefreshToken(
    user.id,
    req.headers.get("x-forwarded-for") ?? undefined,
    req.headers.get("user-agent") ?? undefined
  );

  const res = NextResponse.json({ user, accessToken }, { status: 201 });
  res.cookies.set("refresh_token", refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", maxAge: 7 * 24 * 60 * 60, path: "/api/auth/refresh",
  });
  return res;
}
