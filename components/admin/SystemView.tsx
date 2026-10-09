"use client";
import { useEffect, useState } from "react";
import { PROGRAM } from "@/lib/constants";
import { bn, bnDate, lakh } from "@/lib/format";
import { Icon } from "../Icon";
import { useAdmin } from "./AdminShell";

interface Health { ok: boolean; database?: string; applications?: number; error?: string }

export default function SystemView() {
  const { refreshTick } = useAdmin();
  const [h, setH] = useState<Health | null>(null);
  const [ms, setMs] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    const t0 = performance.now();
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      setH(await r.json());
    } catch { setH({ ok: false, error: "সার্ভারে পৌঁছানো যায়নি" }); }
    setMs(Math.round(performance.now() - t0));
    setChecking(false);
  };
  useEffect(() => { check(); }, [refreshTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const Row = ({ k, v, ok }: { k: string; v: React.ReactNode; ok?: boolean }) => (
    <div className="sys-row"><span>{k}</span><b>{ok !== undefined && <i className={`dot ${ok ? "ok" : "bad"}`} aria-hidden="true" />}{v}</b></div>
  );

  return (
    <div className="adm-page">
      <div className="adm-grid g-1-1">
        <section className="card">
          <header className="card-h"><div><h2>ডাটাবেজ সংযোগ</h2><p>MongoDB · <span className="en">.env.local → MONGODB_URI</span></p></div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={check} disabled={checking}><Icon name="refresh" />যাচাই</button></header>
          {!h ? <div className="adm-skel"><i /></div> : (
            <div className="sys-list">
              <Row k="অবস্থা" ok={h.ok} v={h.ok ? "সংযুক্ত" : "সংযোগ ব্যর্থ"} />
              <Row k="ডাটাবেজ" v={<span className="en">{h.database ?? "—"}</span>} />
              <Row k="সংরক্ষিত আবেদন" v={h.applications !== undefined ? bn(h.applications) : "—"} />
              <Row k="প্রতিক্রিয়া সময়" v={ms !== null ? `${bn(ms)} ms` : "—"} />
              {h.error && <div className="note warn" style={{ marginTop: 10 }}><Icon name="warn" /><div className="en" style={{ wordBreak: "break-word" }}>{h.error}</div></div>}
            </div>
          )}
        </section>

        <section className="card">
          <header className="card-h"><div><h2>কর্মসূচির নিয়মাবলি</h2><p>এসএমইএসপিডি সার্কুলার নং-০৫ অনুযায়ী</p></div></header>
          <div className="sys-list">
            <Row k="আবেদনের শেষ তারিখ" v={bnDate(PROGRAM.deadline)} />
            <Row k="সর্বোচ্চ বয়স (শেষ তারিখে)" v={`${bn(PROGRAM.maxAge)} বছর`} />
            <Row k="সর্বোচ্চ অর্থায়ন" v={`৳ ${lakh(PROGRAM.maxFinance)}`} />
            <Row k="ঋণ : অনুদান" v="৫০ : ৫০" />
            <Row k="সুদ/মুনাফার হার" v={`স্টার্ট-আপ ${bn(PROGRAM.rates.startup)}% · নারী ${bn(PROGRAM.rates.women)}% · সিএমএসএমই ${bn(PROGRAM.rates.cmsme)}%`} />
            <Row k="আওতাভুক্ত এলাকা" v="৮ জেলা · ৬৪ উপজেলা" />
          </div>
        </section>
      </div>

      <section className="card">
        <header className="card-h"><div><h2>নিরাপত্তা নির্দেশনা</h2><p>লাইভ করার আগে</p></div></header>
        <ul className="sys-tips">
          <li><Icon name="shield" /><span><b className="en">ADMIN_KEY</b> একটি লম্বা, এলোমেলো স্ট্রিং রাখুন এবং কাউকে শেয়ার করবেন না।</span></li>
          <li><Icon name="shield" /><span>MongoDB Atlas-এ Network Access শুধু সার্ভারের IP-তে সীমাবদ্ধ রাখুন।</span></li>
          <li><Icon name="shield" /><span>আবেদন জমার API-তে রেট লিমিটিং যোগ করুন এবং HTTPS ব্যবহার করুন।</span></li>
          <li><Icon name="shield" /><span>এক্সপোর্ট করা CSV ফাইলে ব্যক্তিগত তথ্য থাকে — নিরাপদে সংরক্ষণ করুন।</span></li>
        </ul>
      </section>
    </div>
  );
}
