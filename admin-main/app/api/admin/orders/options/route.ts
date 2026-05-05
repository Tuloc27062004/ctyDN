import { NextResponse } from "next/server";
import { Role, UserStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getAdminOrderProductOptions } from "@/lib/admin-order";

export async function GET() {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  try {
    const [users, products] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: Role.USER,
          isActive: true,
          status: {
            in: [UserStatus.ACCEPTED, UserStatus.VERIFIED],
          },
        },
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          fullName: true,
          email: true,
          companyName: true,
        },
      }),
      getAdminOrderProductOptions(),
    ]);

    return NextResponse.json({
      users,
      products,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load order form data" },
      { status: 500 }
    );
  }
}
