"use client";
import { useState } from "react";
import { DISTRICTS, REJECTED, STATUSES, STATUS_KEYS, statusLabel } from "@/lib/constants";
import { bn, taka } from "@/lib/format";
import { Icon } from "../Icon";
import { useAdmin } from "./AdminShell";
import { useStats } from "./Overview";

export default function ReportsView() {
  const { download } = useAdmin();
  const { stats, err } = useStats(30);
  const [f, setF] = useState({ district: "", upazila: "", status: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const upazilas = DISTRICTS.find((d) => d.bn === f.district)?.upazilas ?? [];

  const exportCsv = async () => {
    setBusy(true); setMsg("");
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    try { await download(`/api/admin/export?${qs}`, `udyog-applications-${new Date().toISOString().slice(0, 10)}.csv`); setMsg("ডাউনলোড সম্পন্ন হয়েছে"); }
    catch (e) { setMsg((e as Error).message); }
    setBusy(false);
  };

  const sc = (k: string) => stats?.byStatus.find((s) => s._id === k);
  const dist = (n: string) => stats?.byDistrict.find((d) => d._id === n);
  const total = stats?.totals.applications ?? 0;

  return (
    <div className="adm-page">
      <div className="adm-grid g-1-1">
        <section className="card">
          <header className="card-h"><div><h2>আবেদন তালিকা এক্সপোর্ট</h2><p>CSV (Excel-এ বাংলা সঠিকভাবে দেখাবে)</p></div></header>
          <div className="form-grid">
            <label>জেলা<select className="inp" value={f.district} onChange={(e) => setF({ ...f, district: e.target.value, upazila: "" })}>
              <option value="">সকল জেলা</option>{DISTRICTS.map((d) => <option key={d.id}>{d.bn}</option>)}</select></label>
            <label>উপজেলা<select className="inp" value={f.upazila} disabled={!f.district} onChange={(e) => setF({ ...f, upazila: e.target.value })}>
              <option value="">সকল উপজেলা</option>{upazilas.map((u) => <option key={u}>{u}</option>)}</select></label>
            <label>অবস্থা<select className="inp" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              <option value="">সকল অবস্থা</option>{STATUS_KEYS.map((k) => <option key={k} value={k}>{statusLabel(k)}</option>)}</select></label>
          </div>
          <div className="row-actions">
            <button className="btn btn-primary" type="button" onClick={exportCsv} disabled={busy}><Icon name="download" />{busy ? "প্রস্তুত হচ্ছে…" : "CSV ডাউনলোড"}</button>
            {msg && <span className="muted">{msg}</span>}
          </div>
          <p className="muted" style={{ fontSize: ".85rem", marginTop: 14 }}>এক্সপোর্টে থাকে: ট্র্যাকিং নম্বর, নাম, এনআইডি, ফোন, এলাকা, উদ্যোগের ধরন, লিঙ্গ, বয়স, মূলধন, আবেদনকৃত অর্থায়ন, ঋণ, অনুদান, অবস্থা ও জমার তারিখ। ফাইলটিতে ব্যক্তিগত তথ্য রয়েছে — নিরাপদে সংরক্ষণ করুন।</p>
        </section>

        <section className="card">
          <header className="card-h"><div><h2>অবস্থাভিত্তিক সারসংক্ষেপ</h2><p>সকল জেলা</p></div></header>
          {err ? <div className="note warn"><Icon name="warn" /><div>{err}</div></div> : !stats ? <div className="adm-skel"><i /></div> : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>অবস্থা</th><th className="num">আবেদন</th><th className="num">অংশ</th><th className="num">আবেদনকৃত অর্থায়ন</th></tr></thead>
                <tbody>
                  {[...STATUSES, REJECTED].map((s) => (
                    <tr key={s.key}><td><span className={`badge s-${s.key}`}>{s.bn}</span></td>
                      <td className="num">{bn(sc(s.key)?.n ?? 0)}</td>
                      <td className="num">{total ? bn(Math.round(((sc(s.key)?.n ?? 0) / total) * 100)) : "০"}%</td>
                      <td className="num">{taka(sc(s.key)?.requested ?? 0)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr><td>মোট</td><td className="num">{bn(total)}</td><td className="num">১০০%</td><td className="num">{taka(stats.totals.requested)}</td></tr></tfoot>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <header className="card-h"><div><h2>জেলাভিত্তিক সারসংক্ষেপ</h2><p>আবেদন, অর্থায়নের চাহিদা ও প্রথম ধাপের আসন</p></div></header>
        {stats && (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>জেলা</th><th>বিভাগ</th><th className="num">উপজেলা</th><th className="num">আসন</th><th className="num">আবেদন</th><th className="num">আবেদনকৃত অর্থায়ন</th><th className="num">গড় চাহিদা</th></tr></thead>
              <tbody>
                {DISTRICTS.map((d) => {
                  const r = dist(d.bn);
                  return (
                    <tr key={d.id}><td><b>{d.bn}</b></td><td className="muted">{d.division}</td>
                      <td className="num">{bn(d.upazilas.length)}</td><td className="num">{bn(d.upazilas.length * 10)}</td>
                      <td className="num">{bn(r?.n ?? 0)}</td><td className="num">{taka(r?.requested ?? 0)}</td>
                      <td className="num">{r?.n ? taka(r.requested / r.n) : "—"}</td></tr>
                  );
                })}
              </tbody>
              <tfoot><tr><td colSpan={2}>মোট</td><td className="num">৬৪</td><td className="num">৬৪০</td><td className="num">{bn(total)}</td><td className="num">{taka(stats.totals.requested)}</td>
                <td className="num">{total ? taka(stats.totals.requested / total) : "—"}</td></tr></tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
