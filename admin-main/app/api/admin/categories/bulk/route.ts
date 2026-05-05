import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  bulkCategoryActionSchema,
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

  const parsed = bulkCategoryActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid bulk category action",
        fieldErrors: zodFieldErrors(parsed.error),
      },
      { status: 400 }
    );
  }

  const ids = [...new Set(parsed.data.ids)].filter(Boolean);
  const { action } = parsed.data;

  if (ids.length === 0) {
    return NextResponse.json(
      { error: "No category ids provided" },
      { status: 400 }
    );
  }

  const result = await prisma.category.updateMany({
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
}