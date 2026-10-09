"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DISTRICTS, REJECTED, STATUSES, STATUS_KEYS, statusLabel } from "@/lib/constants";
import { bn, bnDate, taka } from "@/lib/format";
import { DOCS, REVIEW, STEPS, display, shown, val, type Data } from "@/lib/schema";
import { Icon } from "../Icon";
import { PrintDoc } from "../apply/PrintDoc";
import { useAdmin } from "./AdminShell";

interface Row {
  trackingId: string; nameBn: string; nameEn: string; phone: string; nid: string; district: string; upazila: string;
  bizStatus: string; gender?: string; age: number | null; status: string; submittedAt: string;
  finance: { total: number; requested: number; loan: number; grant: number };
}
interface Full extends Row { data: Data; history: { status: string; at: string; note?: string }[] }
interface ListRes { items: Row[]; total: number; page: number; pages: number; byStatus: { _id: string; n: number }[] }

export default function ApplicationsView() {
  const { api, download, refreshTick } = useAdmin();
  const sp = useSearchParams();
  const router = useRouter();
  const [filters, setFilters] = useState({ district: sp.get("district") || "", upazila: sp.get("upazila") || "", status: sp.get("status") || "", q: sp.get("q") || "", page: 1 });
  const [qInput, setQInput] = useState(filters.q);
  const [list, setList] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState<Full | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // header search / deep links update the filters
  useEffect(() => {
    const q = sp.get("q") || "", status = sp.get("status") || "", district = sp.get("district") || "", upazila = sp.get("upazila") || "";
    setFilters((f) => (f.q === q && f.status === status && f.district === district && f.upazila === upazila ? f : { q, status, district, upazila, page: 1 }));
    setQInput(q);
  }, [sp]);

  // debounce the inline search box
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === qInput ? f : { ...f, q: qInput, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(async () => {
    setLoading(true); setMsg("");
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== "").map(([k, v]) => [k, String(v)]));
    try { setList(await api<ListRes>(`/api/applications?${qs}`)); } catch (e) { setMsg((e as Error).message); }
    setLoading(false);
  }, [filters, api]);
  useEffect(() => { load(); }, [load, refreshTick]);

  const open = useCallback(async (id: string) => {
    try { setSel(await api<Full>(`/api/applications/${id}`)); setNote(""); } catch (e) { setMsg((e as Error).message); }
  }, [api]);
  useEffect(() => { const o = sp.get("open"); if (o) open(o); }, [sp, open]);

  const close = () => { setSel(null); if (sp.get("open")) router.replace("/admin/applications"); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  });

  const changeStatus = async (status: string) => {
    if (!sel) return;
    setSaving(true);
    try {
      const u = await api<Full>(`/api/applications/${sel.trackingId}`, { method: "PATCH", body: JSON.stringify({ status, note }) });
      setSel({ ...sel, status: u.status, history: u.history }); setNote(""); load();
    } catch (e) { setMsg((e as Error).message); }
    setSaving(false);
  };

  const exportCsv = async () => {
    const qs = new URLSearchParams(Object.entries({ district: filters.district, upazila: filters.upazila, status: filters.status }).filter(([, v]) => v));
    try { await download(`/api/admin/export?${qs}`, `udyog-applications-${new Date().toISOString().slice(0, 10)}.csv`); } catch (e) { setMsg((e as Error).message); }
  };

  const upazilas = DISTRICTS.find((d) => d.bn === filters.district)?.upazilas ?? [];
  const setF = (p: Partial<typeof filters>) => setFilters((f) => ({ ...f, page: 1, ...p }));
  const count = (k: string) => list?.byStatus.find((x) => x._id === k)?.n ?? 0;
  const all = list?.byStatus.reduce((s, x) => s + x.n, 0) ?? 0;

  return (
    <>
      <div className="screen-only">
      <div className="adm-page">
        <div className="tabs" role="tablist" aria-label="অবস্থা">
          <button role="tab" aria-selected={!filters.status} className={!filters.status ? "on" : ""} onClick={() => setF({ status: "" })}>সব <span>{bn(all)}</span></button>
          {[...STATUSES, REJECTED].map((s) => (
            <button key={s.key} role="tab" aria-selected={filters.status === s.key} className={filters.status === s.key ? "on" : ""} onClick={() => setF({ status: s.key })}>
              {s.bn} <span>{bn(count(s.key))}</span></button>
          ))}
        </div>

        <section className="card">
          <div className="toolbar">
            <div className="tb-search"><Icon name="search" /><input value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="নাম, ট্র্যাকিং নম্বর, এনআইডি বা ফোন" aria-label="খুঁজুন" /></div>
            <select className="inp" value={filters.district} onChange={(e) => setF({ district: e.target.value, upazila: "" })} aria-label="জেলা">
              <option value="">সকল জেলা</option>{DISTRICTS.map((d) => <option key={d.id}>{d.bn}</option>)}
            </select>
            <select className="inp" value={filters.upazila} onChange={(e) => setF({ upazila: e.target.value })} disabled={!filters.district} aria-label="উপজেলা">
              <option value="">সকল উপজেলা</option>{upazilas.map((u) => <option key={u}>{u}</option>)}
            </select>
            <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}><Icon name="download" />CSV</button>
          </div>

          {msg && <div className="note warn" style={{ margin: "0 0 14px" }}><Icon name="warn" /><div>{msg}</div></div>}

          <div className="tbl-wrap">
            <table className="tbl hover">
              <thead><tr><th>ট্র্যাকিং</th><th>আবেদনকারী</th><th>এলাকা</th><th>ধরন</th><th className="num">আবেদনকৃত</th><th>অবস্থা</th><th>জমা</th></tr></thead>
              <tbody>
                {loading && !list ? <tr><td colSpan={7} className="tbl-empty">লোড হচ্ছে…</td></tr> :
                  list?.items.length ? list.items.map((r) => (
                    <tr key={r.trackingId} onClick={() => open(r.trackingId)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && open(r.trackingId)}>
                      <td className="en mono-s">{r.trackingId}</td>
                      <td><b>{r.nameBn}</b><br /><small className="en muted">{r.nameEn} · {r.phone}</small></td>
                      <td>{r.upazila}<br /><small className="muted">{r.district}</small></td>
                      <td>{r.bizStatus === "new" ? "নতুন ধারণা" : "চলমান ব্যবসা"}{r.gender === "নারী" && <span className="tag-w">নারী</span>}</td>
                      <td className="num">{taka(r.finance.requested)}</td>
                      <td><span className={`badge s-${r.status}`}>{statusLabel(r.status)}</span></td>
                      <td className="muted">{bnDate(r.submittedAt)}</td>
                    </tr>
                  )) : <tr><td colSpan={7} className="tbl-empty">কোনো আবেদন পাওয়া যায়নি</td></tr>}
              </tbody>
            </table>
          </div>
          {list && (
            <div className="pager">
              <span>মোট {bn(list.total)}টি · পৃষ্ঠা {bn(list.page)} / {bn(list.pages)}</span>
              <div>
                <button className="btn btn-ghost btn-sm" disabled={list.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>← আগের</button>
                <button className="btn btn-ghost btn-sm" disabled={list.page >= list.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>পরের →</button>
              </div>
            </div>
          )}
        </section>
      </div>

      {sel && (
        <div className="drawer-back" onClick={(e) => e.target === e.currentTarget && close()}>
          <aside className="drawer" role="dialog" aria-modal="true" aria-label={sel.trackingId}>
            <div className="drawer-head">
              <div className="dh-id">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {sel.data.photo ? <img src={sel.data.photo} alt="" /> : <span className="av lg">{sel.nameEn?.[0] || "?"}</span>}
                <div><small className="en">{sel.trackingId}</small><h2>{sel.nameBn}</h2>
                  <span className={`badge s-${sel.status}`}>{statusLabel(sel.status)}</span></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => window.print()}><Icon name="print" />প্রিন্ট</button>
                <button className="adm-icon-btn" type="button" aria-label="বন্ধ" onClick={close}><Icon name="x" /></button>
              </div>
            </div>

            <div className="dh-facts">
              <div><small>এলাকা</small><b>{sel.upazila}, {sel.district}</b></div>
              <div><small>আবেদনকৃত</small><b>{taka(sel.finance.requested)}</b></div>
              <div><small>ঋণ / অনুদান</small><b>{taka(sel.finance.loan)} / {taka(sel.finance.grant)}</b></div>
              <div><small>বয়স</small><b>{sel.age === null ? "—" : `${bn(sel.age)} বছর`}</b></div>
            </div>

            <div className="drawer-sec">
              <h3>অবস্থা পরিবর্তন</h3>
              <textarea className="inp" rows={2} placeholder="মন্তব্য (ঐচ্ছিক) — আবেদনকারী ট্র্যাকিং পেজে দেখতে পাবেন" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="status-btns">
                {[...STATUSES, REJECTED].map((s) => (
                  <button key={s.key} type="button" disabled={saving || s.key === sel.status}
                    className={`btn btn-sm btn-ghost${s.key === "rejected" ? " danger" : ""}${s.key === sel.status ? " cur" : ""}`} onClick={() => changeStatus(s.key)}>{s.bn}</button>
                ))}
              </div>
              <ul className="timeline">
                {[...sel.history].reverse().map((h, i) => <li key={i} className={i === 0 ? "now" : "done"}><i /><b>{statusLabel(h.status)}</b><small>{bnDate(h.at, true)}{h.note ? ` — ${h.note}` : ""}</small></li>)}
              </ul>
            </div>

            {STEPS.slice(0, REVIEW).map((s) => {
              const d = sel.data;
              const rows = s.sections.filter((sec) => shown(sec, d)).flatMap((sec) => (sec.fields || []).filter((fd) => shown(fd, d) && fd.type !== "note"));
              return (
                <div className="rv-sec" key={s.key} style={{ marginTop: 14 }}>
                  <div className="rv-head"><h3>{val(s.part, d)} · {val(s.short, d)}</h3></div>
                  <div className="rv-list">
                    {rows.map((fd) => [<div className="k" key={fd.id + "k"}>{fd.no ? fd.no + ". " : ""}{fd.label || fd.aria || (fd.text ? val(fd.text, d) : "")}</div>,
                      <div className="v" key={fd.id + "v"}>{display(fd, d) || "—"}</div>])}
                    {s.key === "other" && DOCS.map((doc) => [<div className="k" key={doc.id + "k"}>{doc.t}</div>, <div className="v" key={doc.id + "v"}>{d[doc.id]?.name || "—"}</div>])}
                  </div>
                </div>
              );
            })}
          </aside>
        </div>
      )}
      </div>
      {sel && <PrintDoc d={sel.data} trackingId={sel.trackingId} at={sel.submittedAt} />}
    </>
  );
}
