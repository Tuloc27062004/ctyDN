import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@prisma/client";

const ONE_HOUR = 60 * 60;

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      status: 401 as const,
      session: null,
    };
  }

  const authTime = session.user.authTime;
  const now = Math.floor(Date.now() / 1000);

  if (typeof authTime !== "number" || now - authTime >= ONE_HOUR) {
    return {
      ok: false as const,
      status: 401 as const,
      session: null,
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      status: true,
      isActive: true,
    },
  });

  if (!dbUser) {
    return {
      ok: false as const,
      status: 401 as const,
      session: null,
    };
  }

  const allowedStatus =
    dbUser.status === UserStatus.ACCEPTED ||
    dbUser.status === UserStatus.VERIFIED;

  if (dbUser.role !== Role.ADMIN || !dbUser.isActive || !allowedStatus) {
    return {
      ok: false as const,
      status: 403 as const,
      session,
    };
  }

  return {
    ok: true as const,
    status: 200 as const,
    session,
  };
}