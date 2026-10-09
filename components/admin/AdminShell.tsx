"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PROGRAM } from "@/lib/constants";
import { bn, bnDate } from "@/lib/format";
import { Icon } from "../Icon";

const KEY = "udyog-admin-key";

interface AdminCtx {
  api: <T = any>(path: string, init?: RequestInit) => Promise<T>;
  download: (path: string, filename: string) => Promise<void>;
  logout: () => void;
  refreshTick: number;
}
const Ctx = createContext<AdminCtx | null>(null);
export const useAdmin = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin outside AdminShell");
  return c;
};

const NAV = [
  { href: "/admin", icon: "grid", label: "ড্যাশবোর্ড", en: "Overview" },
  { href: "/admin/applications", icon: "inbox", label: "আবেদনসমূহ", en: "Applications" },
  { href: "/admin/coverage", icon: "map", label: "এলাকাভিত্তিক", en: "Coverage" },
  { href: "/admin/reports", icon: "download", label: "রিপোর্ট ও এক্সপোর্ট", en: "Reports" },
  { href: "/admin/system", icon: "server", label: "সিস্টেম", en: "System" }
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      setKey(sessionStorage.getItem(KEY));
      setCollapsed(localStorage.getItem("udyog-admin-collapsed") === "1");
    } catch { /* ignore */ }
    setChecked(true);
  }, []);
  useEffect(() => setNavOpen(false), [pathname]);

  const logout = useCallback(() => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } setKey(null); }, []);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const r = await fetch(path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", "x-admin-key": key || "", ...(init?.headers || {}) } });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) logout();
    if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
    return j;
  }, [key, logout]);

  const download = useCallback(async (path: string, filename: string) => {
    const r = await fetch(path, { headers: { "x-admin-key": key || "" }, cache: "no-store" });
    if (r.status === 401) { logout(); return; }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const url = URL.createObjectURL(await r.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [key, logout]);

  const value = useMemo(() => ({ api, download, logout, refreshTick }), [api, download, logout, refreshTick]);

  if (!checked) return <div className="adm-boot" />;
  if (!key) return <Login onLogin={(k) => { try { sessionStorage.setItem(KEY, k); } catch { /* ignore */ } setKey(k); }} />;

  const current = NAV.find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href))) ?? NAV[0];
  const daysLeft = Math.ceil((PROGRAM.deadline.getTime() - Date.now()) / 864e5);
  const toggleCollapse = () => setCollapsed((c) => { try { localStorage.setItem("udyog-admin-collapsed", c ? "0" : "1"); } catch { /* ignore */ } return !c; });

  return (
    <Ctx.Provider value={value}>
      <div className={`adm${collapsed ? " collapsed" : ""}${navOpen ? " nav-open" : ""}`}>
        <aside className="adm-side" aria-label="অ্যাডমিন মেনু">
          <div className="adm-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/udyog-mark.png" alt="" width={36} height={36} />
            <div className="adm-brand-t"><b>UDYOG</b><small>ব্যাংক শাখা প্যানেল</small></div>
          </div>
          <nav className="adm-nav">
            <span className="adm-nav-h">মেনু</span>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={current.href === n.href ? "on" : ""} aria-current={current.href === n.href ? "page" : undefined} title={n.label}>
                <Icon name={n.icon} /><span>{n.label}</span>
              </Link>
            ))}
            <span className="adm-nav-h">লিংক</span>
            <Link href="/" target="_blank" title="পাবলিক ওয়েবসাইট"><Icon name="globe" /><span>পাবলিক ওয়েবসাইট</span></Link>
            <Link href="/apply" target="_blank" title="আবেদন ফরম"><Icon name="doc" /><span>আবেদন ফরম</span></Link>
          </nav>
          <div className="adm-side-card">
            <small>আবেদনের শেষ তারিখ</small>
            <b>{bnDate(PROGRAM.deadline)}</b>
            <span>{daysLeft > 0 ? `আর ${bn(daysLeft)} দিন বাকি` : "সময় শেষ"}</span>
          </div>
          <div className="adm-side-foot">
            <div className="adm-user"><span className="av">BB</span><div><b>অ্যাডমিন</b><small>SMESPD, বাংলাদেশ ব্যাংক</small></div></div>
            <button type="button" className="adm-icon-btn" onClick={logout} title="লগআউট" aria-label="লগআউট"><Icon name="logout" /></button>
          </div>
        </aside>
        <div className="adm-scrim" onClick={() => setNavOpen(false)} />

        <div className="adm-main">
          <header className="adm-top">
            <button type="button" className="adm-icon-btn adm-burger" onClick={() => setNavOpen(true)} aria-label="মেনু খুলুন"><Icon name="menu" /></button>
            <button type="button" className="adm-icon-btn adm-collapse" onClick={toggleCollapse} aria-label="সাইডবার ছোট/বড় করুন" title="সাইডবার"><Icon name="sidebar" /></button>
            <div className="adm-title">
              <small>অ্যাডমিন / <span className="en">{current.en}</span></small>
              <h1>{current.label}</h1>
            </div>
            <form className="adm-search" role="search" onSubmit={(e) => { e.preventDefault(); router.push(`/admin/applications?q=${encodeURIComponent(q.trim())}`); }}>
              <Icon name="search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, ট্র্যাকিং, এনআইডি, ফোন…" aria-label="আবেদন খুঁজুন" />
            </form>
            <button type="button" className="adm-icon-btn" onClick={() => setRefreshTick((t) => t + 1)} title="রিফ্রেশ" aria-label="রিফ্রেশ"><Icon name="refresh" /></button>
          </header>
          <main className="adm-content">{children}</main>
        </div>
      </div>
    </Ctx.Provider>
  );
}

function Login({ onLogin }: { onLogin: (k: string) => void }) {
  const [k, setK] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      const r = await fetch("/api/admin/stats?days=7", { headers: { "x-admin-key": k }, cache: "no-store" });
      if (r.ok) onLogin(k);
      else { const j = await r.json().catch(() => ({})); setErr(r.status === 401 ? "অ্যাডমিন কী সঠিক নয়" : j.error || `সমস্যা (${r.status})`); }
    } catch { setErr("সার্ভারের সাথে সংযোগ করা যায়নি"); }
    setBusy(false);
  };
  return (
    <div className="adm-login">
      <div className="adm-login-art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/udyog-logo.png" alt="" />
        <h2>উপজেলাভিত্তিক তরুণ উদ্যোক্তা অনুসন্ধান, চিহ্নিতকরণ ও অর্থায়ন কর্মসূচি</h2>
        <p>আবেদন যাচাই, অবস্থা হালনাগাদ, এলাকাভিত্তিক অগ্রগতি ও রিপোর্ট — এক জায়গায়।</p>
      </div>
      <form className="adm-login-card" onSubmit={submit}>
        <span className="eyebrow">ব্যাংক শাখা প্যানেল</span>
        <h1>প্রবেশ করুন</h1>
        <p>সার্ভারের <span className="en">.env.local</span> ফাইলে নির্ধারিত <span className="en">ADMIN_KEY</span> দিয়ে লগইন করুন।</p>
        <label htmlFor="admkey">অ্যাডমিন কী</label>
        <input id="admkey" className="inp" type="password" value={k} onChange={(e) => setK(e.target.value)} autoFocus autoComplete="current-password" />
        {err && <div className="adm-err" role="alert">{err}</div>}
        <button className="btn btn-primary" type="submit" disabled={busy || !k}>{busy ? "যাচাই হচ্ছে…" : "প্রবেশ করুন"}<Icon name="arrow" /></button>
        <Link href="/" className="adm-back">← পাবলিক ওয়েবসাইটে ফিরুন</Link>
      </form>
    </div>
  );
}
