import { type NextRequest, NextResponse } from "next/server";
import { exportRows, isAdmin } from "@/lib/applications";
import { statusLabel } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // neutralise spreadsheet formula injection and quote
  const safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

// GET /api/admin/export?district=&upazila=&status= — CSV (UTF-8 with BOM so Excel shows Bangla correctly)
export async function GET(req: NextRequest) {
  if (!isAdmin(req.headers.get("x-admin-key"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  try {
    const rows = await exportRows({ district: sp.get("district") || undefined, upazila: sp.get("upazila") || undefined, status: sp.get("status") || undefined });
    const head = ["Tracking ID", "নাম", "Name", "NID", "Phone", "জেলা", "উপজেলা", "উদ্যোগ", "লিঙ্গ", "বয়স",
      "মোট মূলধন", "আবেদনকৃত অর্থায়ন", "ঋণ", "অনুদান", "অবস্থা", "জমার তারিখ"];
    const lines = rows.map((r) => [
      r.trackingId, r.nameBn, r.nameEn, r.nid, r.phone, r.district, r.upazila, r.bizStatus === "new" ? "নতুন" : "চলমান",
      r.gender ?? "", r.age ?? "", r.finance.total, r.finance.requested, r.finance.loan, r.finance.grant,
      statusLabel(r.status), new Date(r.submittedAt).toISOString()
    ].map(cell).join(","));
    const csv = "﻿" + [head.map(cell).join(","), ...lines].join("\r\n");
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="udyog-applications-${stamp}.csv"`, "Cache-Control": "no-store" }
    });
  } catch (e) {
    console.error("[GET /api/admin/export]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
