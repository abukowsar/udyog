"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DISTRICTS, PROGRAM, REJECTED, STATUSES } from "@/lib/constants";
import { bn, bnDate, num, taka } from "@/lib/format";
import { Icon } from "../Icon";

/* ---------- scroll reveal + count-up ---------- */
export function RevealObserver() {
  useEffect(() => {
    const countUp = (el: HTMLElement) => {
      const target = +(el.dataset.count || 0), suffix = el.dataset.suffix || "";
      const t0 = performance.now(), dur = 1400;
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = bn(Math.round(target * e).toLocaleString("en-IN")) + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      document.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        en.target.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

/* ---------- countdown ---------- */
export function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = now === null ? 0 : PROGRAM.deadline.getTime() - now;
  const pad = (n: number) => bn(String(n).padStart(2, "0"));
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1000);
  return (
    <div className="countdown" aria-live="off">
      <div className="cd-label"><strong>আবেদনের শেষ তারিখ</strong>১৫ অক্টোবর ২০২৬</div>
      <div className="cd-units">
        {now !== null && ms <= 0 ? (
          <div className="cd-unit" style={{ padding: "8px 14px" }}><b style={{ fontSize: "1rem" }}>আবেদনের সময় শেষ</b></div>
        ) : (
          ([[d, "দিন", false], [h, "ঘণ্টা", true], [m, "মিনিট", true], [s, "সেকেন্ড", true]] as [number, string, boolean][]).map(([v, l, p]) => (
            <div className="cd-unit" key={l}><b>{now === null ? "–" : p ? pad(v) : bn(v)}</b><span>{l}</span></div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- financing calculator ---------- */
const CATS = [
  { label: "স্টার্ট-আপ", rate: PROGRAM.rates.startup },
  { label: "নারী উদ্যোক্তা", rate: PROGRAM.rates.women },
  { label: "সিএমএসএমই / কৃষি প্রক্রিয়াজাত", rate: PROGRAM.rates.cmsme }
];
export function Calculator() {
  const [need, setNeed] = useState("12,00,000");
  const [own, setOwn] = useState("0");
  const [rate, setRate] = useState<number>(PROGRAM.rates.startup);
  const N = num(need), O = Math.min(num(own), N);
  const requested = Math.max(0, N - O);
  const fin = Math.min(requested, PROGRAM.maxFinance);
  const loan = fin * PROGRAM.loanShare, grant = fin - loan, rest = N - fin;
  const pct = (v: number) => (N ? (v / N) * 100 : 0) + "%";
  const fmt = (v: string) => { const n = num(v); return n ? n.toLocaleString("en-IN") : "0"; };

  return (
    <div className="calc reveal" id="calculator">
      <div className="calc-in">
        <h3>অর্থায়ন ক্যালকুলেটর</h3>
        <p style={{ color: "var(--ink-2)", fontSize: ".95rem" }}>আপনার ব্যবসার জন্য প্রয়োজনীয় মোট মূলধন দিন — সম্ভাব্য ঋণ ও অনুদানের হিসাব দেখুন।</p>
        <div className="field">
          <label htmlFor="calcNeed">প্রয়োজনীয় মোট মূলধন</label>
          <div className="money-input"><span>৳</span><input id="calcNeed" inputMode="numeric" value={need} onChange={(e) => setNeed(e.target.value)} onBlur={() => setNeed(fmt(need))} /></div>
          <input type="range" min={50000} max={3000000} step={50000} value={Math.min(N, 3000000)} aria-label="মূলধনের পরিমাণ"
            onChange={(e) => setNeed((+e.target.value).toLocaleString("en-IN"))} />
        </div>
        <div className="field">
          <label htmlFor="calcOwn">নিজস্ব বিনিয়োগ (যদি থাকে)</label>
          <div className="money-input"><span>৳</span><input id="calcOwn" inputMode="numeric" value={own} onChange={(e) => setOwn(e.target.value)} onBlur={() => setOwn(fmt(own))} /></div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label id="catLbl">উদ্যোগের শ্রেণি</label>
          <div className="seg" role="radiogroup" aria-labelledby="catLbl">
            {CATS.map((c) => (
              <button key={c.label} type="button" role="radio" aria-checked={rate === c.rate} className={rate === c.rate ? "on" : ""} onClick={() => setRate(c.rate)}>{c.label}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="calc-out" aria-live="polite">
        <h3>আপনার সম্ভাব্য প্যাকেজ</h3>
        <div className="calc-total">মোট অর্থায়ন<b>{taka(fin)}</b></div>
        <div className="split-bar"><i className="loan" style={{ width: pct(loan) }} /><i className="grant" style={{ width: pct(grant) }} /><i className="own" style={{ width: pct(rest) }} /></div>
        <div className="split-legend">
          <div><small style={{ ["--c" as string]: "var(--leaf)" }}>ব্যাংক ঋণ</small><b>{taka(loan)}</b></div>
          <div><small style={{ ["--c" as string]: "var(--amber)" }}>অনুদান</small><b>{taka(grant)}</b></div>
          <div><small style={{ ["--c" as string]: "rgba(255,255,255,.4)" }}>নিজস্ব/অন্যান্য উৎস</small><b>{taka(rest)}</b></div>
          <div><small style={{ ["--c" as string]: "#fff" }}>সর্বোচ্চ সুদ/মুনাফা</small><b>{bn(rate)}%</b></div>
        </div>
        <div className={`calc-warn${requested > PROGRAM.maxFinance ? " show" : ""}`}>প্রয়োজন ২০ লক্ষ টাকার বেশি — কর্মসূচির আওতায় সর্বোচ্চ ২০ লক্ষ টাকা পর্যন্ত অর্থায়ন সম্ভব। বাকি অংশ নিজস্ব বা অন্য বৈধ উৎস থেকে সংস্থান করতে হবে।</div>
        <p className="calc-note">এটি একটি নির্দেশক হিসাব। চূড়ান্ত পরিমাণ ব্যাংকের ঋণ নীতিমালা ও মূল্যায়নের ভিত্তিতে নির্ধারিত হবে। নির্ধারিত সময়ে ঋণ পরিশোধে ব্যর্থ হলে অনুদানের অর্থ সুদবিহীন ঋণে রূপান্তরিত হবে।</p>
      </div>
    </div>
  );
}

/* ---------- eligibility quiz ---------- */
const Q = [
  { q: "১৫ অক্টোবর ২০২৬ তারিখে আপনার বয়স কি ২৮ বছর বা তার কম (এবং আপনি প্রাপ্তবয়স্ক)?", pass: "yes", fail: "আবেদনের শেষ তারিখে বয়স সর্বোচ্চ ২৮ বছর হতে হবে।" },
  { q: "আপনি কি কর্মসূচিভুক্ত ৬৪টি উপজেলার কোনো একটির স্থায়ী বাসিন্দা?", pass: "yes", fail: "প্রথম ধাপে কেবল ৮টি জেলার ৬৪টি উপজেলার স্থায়ী বাসিন্দারা আবেদন করতে পারবেন।" },
  { q: "আপনার কি একটি বাস্তবসম্মত ব্যবসায়িক ধারণা বা চলমান ব্যবসা আছে?", pass: "yes", fail: "আবেদনের জন্য নিজস্ব উদ্যোগ বা বাস্তবসম্মত ব্যবসায়িক পরিকল্পনা থাকতে হবে।" },
  { q: "আপনি কি আগে ব্যবসার জন্য কোনো ব্যাংক বা আর্থিক প্রতিষ্ঠান থেকে ঋণ নিয়েছেন?", pass: "no", fail: "ইতোপূর্বে ব্যবসার জন্য ঋণ গ্রহণকারী এ কর্মসূচির আওতায় বিবেচিত হবেন না।" },
  { q: "আপনি কি কোনো ব্যাংক বা আর্থিক প্রতিষ্ঠানে ঋণখেলাপি হিসেবে চিহ্নিত?", pass: "no", fail: "ঋণখেলাপি ব্যক্তি আবেদনের যোগ্য নন।" },
  { q: "আপনি কি সরকারি, আধা-সরকারি বা স্বায়ত্তশাসিত প্রতিষ্ঠানে কর্মরত?", pass: "no", fail: "সরকারি, আধা-সরকারি বা স্বায়ত্তশাসিত প্রতিষ্ঠানে কর্মরত ব্যক্তি অর্থায়নের যোগ্য নন।" }
];
export function Quiz() {
  const [i, setI] = useState(0);
  const [fails, setFails] = useState<string[]>([]);
  const done = i >= Q.length, ok = fails.length === 0;
  const answer = (a: string) => { if (a !== Q[i].pass) setFails((f) => [...f, Q[i].fail]); setI(i + 1); };
  return (
    <div className="quiz reveal">
      <div className="quiz-head"><h3>৩০ সেকেন্ডে যোগ্যতা যাচাই</h3><span className="en" style={{ color: "var(--ink-3)", fontSize: ".9rem" }}>{done ? "" : `${bn(i + 1)} / ${bn(Q.length)}`}</span></div>
      <div className="quiz-progress"><i style={{ width: `${(i / Q.length) * 100}%` }} /></div>
      {!done ? (
        <div>
          <div className="quiz-q">{Q[i].q}</div>
          <div className="quiz-opts"><button type="button" onClick={() => answer("yes")}>হ্যাঁ</button><button type="button" onClick={() => answer("no")}>না</button></div>
        </div>
      ) : (
        <div className={`quiz-result ${ok ? "ok" : "bad"}`}>
          <div className="ri"><Icon name={ok ? "check" : "x"} /></div>
          <h3>{ok ? "অভিনন্দন! আপনি আবেদনের যোগ্য বলে মনে হচ্ছে" : "দুঃখিত, আপনি সম্ভবত যোগ্য নন"}</h3>
          {ok ? <p style={{ color: "var(--ink-2)" }}>চূড়ান্ত যোগ্যতা ব্যাংক কর্তৃক যাচাই (KYC, সিআইবি) সাপেক্ষে নির্ধারিত হবে।</p>
            : <ul>{fails.map((f) => <li key={f}>{f}</li>)}</ul>}
          <div className="btns">
            {ok && <Link className="btn btn-primary" href="/apply">এখনই আবেদন করুন</Link>}
            <button className="btn btn-ghost" type="button" onClick={() => { setI(0); setFails([]); }}>আবার যাচাই করুন</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- district explorer ---------- */
export function Districts() {
  const [active, setActive] = useState<string | null>(null);
  const d = DISTRICTS.find((x) => x.id === active);
  return (
    <>
      <div className="dist-grid">
        {DISTRICTS.map((x) => (
          <button key={x.id} type="button" className={`dist${active === x.id ? " active" : ""}`} style={{ ["--c" as string]: x.color }}
            aria-expanded={active === x.id} onClick={() => setActive(active === x.id ? null : x.id)}>
            <small>{x.division} বিভাগ</small><h3>{x.bn}</h3>
            <span className="n"><b>{bn(x.upazilas.length)}</b> উপজেলা</span>
          </button>
        ))}
      </div>
      {d && (
        <div className="upz-panel show" aria-live="polite">
          <h4>{d.bn} জেলার উপজেলাসমূহ <span className="en" style={{ color: "var(--ink-3)", fontWeight: 500 }}>· {d.en}</span></h4>
          <div className="upz-list">{d.upazilas.map((u) => <span key={u}>{u}</span>)}</div>
          <p style={{ margin: "14px 0 0", color: "var(--ink-2)", fontSize: ".92rem" }}>প্রতিটি উপজেলা থেকে ১০ জন — এই জেলা থেকে মোট {bn(d.upazilas.length * 10)} জন উদ্যোক্তা নির্বাচিত হবেন।</p>
        </div>
      )}
    </>
  );
}

/* ---------- tracking modal (reads MongoDB through /api/applications/:id) ---------- */
interface PublicApp { trackingId: string; district: string; upazila: string; status: string; submittedAt: string; history: { status: string; at: string; note?: string }[] }

export function TrackModal() {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<PublicApp | null>(null);
  const [err, setErr] = useState("");

  const lookup = async (raw: string) => {
    const q = raw.trim().toUpperCase();
    if (!q) return;
    setLoading(true); setErr(""); setRes(null);
    try {
      const r = await fetch(`/api/applications/${encodeURIComponent(q)}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) setErr(j.error || "পাওয়া যায়নি"); else setRes(j);
    } catch { setErr("সংযোগে সমস্যা হয়েছে, আবার চেষ্টা করুন।"); }
    setLoading(false);
  };

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("udyog:track", on);
    const qp = new URLSearchParams(location.search).get("track");
    if (qp) { setId(qp); setOpen(true); lookup(qp); }
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => { window.removeEventListener("udyog:track", on); document.removeEventListener("keydown", esc); };
  }, []);

  const reached = (k: string) => res?.history.find((h) => h.status === k);
  const curIdx = res ? STATUSES.findIndex((s) => s.key === res.status) : -1;
  const rejected = res?.status === "rejected";

  return (
    <div className={`modal${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="trackTitle" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="modal-card">
        <button className="modal-close" type="button" aria-label="বন্ধ করুন" onClick={() => setOpen(false)}>×</button>
        <h3 id="trackTitle">আবেদনের অবস্থা</h3>
        <p style={{ color: "var(--ink-2)", fontSize: ".95rem", margin: 0 }}>অনলাইন ফরম জমা দেওয়ার পর প্রাপ্ত ট্র্যাকিং নম্বর লিখুন।</p>
        <form className="track-row" onSubmit={(e) => { e.preventDefault(); lookup(id); }}>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="UDY-26-XXXXXX" aria-label="ট্র্যাকিং নম্বর" autoComplete="off" autoFocus={open} />
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "খোঁজা হচ্ছে…" : "খুঁজুন"}</button>
        </form>
        {err && <div className="empty-note">{err}</div>}
        {res && (
          <>
            <div style={{ padding: "14px 16px", borderRadius: 14, background: "var(--bg)", marginTop: 4 }}>
              <b className="en">{res.trackingId}</b><br />
              <small style={{ color: "var(--ink-3)" }}>{res.upazila}, {res.district} · জমা: {bnDate(res.submittedAt, true)}</small>
            </div>
            <ul className="timeline">
              {STATUSES.map((s, i) => {
                const h = reached(s.key);
                const cls = rejected ? (h ? "done" : "") : i < curIdx || (i === curIdx && i === STATUSES.length - 1) ? "done" : i === curIdx ? "now" : "";
                return (
                  <li key={s.key} className={cls}><i /><b>{s.bn}</b>
                    <small>{h ? bnDate(h.at, true) + (h.note ? ` — ${h.note}` : "") : s.hint}</small></li>
                );
              })}
              {rejected && <li className="now"><i style={{ borderColor: "var(--red)" }} /><b>{REJECTED.bn}</b><small>{reached("rejected")?.note || REJECTED.hint}</small></li>}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
