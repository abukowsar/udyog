"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DISTRICTS, REJECTED, STATUSES, statusLabel } from "@/lib/constants";
import { bn, bnDate, lakh, taka } from "@/lib/format";
import { Icon } from "../Icon";
import { useAdmin } from "./AdminShell";
import { BarList, SplitBar, StatTile, TrendChart } from "./charts";

export interface Stats {
  totals: { applications: number; requested: number; loan: number; grant: number; capital: number; women: number; avgAge: number | null };
  byStatus: { _id: string; n: number; requested: number }[];
  byDistrict: { _id: string; n: number; requested: number }[];
  byUpazila: { district: string; upazila: string; n: number; requested: number; women: number; approved: number }[];
  byGender: { _id: string; n: number }[];
  byBiz: { _id: string; n: number }[];
  daily: { _id: string; n: number }[];
  recent: { trackingId: string; nameBn: string; district: string; upazila: string; status: string; submittedAt: string; finance: { requested: number } }[];
  days: number;
  generatedAt: string;
}

export function useStats(days = 30) {
  const { api, refreshTick } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let live = true;
    api<Stats>(`/api/admin/stats?days=${days}`).then((s) => live && (setStats(s), setErr(""))).catch((e) => live && setErr(e.message));
    return () => { live = false; };
  }, [api, days, refreshTick]);
  return { stats, err };
}

const compact = (n: number) => (n >= 1e7 ? `${bn((n / 1e7).toFixed(2))} কোটি` : n >= 1e5 ? lakh(n) : bn(Math.round(n).toLocaleString("en-IN")));

export default function Overview() {
  const [days, setDays] = useState(30);
  const { stats, err } = useStats(days);

  const trend = useMemo(() => {
    if (!stats) return [];
    const m = new Map(stats.daily.map((d) => [d._id, d.n]));
    const out: { date: string; n: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
      out.push({ date: d, n: m.get(d) ?? 0 });
    }
    return out;
  }, [stats, days]);

  if (err) return <div className="note warn"><Icon name="warn" /><div>{err}</div></div>;
  if (!stats) return <div className="adm-skel"><i /><i /><i /><i /></div>;

  const t = stats.totals;
  const sc = (k: string) => stats.byStatus.find((s) => s._id === k)?.n ?? 0;
  const approved = sc("approved") + sc("disbursed");
  const inPeriod = trend.reduce((s, p) => s + p.n, 0);

  return (
    <div className="adm-page">
      <div className="adm-bar">
        <p className="adm-sub">সর্বশেষ হালনাগাদ: {bnDate(stats.generatedAt, true)}</p>
        <div className="seg" role="radiogroup" aria-label="সময়কাল">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" role="radio" aria-checked={days === d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>গত {bn(d)} দিন</button>
          ))}
        </div>
      </div>

      <div className="kpi-row">
        <StatTile icon="inbox" label="মোট আবেদন" value={bn(t.applications.toLocaleString("en-IN"))} sub={<>গত {bn(days)} দিনে <b>{bn(inPeriod)}</b>টি</>} />
        <StatTile icon="coin" tone="green" label="আবেদনকৃত অর্থায়ন" value={`৳ ${compact(t.requested)}`} sub={<>ঋণ {compact(t.loan)} · অনুদান {compact(t.grant)}</>} />
        <StatTile icon="users" tone="amber" label="নারী উদ্যোক্তা" value={bn(t.women)} sub={t.applications ? <>মোট আবেদনের {bn(Math.round((t.women / t.applications) * 100))}%</> : "—"} />
        <StatTile icon="check" tone="navy" label="অনুমোদিত / বিতরণকৃত" value={bn(approved)} sub={<>লক্ষ্য: ৬৪০ জন (প্রথম ধাপ){t.avgAge ? ` · গড় বয়স ${bn(Math.round(t.avgAge))}` : ""}</>} />
      </div>

      <div className="adm-grid g-2-1">
        <section className="card">
          <header className="card-h"><div><h2>দৈনিক আবেদন</h2><p>গত {bn(days)} দিন · অনলাইন জমা</p></div></header>
          <TrendChart points={trend} />
        </section>
        <section className="card">
          <header className="card-h"><div><h2>আবেদনের অগ্রগতি</h2><p>বর্তমান অবস্থা অনুযায়ী</p></div>
            <Link className="card-link" href="/admin/applications">সব দেখুন</Link></header>
          <BarList detail="আবেদন" rows={[...STATUSES, REJECTED].map((s) => ({
            key: s.key, label: s.bn, value: sc(s.key),
            extra: [["আবেদনকৃত", taka(stats.byStatus.find((x) => x._id === s.key)?.requested ?? 0)]]
          }))} />
        </section>
      </div>

      <div className="adm-grid g-2-1">
        <section className="card">
          <header className="card-h"><div><h2>জেলাভিত্তিক আবেদন</h2><p>৮ জেলা · ৬৪ উপজেলা</p></div>
            <Link className="card-link" href="/admin/coverage">বিস্তারিত</Link></header>
          <BarList detail="আবেদন" rows={DISTRICTS.map((d) => {
            const r = stats.byDistrict.find((x) => x._id === d.bn);
            return { key: d.id, label: d.bn, value: r?.n ?? 0, extra: [["আবেদনকৃত", taka(r?.requested ?? 0)], ["উপজেলা", bn(d.upazilas.length)]] };
          })} />
        </section>
        <section className="card">
          <header className="card-h"><div><h2>আবেদনকারীর ধরন</h2><p>উদ্যোগ ও লিঙ্গভিত্তিক বিভাজন</p></div></header>
          <h3 className="mini-h">উদ্যোগের অবস্থা</h3>
          <SplitBar parts={[
            { label: "নতুন ধারণা", value: stats.byBiz.find((b) => b._id === "new")?.n ?? 0 },
            { label: "চলমান ব্যবসা", value: stats.byBiz.find((b) => b._id === "existing")?.n ?? 0 }
          ]} />
          <h3 className="mini-h">লিঙ্গ</h3>
          <SplitBar parts={["পুরুষ", "নারী", "তৃতীয় লিঙ্গ"].map((g) => ({ label: g, value: stats.byGender.find((x) => x._id === g)?.n ?? 0 }))} />
        </section>
      </div>

      <section className="card">
        <header className="card-h"><div><h2>সাম্প্রতিক আবেদন</h2><p>সর্বশেষ জমা হওয়া ৬টি</p></div>
          <Link className="card-link" href="/admin/applications">সব আবেদন</Link></header>
        {stats.recent.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>ট্র্যাকিং</th><th>আবেদনকারী</th><th>এলাকা</th><th className="num">আবেদনকৃত</th><th>অবস্থা</th><th>জমা</th></tr></thead>
              <tbody>
                {stats.recent.map((r) => (
                  <tr key={r.trackingId}>
                    <td className="en mono-s"><Link href={`/admin/applications?open=${r.trackingId}`}>{r.trackingId}</Link></td>
                    <td><b>{r.nameBn}</b></td>
                    <td>{r.upazila}, <span className="muted">{r.district}</span></td>
                    <td className="num">{taka(r.finance.requested)}</td>
                    <td><span className={`badge s-${r.status}`}>{statusLabel(r.status)}</span></td>
                    <td className="muted">{bnDate(r.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="viz-empty">এখনো কোনো আবেদন জমা হয়নি</div>}
      </section>
    </div>
  );
}
