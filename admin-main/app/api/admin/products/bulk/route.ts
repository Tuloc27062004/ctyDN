import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  bulkProductActionSchema,
  zodFieldErrors,
} from "@/lib/validators";

export async function POST(req: Request) {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bulkProductActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid bulk product action",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const ids = [...new Set(parsed.data.ids)].filter(Boolean);
  const { action } = parsed.data;

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No product ids provided" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.product.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        isActive: action === "activate",
      },
    });

    return NextResponse.json({
      ok: true,
      action,
      updatedCount: result.count,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update products" },
      { status: 500 }
    );
  }
}