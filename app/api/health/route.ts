import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/health — confirms the MongoDB connection from .env.local works
export async function GET() {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const applications = await db.collection("applications").estimatedDocumentCount();
    return NextResponse.json({ ok: true, database: db.databaseName, applications });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // never echo the connection string back
    return NextResponse.json({ ok: false, error: message.replace(/mongodb(\+srv)?:\/\/[^\s]+/g, "mongodb://***") }, { status: 503 });
  }
}
