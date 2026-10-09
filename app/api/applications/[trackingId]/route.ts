import { NextResponse, type NextRequest } from "next/server";
import { findPublic, getApplication, isAdmin, updateStatus } from "@/lib/applications";
import { STATUS_KEYS, type StatusKey } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ trackingId: string }> };
const ID_RE = /^UDY-26-[A-Z0-9]{6}$/;

// GET /api/applications/:id — public status, or full record for admins
export async function GET(req: NextRequest, { params }: Ctx) {
  const id = decodeURIComponent((await params).trackingId).trim().toUpperCase();
  if (!ID_RE.test(id)) return NextResponse.json({ error: "সঠিক ট্র্যাকিং নম্বর দিন" }, { status: 400 });
  try {
    const admin = isAdmin(req.headers.get("x-admin-key"));
    const doc = admin ? await getApplication(id) : await findPublic(id);
    if (!doc) return NextResponse.json({ error: "এই নম্বরে কোনো আবেদন পাওয়া যায়নি" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (e) {
    console.error("[GET /api/applications/:id]", e);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে" }, { status: 500 });
  }
}

// PATCH /api/applications/:id — admin status update { status, note }
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req.headers.get("x-admin-key"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = decodeURIComponent((await params).trackingId).trim().toUpperCase();
  let body: { status?: string; note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!body.status || !(STATUS_KEYS as string[]).includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  try {
    const doc = await updateStatus(id, body.status as StatusKey, body.note);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (e) {
    console.error("[PATCH /api/applications/:id]", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
