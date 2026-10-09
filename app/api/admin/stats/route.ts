import { NextResponse, type NextRequest } from "next/server";
import { dashboardStats, isAdmin } from "@/lib/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/stats?days=30 — aggregated dashboard figures
export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "ADMIN_KEY is not configured in .env.local" }, { status: 503 });
  if (!isAdmin(req.headers.get("x-admin-key"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const days = Math.min(90, Math.max(7, Number(req.nextUrl.searchParams.get("days")) || 30));
  try {
    return NextResponse.json(await dashboardStats(days));
  } catch (e) {
    console.error("[GET /api/admin/stats]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
