import { NextResponse, type NextRequest } from "next/server";
import {
  ClosedError, DuplicateError, ValidationError,
  createApplication, isAdmin, listApplications
} from "@/lib/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 1_500_000; // bytes

// POST /api/applications — submit a new application
export async function POST(req: NextRequest) {
  const len = Number(req.headers.get("content-length") || 0);
  if (len > MAX_BODY) return NextResponse.json({ error: "আবেদনের আকার অনেক বড় — ছবি ছোট করে আবার চেষ্টা করুন।" }, { status: 413 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "অবৈধ অনুরোধ" }, { status: 400 }); }

  try {
    const { trackingId, submittedAt } = await createApplication(body);
    return NextResponse.json({ trackingId, submittedAt }, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) return NextResponse.json({ error: "কিছু তথ্য সঠিক নয়", errors: e.errors }, { status: 422 });
    if (e instanceof DuplicateError) return NextResponse.json({ error: "এই জাতীয় পরিচয়পত্র নম্বর দিয়ে ইতোমধ্যে একটি আবেদন জমা হয়েছে।" }, { status: 409 });
    if (e instanceof ClosedError) return NextResponse.json({ error: "আবেদনের নির্ধারিত সময় শেষ হয়েছে।" }, { status: 403 });
    console.error("[POST /api/applications]", e);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন।" }, { status: 500 });
  }
}

// GET /api/applications — admin list (requires x-admin-key header = ADMIN_KEY)
export async function GET(req: NextRequest) {
  if (!process.env.ADMIN_KEY) return NextResponse.json({ error: "ADMIN_KEY is not configured in .env.local" }, { status: 503 });
  if (!isAdmin(req.headers.get("x-admin-key"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  try {
    const res = await listApplications({
      district: sp.get("district") || undefined,
      upazila: sp.get("upazila") || undefined,
      status: sp.get("status") || undefined,
      search: sp.get("q") || undefined,
      page: Number(sp.get("page") || 1)
    });
    return NextResponse.json(res);
  } catch (e) {
    console.error("[GET /api/applications]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
