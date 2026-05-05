import { NextResponse } from "next/server";
import { UserStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = new Set<string>(Object.values(UserStatus));

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export async function GET(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  const url = new URL(req.url);

  const q = url.searchParams.get("q")?.trim() || "";
  const rawStatus = (url.searchParams.get("status") || "").trim().toUpperCase();
  const rawActive = (url.searchParams.get("active") || "").trim().toUpperCase();

  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(
    parsePositiveInt(url.searchParams.get("pageSize"), 10),
    100
  );

  const status = VALID_STATUSES.has(rawStatus)
    ? (rawStatus as UserStatus)
    : undefined;

  let isActive: boolean | undefined;
  if (rawActive === "TRUE" || rawActive === "ACTIVE") {
    isActive = true;
  } else if (rawActive === "FALSE" || rawActive === "BLOCKED") {
    isActive = false;
  }

  const where: Prisma.UserWhereInput = {
    ...(status ? { status } : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { companyName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  try {
    const [totalItems, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          companyName: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return NextResponse.json({
      users,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      filters: {
        q,
        status: status ?? null,
        active:
          typeof isActive === "boolean"
            ? isActive
              ? "ACTIVE"
              : "BLOCKED"
            : null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}