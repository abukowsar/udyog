"use client";
import Link from "next/link";
import { useState } from "react";
import { DISTRICTS } from "@/lib/constants";
import { bn, taka } from "@/lib/format";
import { Icon } from "../Icon";
import { Meter } from "./charts";
import { useStats } from "./Overview";

const SEATS_PER_UPAZILA = 10;

export default function CoverageView() {
  const { stats, err } = useStats(30);
  const [open, setOpen] = useState<string | null>(DISTRICTS[0].id);
  if (err) return <div className="note warn"><Icon name="warn" /><div>{err}</div></div>;
  if (!stats) return <div className="adm-skel"><i /><i /><i /></div>;

  const up = (d: string, u: string) => stats.byUpazila.find((x) => x.district === d && x.upazila === u);
  const reached = DISTRICTS.reduce((s, d) => s + d.upazilas.filter((u) => up(d.bn, u)).length, 0);

  return (
    <div className="adm-page">
      <div className="kpi-row k3">
        <div className="kpi"><div className="kpi-ico t-navy"><Icon name="map" /></div><div className="kpi-body"><span className="kpi-l">আবেদন এসেছে এমন উপজেলা</span><b className="kpi-v">{bn(reached)} / ৬৪</b><Meter value={reached} max={64} label="উপজেলা কভারেজ" /></div></div>
        <div className="kpi"><div className="kpi-ico t-green"><Icon name="users" /></div><div className="kpi-body"><span className="kpi-l">প্রথম ধাপের আসন</span><b className="kpi-v">৬৪০</b><span className="kpi-s">প্রতি উপজেলায় {bn(SEATS_PER_UPAZILA)} জন</span></div></div>
        <div className="kpi"><div className="kpi-ico t-amber"><Icon name="inbox" /></div><div className="kpi-body"><span className="kpi-l">প্রতি আসনে আবেদন</span><b className="kpi-v">{bn((stats.totals.applications / 640).toFixed(2))}</b><span className="kpi-s">মোট আবেদন ÷ ৬৪০</span></div></div>
      </div>

      <div className="cov-list">
        {DISTRICTS.map((d) => {
          const rows = d.upazilas.map((u) => ({ u, r: up(d.bn, u) }));
          const n = rows.reduce((s, x) => s + (x.r?.n ?? 0), 0);
          const req = rows.reduce((s, x) => s + (x.r?.requested ?? 0), 0);
          const appr = rows.reduce((s, x) => s + (x.r?.approved ?? 0), 0);
          const seats = d.upazilas.length * SEATS_PER_UPAZILA;
          const isOpen = open === d.id;
          return (
            <section className={`card cov${isOpen ? " open" : ""}`} key={d.id}>
              <button type="button" className="cov-h" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : d.id)}>
                <span className="cov-name"><b>{d.bn}</b><small>{d.division} বিভাগ · {bn(d.upazilas.length)} উপজেলা</small></span>
                <span className="cov-stat"><small>আবেদন</small><b>{bn(n)}</b></span>
                <span className="cov-stat"><small>আবেদনকৃত</small><b>{taka(req)}</b></span>
                <span className="cov-stat wide"><small>অনুমোদিত {bn(appr)} / আসন {bn(seats)}</small><Meter value={appr} max={seats} label={`${d.bn} অনুমোদন`} /></span>
                <Icon name="arrow" className="cov-chev" />
              </button>
              {isOpen && (
                <div className="tbl-wrap">
                  <table className="tbl">
                    <thead><tr><th>উপজেলা</th><th className="num">আবেদন</th><th className="num">নারী</th><th className="num">আবেদনকৃত অর্থায়ন</th><th>অনুমোদিত / আসন</th><th></th></tr></thead>
                    <tbody>
                      {rows.map(({ u, r }) => (
                        <tr key={u}>
                          <td><b>{u}</b></td>
                          <td className="num">{bn(r?.n ?? 0)}</td>
                          <td className="num">{bn(r?.women ?? 0)}</td>
                          <td className="num">{taka(r?.requested ?? 0)}</td>
                          <td style={{ minWidth: 160 }}><div className="meter-row"><Meter value={r?.approved ?? 0} max={SEATS_PER_UPAZILA} /><span>{bn(r?.approved ?? 0)}/{bn(SEATS_PER_UPAZILA)}</span></div></td>
                          <td><Link className="card-link" href={`/admin/applications?district=${encodeURIComponent(d.bn)}&upazila=${encodeURIComponent(u)}`}>তালিকা</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
