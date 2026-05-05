import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
    NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL || process.env.AUTH_URL),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    RESEND_FROM_EMAIL: Boolean(process.env.RESEND_FROM_EMAIL),
    APPROVED_ACCOUNT_URL: Boolean(process.env.APPROVED_ACCOUNT_URL),
  };

  const checks: Record<string, unknown> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.connection = { ok: true };
  } catch (error) {
    const err = error as { code?: string; message?: string; name?: string };
    checks.connection = {
      ok: false,
      errorName: err.name,
      errorCode: err.code,
      errorMessage: err.message,
    };
  }

  try {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    });
    checks.adminUsers = { ok: adminCount > 0, count: adminCount };
  } catch (error) {
    const err = error as { code?: string; message?: string; name?: string };
    checks.adminUsers = {
      ok: false,
      errorName: err.name,
      errorCode: err.code,
      errorMessage: err.message,
    };
  }

  const ok =
    Object.values(env).every(Boolean) &&
    Object.values(checks).every(
      (check) =>
        typeof check === "object" &&
        check !== null &&
        "ok" in check &&
        check.ok === true,
    );

  return NextResponse.json({ ok, env, checks });
}
