const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export const bn = (v: string | number) => String(v).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
export const toEnDigits = (v: unknown) => String(v ?? "").replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

export const num = (v: unknown): number => {
  const n = parseFloat(toEnDigits(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// South-Asian grouping (12,34,567) in Bengali digits
export const fmtMoney = (n: number) => {
  const r = Math.round(Number(n) || 0);
  try {
    return new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 }).format(r);
  } catch {
    return bn(r.toLocaleString("en-IN"));
  }
};
export const taka = (n: number) => "৳ " + fmtMoney(n);
export const lakh = (n: number) => {
  const l = (Number(n) || 0) / 100000;
  return bn(l % 1 === 0 ? l : l.toFixed(2).replace(/0$/, "")) + " লক্ষ";
};
export const enMoney = (n: number) => (n ? Math.round(n).toLocaleString("en-IN") : "");

export const ageOn = (dob: string | undefined, ref: Date): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  let a = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) a--;
  return a;
};

export const bnDate = (v?: string | Date | null, withTime = false) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString("bn-BD", withTime
    ? { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" }
    : { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
};

export const words = (s: unknown) => (String(s || "").trim().match(/\S+/g) || []).length;
export const isBlank = (v: unknown) => v === undefined || v === null || v === false || String(v).trim() === "";
