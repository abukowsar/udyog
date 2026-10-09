import "server-only";
import { randomInt, timingSafeEqual, createHash } from "node:crypto";
import { MongoServerError, type Collection } from "mongodb";
import { getDb } from "./mongodb";
import { PROGRAM, STATUS_KEYS, type StatusKey } from "./constants";
import { allErrors, allowedKeys, budgetTotal, effective, type Data } from "./schema";
import { ageOn, num, toEnDigits } from "./format";

export interface StatusEvent { status: StatusKey; at: Date; note?: string }

export interface ApplicationDoc {
  trackingId: string;
  nid: string;
  nameBn: string;
  nameEn: string;
  phone: string;
  district: string;
  upazila: string;
  bizStatus: "new" | "existing";
  gender?: string;
  age: number | null;
  finance: { total: number; own: number; requested: number; loan: number; grant: number; budgetTotal: number };
  status: StatusKey;
  history: StatusEvent[];
  data: Data;
  submittedAt: Date;
  updatedAt: Date;
}

const MAX_IMAGE = 400_000; // characters of base64 data URL (~300 KB)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const col = async (): Promise<Collection<ApplicationDoc>> => (await getDb()).collection<ApplicationDoc>("applications");
const newTrackingId = () => "UDY-26-" + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export class ValidationError extends Error {
  constructor(public errors: { step: number; id: string; msg: string }[]) { super("validation"); }
}
export class DuplicateError extends Error {}
export class ClosedError extends Error {}

/** Whitelist + trim incoming form data so arbitrary keys / huge payloads never reach the DB. */
export function sanitize(raw: unknown): Data {
  const allowed = allowedKeys();
  const out: Data = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Data)) {
    if (!allowed.has(k)) continue;
    if (k === "photo" || k === "signature") {
      if (typeof v === "string" && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length <= MAX_IMAGE) out[k] = v;
    } else if (k.startsWith("doc_")) {
      if (v && typeof v === "object" && typeof (v as Data).name === "string")
        out[k] = { name: String((v as Data).name).slice(0, 200), size: Math.max(0, Number((v as Data).size) || 0) };
    } else if (typeof v === "boolean") {
      out[k] = v;
    } else if (typeof v === "string" || typeof v === "number") {
      out[k] = String(v).slice(0, 4000).trim();
    }
  }
  return out;
}

export async function createApplication(raw: unknown) {
  if (Date.now() > PROGRAM.deadline.getTime()) throw new ClosedError();
  const data = effective(sanitize(raw));
  const errors = allErrors(data);
  if (errors.length) throw new ValidationError(errors);

  const nid = toEnDigits(data.nid).replace(/\D/g, "");
  const requested = Math.min(num(data.fin_req), PROGRAM.maxFinance);
  const now = new Date();
  const base: Omit<ApplicationDoc, "trackingId"> = {
    nid,
    nameBn: data.name_bn,
    nameEn: String(data.name_en || "").toUpperCase(),
    phone: toEnDigits(data.phone).replace(/[^\d+]/g, ""),
    district: data.prog_district,
    upazila: data.prog_upazila,
    bizStatus: data.biz_status,
    gender: data.gender || undefined,
    age: ageOn(data.dob, PROGRAM.ageRefDate),
    finance: {
      total: num(data.fin_total), own: num(data.fin_own), requested,
      loan: requested * PROGRAM.loanShare, grant: requested * (1 - PROGRAM.loanShare),
      budgetTotal: budgetTotal(data)
    },
    status: "submitted",
    history: [{ status: "submitted", at: now }],
    data,
    submittedAt: now,
    updatedAt: now
  };

  const c = await col();
  for (let attempt = 0; attempt < 5; attempt++) {
    const trackingId = newTrackingId();
    try {
      await c.insertOne({ trackingId, ...base });
      return { trackingId, submittedAt: now };
    } catch (e) {
      if (e instanceof MongoServerError && e.code === 11000) {
        if (e.keyPattern?.nid) throw new DuplicateError();
        continue; // tracking-id collision — retry with a new one
      }
      throw e;
    }
  }
  throw new Error("Could not allocate a tracking number");
}

/** Public tracking view — no personal data beyond the area. */
export async function findPublic(trackingId: string) {
  const c = await col();
  const doc = await c.findOne(
    { trackingId: trackingId.trim().toUpperCase() },
    { projection: { _id: 0, trackingId: 1, district: 1, upazila: 1, status: 1, history: 1, submittedAt: 1 } }
  );
  return doc;
}

// ---------------- admin ----------------
export function isAdmin(key: string | null | undefined) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !key) return false;
  const a = createHash("sha256").update(key).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function listApplications(q: { district?: string; upazila?: string; status?: string; search?: string; page?: number }) {
  const c = await col();
  const filter: Record<string, unknown> = {};
  if (q.district) filter.district = q.district;
  if (q.upazila) filter.upazila = q.upazila;
  if (q.status && (STATUS_KEYS as string[]).includes(q.status)) filter.status = q.status;
  if (q.search) {
    const s = q.search.trim().slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ trackingId: { $regex: s, $options: "i" } }, { nameEn: { $regex: s, $options: "i" } },
      { nameBn: { $regex: s } }, { nid: { $regex: s } }, { phone: { $regex: s } }];
  }
  const page = Math.max(1, q.page || 1), size = 25;
  const [items, total, byStatus] = await Promise.all([
    c.find(filter, { projection: { _id: 0, data: 0, history: 0 } }).sort({ submittedAt: -1 }).skip((page - 1) * size).limit(size).toArray(),
    c.countDocuments(filter),
    c.aggregate<{ _id: string; n: number; requested: number }>([
      { $match: q.district ? { district: q.district } : {} },
      { $group: { _id: "$status", n: { $sum: 1 }, requested: { $sum: "$finance.requested" } } }
    ]).toArray()
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / size)), byStatus };
}

export async function getApplication(trackingId: string) {
  const c = await col();
  return c.findOne({ trackingId: trackingId.toUpperCase() }, { projection: { _id: 0 } });
}

export async function updateStatus(trackingId: string, status: StatusKey, note?: string) {
  const c = await col();
  const at = new Date();
  const res = await c.findOneAndUpdate(
    { trackingId: trackingId.toUpperCase() },
    { $set: { status, updatedAt: at }, $push: { history: { status, at, note: note?.slice(0, 500) || undefined } } },
    { returnDocument: "after", projection: { _id: 0, data: 0 } }
  );
  return res;
}

// ---------------- dashboard statistics ----------------
export async function dashboardStats(days = 30) {
  const c = await col();
  const since = new Date(Date.now() - (days - 1) * 864e5);
  since.setUTCHours(0, 0, 0, 0);
  const [facets] = await c.aggregate<Record<string, any[]>>([
    {
      $facet: {
        totals: [{ $group: {
          _id: null, n: { $sum: 1 }, requested: { $sum: "$finance.requested" }, loan: { $sum: "$finance.loan" },
          grant: { $sum: "$finance.grant" }, capital: { $sum: "$finance.total" },
          women: { $sum: { $cond: [{ $eq: ["$gender", "নারী"] }, 1, 0] } },
          avgAge: { $avg: "$age" }
        } }],
        byStatus: [{ $group: { _id: "$status", n: { $sum: 1 }, requested: { $sum: "$finance.requested" } } }],
        byDistrict: [{ $group: { _id: "$district", n: { $sum: 1 }, requested: { $sum: "$finance.requested" } } }],
        byUpazila: [{ $group: {
          _id: { district: "$district", upazila: "$upazila" }, n: { $sum: 1 }, requested: { $sum: "$finance.requested" },
          women: { $sum: { $cond: [{ $eq: ["$gender", "নারী"] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $in: ["$status", ["approved", "disbursed"]] }, 1, 0] } }
        } }],
        byGender: [{ $group: { _id: { $ifNull: ["$gender", "অনির্ধারিত"] }, n: { $sum: 1 } } }],
        byBiz: [{ $group: { _id: "$bizStatus", n: { $sum: 1 } } }],
        daily: [
          { $match: { submittedAt: { $gte: since } } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt", timezone: "Asia/Dhaka" } }, n: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ],
        recent: [
          { $sort: { submittedAt: -1 } }, { $limit: 6 },
          { $project: { _id: 0, trackingId: 1, nameBn: 1, district: 1, upazila: 1, status: 1, submittedAt: 1, "finance.requested": 1 } }
        ]
      }
    }
  ]).toArray();
  const t = facets.totals[0] || { n: 0, requested: 0, loan: 0, grant: 0, capital: 0, women: 0, avgAge: null };
  return {
    totals: { applications: t.n, requested: t.requested, loan: t.loan, grant: t.grant, capital: t.capital, women: t.women, avgAge: t.avgAge },
    byStatus: facets.byStatus, byDistrict: facets.byDistrict,
    byUpazila: facets.byUpazila.map((u) => ({ district: u._id.district, upazila: u._id.upazila, n: u.n, requested: u.requested, women: u.women, approved: u.approved })),
    byGender: facets.byGender, byBiz: facets.byBiz, daily: facets.daily, recent: facets.recent,
    days, generatedAt: new Date()
  };
}

/** Flat rows for CSV export (respects the same filters as the list). */
export async function exportRows(q: { district?: string; upazila?: string; status?: string }) {
  const c = await col();
  const filter: Record<string, unknown> = {};
  if (q.district) filter.district = q.district;
  if (q.upazila) filter.upazila = q.upazila;
  if (q.status && (STATUS_KEYS as string[]).includes(q.status)) filter.status = q.status;
  return c.find(filter, { projection: { _id: 0, data: 0, history: 0 } }).sort({ submittedAt: -1 }).limit(20000).toArray();
}
