import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rotateRefreshToken, signAccessToken, issueRefreshToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const raw = req.cookies.get("refresh_token")?.value;
  if (!raw) return NextResponse.json({ error: "No refresh token" }, { status: 401 });

  try {
    const userId = await rotateRefreshToken(raw);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, role: true } });

    const accessToken = signAccessToken(user.id, user.role);
    const newRefreshToken = await issueRefreshToken(
      user.id,
      req.headers.get("x-forwarded-for") ?? undefined,
      req.headers.get("user-agent") ?? undefined
    );

    const res = NextResponse.json({ accessToken });
    res.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "strict", maxAge: 7 * 24 * 60 * 60, path: "/api/auth/refresh",
    });
    return res;
  } catch {
    const res = NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    res.cookies.delete("refresh_token");
    return res;
  }
}
