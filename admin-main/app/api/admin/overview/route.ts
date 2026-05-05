import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { getAdminOverviewData } from "@/lib/dashboard";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireAdmin();

  if (!guard.ok) {
    return NextResponse.json(
      { error: guard.status === 401 ? "Unauthorized" : "Forbidden" },
      { status: guard.status }
    );
  }

  try {
    const data = await getAdminOverviewData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to load admin overview" },
      { status: 500 }
    );
  }
}