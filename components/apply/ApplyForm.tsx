"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DISTRICTS, PROGRAM } from "@/lib/constants";
import { ageOn, bn, bnDate, enMoney, isBlank, lakh, num, taka, words } from "@/lib/format";
import {
  BUDGET, DECLARATION, DOCS, FIELD, REVIEW, SOURCES, STEPS,
  budgetTotal, display, effective, fieldError, shown, stepErrors, upazilasOf, val,
  type CardOption, type Data, type Field, type Section
} from "@/lib/schema";
import { Icon } from "../Icon";
import { PrintDoc } from "./PrintDoc";

const DRAFT_KEY = "udyog-draft-v2";
const store = {
  get<T>(k: string, fb: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
};

/** Side effects of changing one key — returns the next data object (pure). */
function applyHooks(prev: Data, k: string, v: unknown): Data {
  const d: Data = { ...prev, [k]: v, _auto: { ...(prev._auto || {}) } };
  delete d._auto[k];

  const m = k.match(/^(.*)_m$/);
  if (m && FIELD[m[1]]?.type === "money3") {
    const n = num(v);
    ([["q", 3], ["y", 12]] as const).forEach(([s, mult]) => {
      const key = `${m[1]}_${s}`;
      if (isBlank(d[key]) || d._auto[key]) { d[key] = enMoney(n * mult); d._auto[key] = true; }
    });
  }
  if (k === "prog_district" && !upazilasOf(String(v)).includes(d.prog_upazila)) d.prog_upazila = "";
  if (k === "fin_total" || k === "fin_own") {
    if (isBlank(d.fin_req) || d._auto.fin_req) {
      d.fin_req = enMoney(Math.max(0, Math.min(num(d.fin_total) - num(d.fin_own), PROGRAM.maxFinance)));
      d._auto.fin_req = true;
    }
  }
  if (k === "perm_same" && !v) {
    const dist = DISTRICTS.find((x) => x.bn === d.prog_district);
    if (isBlank(d.perm_thana)) d.perm_thana = d.prog_upazila || "";
    if (isBlank(d.perm_district)) d.perm_district = d.prog_district || "";
    if (isBlank(d.perm_division) && dist) d.perm_division = dist.division;
  }
  return d;
}

type SetFn = (k: string, v: unknown) => void;

// =====================================================================
export default function ApplyForm() {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<Data>({ _auto: {} });
  const [cur, setCur] = useState(0);
  const [visited, setVisited] = useState<number[]>([]);
  const [blurred, setBlurred] = useState<Set<string>>(new Set());
  const [saveMsg, setSaveMsg] = useState("খসড়া স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়");
  const [toast, setToast] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ id: string; at: string; d: Data } | null>(null);
  const [scrollTick, setScrollTick] = useState(0);
  const stepperRef = useRef<HTMLOListElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flash = useCallback((m: string) => {
    setToast(m); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3200);
  }, []);

  // ---- load draft ----
  useEffect(() => {
    const dr = store.get<{ data?: Data; cur?: number; visited?: number[] } | null>(DRAFT_KEY, null);
    if (dr?.data) { setData({ _auto: {}, ...dr.data }); setCur(Math.min(Math.max(0, dr.cur || 0), REVIEW)); setVisited(dr.visited || []); }
    setReady(true);
  }, []);

  // ---- autosave (debounced) ----
  useEffect(() => {
    if (!ready || done) return;
    const t = setTimeout(() => {
      let ok = store.set(DRAFT_KEY, { data, cur, visited });
      if (!ok && data.photo) { const { photo: _p, ...rest } = data; ok = store.set(DRAFT_KEY, { data: rest, cur, visited }); }
      setSaveMsg(ok ? "সংরক্ষিত · " + new Date().toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" }) : "এই ব্রাউজারে খসড়া সংরক্ষণ সম্ভব হয়নি");
    }, 400);
    return () => clearTimeout(t);
  }, [data, cur, visited, ready, done]);

  const set: SetFn = useCallback((k, v) => setData((p) => (p[k] === v ? p : applyHooks(p, k, v))), []);
  const blur = useCallback((id: string) => setBlurred((b) => (b.has(id) ? b : new Set(b).add(id))), []);

  // ---- validation (derived) ----
  const summaries = useMemo(() => STEPS.map((_, i) => (i === REVIEW ? null : stepErrors(i, data))), [data]);
  const curErrs = useMemo(() => {
    const m: Record<string, string> = {};
    summaries[cur]?.errs.forEach((e) => (m[e.id] = e.msg));
    return m;
  }, [summaries, cur]);
  const showAll = visited.includes(cur);
  const errFor = (id: string) => (showAll || blurred.has(id) ? curErrs[id] || "" : "");

  const progress = useMemo(() => {
    let T = 0, F = 0;
    summaries.forEach((s) => { if (s) { T += s.total; F += s.filled; } });
    return T ? Math.round((F / T) * 100) : 0;
  }, [summaries]);

  // ---- navigation ----
  const go = (i: number) => {
    setVisited((v) => (v.includes(cur) ? v : [...v, cur]));
    setCur(Math.max(0, Math.min(REVIEW, i)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const ol = stepperRef.current, li = ol?.querySelector<HTMLElement>(".cur");
    if (ol && li && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = li.offsetLeft - ol.clientWidth / 2 + li.clientWidth / 2;
  }, [cur, ready]);
  useEffect(() => {
    if (!scrollTick) return;
    const w = document.querySelector<HTMLElement>(".fld.invalid");
    if (w) { w.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => w.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true }), 350); }
  }, [scrollTick]);

  const next = () => {
    if (cur === REVIEW) return submit();
    setVisited((v) => (v.includes(cur) ? v : [...v, cur]));
    const n = summaries[cur]?.errs.length || 0;
    if (n) { flash(`${bn(n)}টি ঘর পূরণ/সংশোধন প্রয়োজন`); setScrollTick((t) => t + 1); return; }
    go(cur + 1);
  };

  // ---- submit to MongoDB via API ----
  async function submit() {
    const bad = summaries.findIndex((s) => s && s.errs.length);
    if (bad >= 0) {
      setVisited((v) => Array.from(new Set([...v, bad])));
      flash(`"${val(STEPS[bad].short, data)}" ধাপে কিছু তথ্য বাকি বা সঠিক নয়`);
      setCur(bad); setTimeout(() => setScrollTick((t) => t + 1), 80);
      return;
    }
    setSubmitting(true);
    const d = effective(data);
    const payload = Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith("_")));
    try {
      const r = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 201) {
        store.del(DRAFT_KEY);
        setDone({ id: j.trackingId, at: j.submittedAt, d });
        window.scrollTo({ top: 0 });
      } else if (r.status === 422 && Array.isArray(j.errors) && j.errors.length) {
        const first = j.errors[0].step as number;
        setVisited(Array.from(new Set(j.errors.map((e: { step: number }) => e.step))));
        flash(j.error || "কিছু তথ্য সঠিক নয়"); setCur(first); setTimeout(() => setScrollTick((t) => t + 1), 80);
      } else {
        flash(j.error || "জমা দেওয়া যায়নি, আবার চেষ্টা করুন।");
      }
    } catch {
      flash("সংযোগে সমস্যা — ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।");
    }
    setSubmitting(false);
  }

  const reset = () => {
    if (!confirm("আপনার সংরক্ষিত খসড়া মুছে ফেলতে চান?")) return;
    store.del(DRAFT_KEY); setData({ _auto: {} }); setCur(0); setVisited([]); setBlurred(new Set());
  };

  const step = STEPS[cur];
  const ctx: Ctx = { data, set, blur, errFor, go };

  return (
    <>
      <div className="screen-only">
        <header className="site-header scrolled">
          <div className="container nav">
            <Link href="/" className="brand" aria-label="উদ্যোগ — হোম">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/udyog-logo.png" alt="UDYOG" />
            </Link>
            <div className="nav-actions">
              <span className="save-state" aria-live="polite"><Icon name="cloud" /><span>{done ? "আবেদন জমা হয়েছে" : saveMsg}</span></span>
              <Link className="btn btn-ghost btn-sm" href="/"><Icon name="back" /><span className="hide-sm">হোম</span></Link>
            </div>
          </div>
        </header>

        {done ? <Success done={done} onNew={() => { setDone(null); setData({ _auto: {} }); setCur(0); setVisited([]); setBlurred(new Set()); }} flash={flash} /> : (
          <main className="apply-wrap container">
            <aside className="stepper" aria-label="ধাপসমূহ">
              <div className="stepper-head">
                <div className="ring" style={{ ["--p" as string]: progress }}><span>{bn(progress)}%</span></div>
                <div><b>আবেদন ফরম</b><small>শেষ তারিখ ১৫ অক্টোবর ২০২৬</small></div>
              </div>
              <ol ref={stepperRef}>
                {STEPS.map((s, i) => {
                  const r = summaries[i], seen = visited.includes(i), isCur = i === cur;
                  const state = r && seen ? (r.errs.length ? "err" : "done") : "";
                  return (
                    <li key={s.key} className={[isCur && "cur", state].filter(Boolean).join(" ")}>
                      <button type="button" onClick={() => go(i)} aria-current={isCur ? "step" : undefined}>
                        <span className="sn">{!isCur && state === "done" ? <Icon name="check" /> : !isCur && state === "err" ? "!" : bn(i + 1)}</span>
                        <span className="st"><b>{val(s.short, data)}</b><small>{val(s.part, data)}</small></span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <button className="btn btn-link reset-btn" type="button" onClick={reset}><Icon name="trash" />খসড়া মুছে নতুন করে শুরু</button>
            </aside>

            <section className="form-col">
              <form noValidate autoComplete="on" onSubmit={(e) => e.preventDefault()}>
                <div className="step-card" key={cur}>
                  <div className="step-top">
                    <span className="part">{val(step.part, data)}</span>
                    <h2>{val(step.title, data)}</h2>
                    <p>{val(step.desc, data)}</p>
                  </div>
                  <div className="step-body">
                    {!ready ? <p style={{ color: "var(--ink-3)" }}>লোড হচ্ছে…</p> :
                      step.sections.map((sec, i) => shown(sec, data) && <SectionView key={i} sec={sec} ctx={ctx} summaries={summaries} />)}
                  </div>
                </div>
                <div className="step-nav">
                  <button type="button" className="btn btn-ghost" onClick={() => go(cur - 1)} style={{ visibility: cur === 0 ? "hidden" : "visible" }}><Icon name="back" />পূর্ববর্তী</button>
                  <span className="step-count">ধাপ {bn(cur + 1)} / {bn(STEPS.length)}</span>
                  <button type="button" className="btn btn-primary" onClick={next} disabled={submitting}>
                    {cur === REVIEW ? (submitting ? "জমা হচ্ছে…" : <>আবেদন জমা দিন<Icon name="check" /></>) : <>পরবর্তী ধাপ<Icon name="arrow" /></>}
                  </button>
                </div>
              </form>
            </section>
          </main>
        )}
      </div>
      {done && <PrintDoc d={done.d} trackingId={done.id} at={done.at} />}
      <div className={`toast${toast ? " show" : ""}`} role="status">{toast}</div>
    </>
  );
}

interface Ctx { data: Data; set: SetFn; blur: (id: string) => void; errFor: (id: string) => string; go: (i: number) => void }
type Summaries = ({ errs: { id: string; msg: string }[] } | null)[];

// =====================================================================
function SectionView({ sec, ctx, summaries }: { sec: Section; ctx: Ctx; summaries: Summaries }) {
  const { data } = ctx;
  return (
    <div className="fsec">
      {sec.title && <><h3 className="fsec-title">{sec.title}</h3>{sec.desc && <p className="fsec-desc">{sec.desc}</p>}</>}
      {sec.block === "intro" && (new Date() > PROGRAM.deadline
        ? <div className="note danger"><Icon name="warn" /><div>আবেদনের নির্ধারিত শেষ তারিখ (১৫ অক্টোবর ২০২৬) অতিক্রান্ত হয়েছে। নতুন সময়সূচির জন্য সংশ্লিষ্ট ব্যাংক শাখায় যোগাযোগ করুন।</div></div>
        : <div className="note info"><Icon name="info" /><div>ফরমটি ৮টি সহজ ধাপে বিভক্ত। খসড়া এই ডিভাইসে স্বয়ংক্রিয়ভাবে সংরক্ষিত হয় এবং জমা দিলে আবেদনটি সরাসরি কর্মসূচির ডাটাবেজে পৌঁছায়। <b>*</b> চিহ্নিত ঘরগুলো আবশ্যক।</div></div>)}
      {sec.block === "needStatus" && (
        <div className="note warn"><Icon name="warn" /><div>প্রথম ধাপে আপনার উদ্যোগের অবস্থা (নতুন ধারণা / চলমান ব্যবসা) নির্বাচন করুন। <button type="button" className="btn btn-link btn-sm" onClick={() => ctx.go(0)}>প্রথম ধাপে যান</button></div></div>
      )}
      {sec.block === "declText" && <div className="decl-text">{DECLARATION.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}</div>}
      {sec.fields && (
        <div className="fgrid">
          {sec.fields.map((fd) => <FieldView key={fd.id} fd={fd} ctx={ctx} hidden={!shown(fd, data)} />)}
        </div>
      )}
      {sec.custom === "finsummary" && <FinSummary d={data} />}
      {sec.custom === "budget" && <Budget ctx={ctx} />}
      {sec.custom === "uploads" && <Uploads ctx={ctx} />}
      {sec.custom === "signature" && <Signature ctx={ctx} />}
      {sec.custom === "review" && <Review d={data} go={ctx.go} summaries={summaries} />}
    </div>
  );
}

// =====================================================================
function Label({ fd, htmlFor }: { fd: Field; htmlFor?: string }) {
  if (!fd.label && !fd.no) return null;
  const inner = <>{fd.no && <span className="no">{fd.no}</span>}{fd.label}{fd.req && <span className="req" aria-hidden="true">*</span>}{fd.en && <span className="en-l">{fd.en}</span>}</>;
  return htmlFor ? <label htmlFor={htmlFor}>{inner}</label> : <div className="lbl" id={`l_${fd.id}`}>{inner}</div>;
}

const moneyHint = (v: unknown) => { const n = num(v); return n ? `= ${taka(n)}${n >= 100000 ? ` (${lakh(n)})` : ""}` : ""; };

function FieldView({ fd, ctx, hidden }: { fd: Field; ctx: Ctx; hidden: boolean }) {
  const { data: d, set, blur } = ctx;
  if (hidden) return null;
  const id = `f_${fd.id}`;
  const err = ctx.errFor(fd.id);
  const v = d[fd.id] ?? "";
  const common = {
    id, "aria-describedby": `e_${fd.id}`, "aria-invalid": err ? true : undefined, "aria-required": fd.req || undefined,
    onBlur: () => blur(fd.id)
  };
  const ph = fd.placeholder ? val(fd.placeholder, d) : undefined;
  const fmtMoneyOnBlur = (k: string) => () => { const f = enMoney(num(d[k])); if (d[k] !== f) set(k, f); blur(fd.id); };

  let control: React.ReactNode = null, grouped = false;
  switch (fd.type) {
    case "text": case "tel": case "email":
      control = <input className={`inp ${fd.cls || ""}`} type={fd.type} {...common} value={v} placeholder={ph} inputMode={fd.inputMode} autoComplete={fd.ac}
        onChange={(e) => set(fd.id, fd.cls === "upper" ? e.target.value.toUpperCase() : e.target.value)} />;
      break;
    case "date":
      control = <input className="inp" type="date" {...common} value={v} max={fd.max} onChange={(e) => set(fd.id, e.target.value)} />;
      break;
    case "money":
      control = <>
        <div className="prefix"><span>৳</span><input className="inp mono" inputMode="numeric" {...common} value={v} placeholder="0"
          onChange={(e) => set(fd.id, e.target.value)} onBlur={fmtMoneyOnBlur(fd.id)} /></div>
        <div className="hint">{moneyHint(v)}</div>
      </>;
      break;
    case "textarea": {
      const n = words(v);
      control = <>
        <textarea className={fd.tall ? "tall" : ""} {...common} value={v} placeholder={ph} onChange={(e) => set(fd.id, e.target.value)} />
        {fd.words && <div className={`wc${n > fd.words ? " over" : ""}`}>{bn(n)} / {bn(fd.words)} শব্দ</div>}
      </>;
      break;
    }
    case "select":
      control = <select {...common} value={v} onChange={(e) => set(fd.id, e.target.value)}>
        <option value="">{ph || "নির্বাচন করুন"}</option>
        {(val(fd.options as string[] | ((d: Data) => string[]), d)).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>;
      break;
    case "pills": grouped = true;
      control = <div className="pills" role="radiogroup" aria-labelledby={`l_${fd.id}`}>
        {(val(fd.options as string[], d)).map((o) => (
          <label key={o}><input type="radio" name={fd.id} value={o} checked={v === o} onChange={() => set(fd.id, o)} onBlur={() => blur(fd.id)} /><span>{o}</span></label>
        ))}
      </div>;
      break;
    case "cards": grouped = true;
      control = <div className="cards" role="radiogroup" aria-label={fd.aria || fd.label}>
        {(fd.options as CardOption[]).map((o) => (
          <label key={o.v}><input type="radio" name={fd.id} value={o.v} checked={v === o.v} onChange={() => set(fd.id, o.v)} />
            <span className="card"><span className="ci"><Icon name={o.icon} /></span><b>{o.t}</b><small>{o.d}</small></span></label>
        ))}
      </div>;
      break;
    case "check":
      control = <label className={`check${v ? " on" : ""}`}>
        <input type="checkbox" {...common} checked={!!v} onChange={(e) => set(fd.id, e.target.checked)} />
        <span>{fd.text ? val(fd.text, d) : fd.label}{fd.req && <span className="req" style={{ color: "var(--red)" }}> *</span>}</span>
      </label>;
      break;
    case "money3": grouped = true;
      control = <>
        <div className="trio">
          {([["m", "মাসিক"], ["q", "ত্রৈমাসিক"], ["y", "বার্ষিক"]] as const).map(([s, t]) => {
            const k = `${fd.id}_${s}`;
            return <label key={s}><span className="sub">{t}</span><div className="prefix"><span>৳</span>
              <input className="inp mono" inputMode="numeric" id={`f_${k}`} value={d[k] ?? ""} placeholder="0"
                onChange={(e) => set(k, e.target.value)} onBlur={fmtMoneyOnBlur(k)} /></div></label>;
          })}
        </div>
        <div className="hint">মাসিক পরিমাণ দিলে ত্রৈমাসিক ও বার্ষিক স্বয়ংক্রিয়ভাবে হিসাব হবে — প্রয়োজনে সংশোধন করুন।</div>
      </>;
      break;
    case "count2": grouped = true;
      control = <div className="duo">
        {([["t", "মোট (জন)"], ["w", "তন্মধ্যে নারী (জন)"]] as const).map(([s, t]) => {
          const k = `${fd.id}_${s}`;
          return <label key={s}><span className="sub">{t}</span>
            <input className="inp mono" inputMode="numeric" id={`f_${k}`} value={d[k] ?? ""} placeholder="০"
              onChange={(e) => set(k, e.target.value.replace(/[^0-9০-৯]/g, ""))} onBlur={() => blur(fd.id)} /></label>;
        })}
      </div>;
      break;
    case "note":
      return <div className="fld full"><div className={`note ${fd.tone || "info"}`}><Icon name={fd.tone === "warn" ? "warn" : "info"} /><div>{fd.text ? val(fd.text, d) : ""}</div></div></div>;
  }

  let extra: React.ReactNode = null;
  if (fd.extra && fd.id === "dob" && d.dob) {
    const a = ageOn(d.dob, PROGRAM.ageRefDate);
    const ok = a !== null && a >= PROGRAM.minAge && a <= PROGRAM.maxAge;
    if (a !== null) extra = <span className={`chip-note ${ok ? "ok" : "bad"}`}><Icon name={ok ? "check" : "warn"} />১৫ অক্টোবর ২০২৬ তারিখে বয়স: {bn(a)} বছর</span>;
  }

  return (
    <div className={`fld${fd.full ? " full" : ""}${err ? " invalid" : ""}`} data-f={fd.id}>
      {fd.type !== "check" && <Label fd={fd} htmlFor={grouped ? undefined : id} />}
      {control}
      {fd.hint && <div className="hint">{fd.hint}</div>}
      {extra}
      <div className="err-msg" id={`e_${fd.id}`} role="alert">{err}</div>
    </div>
  );
}

// =====================================================================
function FinSummary({ d }: { d: Data }) {
  const T = num(d.fin_total), O = num(d.fin_own), R = Math.min(num(d.fin_req), PROGRAM.maxFinance);
  const loan = R / 2, grant = R / 2, rest = Math.max(0, T - R), base = Math.max(T, R) || 1;
  const w = (x: number) => `${(x / base) * 100}%`;
  return (
    <div className="fin-summary">
      <div className="fs-l">
        <div className="note info"><Icon name="info" /><div>সমন্বিত অর্থায়নের ঋণ-অনুদান অনুপাত <b>৫০:৫০</b>। কোনো সহায়ক জামানত লাগবে না।</div></div>
        {T - O > PROGRAM.maxFinance && <div className="note warn"><Icon name="warn" /><div>প্রয়োজন ২০ লক্ষ টাকার বেশি। অতিরিক্ত অংশ নিজস্ব বা অন্য বৈধ উৎস থেকে সংস্থান করতে হবে।</div></div>}
        <div style={{ fontSize: ".9rem", color: "var(--ink-2)" }}>
          {d.gender === "নারী" ? <>সুদ/মুনাফার হার (নারী উদ্যোক্তা): <b>সর্বোচ্চ ৫%</b></>
            : <>সুদ/মুনাফার হার: <b>সর্বোচ্চ ৪% – ৭%</b> — স্টার্ট-আপ ৪%, নারী উদ্যোক্তা ৫%, সিএমএসএমই ও কৃষিপণ্য প্রক্রিয়াজাতকরণ ৭%।</>}
        </div>
      </div>
      <div className="fs-r" aria-live="polite">
        <small>আবেদনকৃত অর্থায়ন</small><span className="tot">{taka(R)}</span>
        <div className="split-bar"><i className="loan" style={{ width: w(loan) }} /><i className="grant" style={{ width: w(grant) }} /><i className="own" style={{ width: w(rest) }} /></div>
        <div className="row"><span><i style={{ background: "var(--leaf)" }} />ব্যাংক ঋণ (৫০%)</span><b>{taka(loan)}</b></div>
        <div className="row"><span><i style={{ background: "var(--amber)" }} />অনুদান (৫০%)</span><b>{taka(grant)}</b></div>
        <div className="row"><span><i style={{ background: "rgba(255,255,255,.4)" }} />নিজস্ব/অন্যান্য উৎস</span><b>{taka(rest)}</b></div>
      </div>
    </div>
  );
}

function Budget({ ctx }: { ctx: Ctx }) {
  const { data: d, set } = ctx;
  const t = budgetTotal(d), T = num(d.fin_total), err = ctx.errFor("budget");
  return (
    <div className={`fld full${err ? " invalid" : ""}`} data-f="budget">
      <div className="budget-wrap">
        <table className="budget">
          <thead><tr><th>ক্রম</th><th>ব্যয়ের খাত</th><th>বিবরণ</th><th>মোট (টাকা)</th><th>অর্থের উৎস</th></tr></thead>
          <tbody>
            {BUDGET.map((h, i) => {
              const k = `b${i + 1}`;
              return (
                <tr key={k}>
                  <td>{String(i + 1).padStart(2, "0")}</td><td className="head">{h}</td>
                  <td><input className="inp" value={d[`${k}_d`] ?? ""} aria-label={`${h} — বিবরণ`} onChange={(e) => set(`${k}_d`, e.target.value)} /></td>
                  <td><input className="inp mono" inputMode="numeric" value={d[`${k}_a`] ?? ""} placeholder="0" aria-label={`${h} — টাকা`}
                    onChange={(e) => set(`${k}_a`, e.target.value)} onBlur={() => set(`${k}_a`, enMoney(num(d[`${k}_a`])))} /></td>
                  <td><select value={d[`${k}_s`] ?? ""} aria-label={`${h} — অর্থের উৎস`} onChange={(e) => set(`${k}_s`, e.target.value)}>
                    <option value="">—</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot><tr><td colSpan={3}>সর্বমোট</td><td className="amt" colSpan={2}>{taka(t)}</td></tr></tfoot>
        </table>
      </div>
      {t > 0 && T > 0 && t !== T && (
        <div className="note warn budget-check"><Icon name="warn" /><div>ব্যয় বিভাজনের সর্বমোট ({taka(t)}) প্রয়োজনীয় মোট মূলধনের ({taka(T)}) সাথে মিলছে না — {t > T ? "বেশি" : "কম"} {taka(Math.abs(t - T))}।</div></div>
      )}
      <div className="err-msg" role="alert">{err}</div>
    </div>
  );
}

function Uploads({ ctx }: { ctx: Ctx }) {
  const { data: d, set } = ctx;
  const [drag, setDrag] = useState(false);
  const onPhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => { // downscale to keep the payload small
        const s = Math.min(1, 480 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        set("photo", c.toDataURL("image/jpeg", 0.85));
      };
      img.src = String(r.result);
    };
    r.readAsDataURL(file);
  };
  return (
    <>
      <div className="uploads">
        <div className={`photo-drop${drag ? " drag" : ""}`} onDragEnter={() => setDrag(true)} onDragOver={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDrop={() => setDrag(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {d.photo ? <img src={d.photo} alt="আবেদনকারীর ছবি" /> : <div><Icon name="upload" /><b>পাসপোর্ট সাইজ ছবি</b><small>JPG/PNG · ক্লিক বা ড্র্যাগ করুন</small></div>}
          <input type="file" accept="image/*" aria-label="পাসপোর্ট সাইজ ছবি আপলোড" onChange={(e) => onPhoto(e.target.files?.[0])} />
          {d.photo && <button type="button" className="rm" onClick={() => set("photo", undefined)}>মুছুন</button>}
        </div>
        <div className="doc-ups">
          {DOCS.map((doc) => {
            const has = d[doc.id] as { name: string; size: number } | undefined;
            return (
              <label key={doc.id} className={`doc-up${has ? " has" : ""}`}>
                <span className="di"><Icon name={has ? "check" : "file"} /></span>
                <div><b>{doc.t}</b><small>{has ? `${has.name} · ${bn(Math.max(1, Math.round(has.size / 1024)))} KB` : "ছবি বা PDF নির্বাচন করুন"}</small></div>
                <span className={`tag${doc.req ? " req" : ""}`}>{doc.req ? "আবশ্যক" : "যদি থাকে"}</span>
                <input type="file" accept="image/*,.pdf" aria-label={doc.t} onChange={(e) => { const f = e.target.files?.[0]; if (f) set(doc.id, { name: f.name, size: f.size }); }} />
              </label>
            );
          })}
        </div>
      </div>
      <div className="note info" style={{ marginTop: 14 }}><Icon name="info" /><div>ছবিটি আবেদনের সাথে সংরক্ষিত হবে। অন্যান্য কাগজপত্রের শুধু নাম রেকর্ড করা হয় — প্রিন্ট করা আবেদনপত্রের সাথে সকল সংযুক্তির কপি ব্যাংক শাখায় জমা দিতে হবে।</div></div>
    </>
  );
}

function Signature({ ctx }: { ctx: Ctx }) {
  const { data: d, set } = ctx;
  const cv = useRef<HTMLCanvasElement>(null);
  const err = ctx.errFor("signature");
  const sigRef = useRef(d.signature as string | undefined);

  useEffect(() => {
    const c = cv.current!; const ctx2 = c.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1, r = c.getBoundingClientRect();
    c.width = r.width * dpr; c.height = r.height * dpr;
    ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2.lineWidth = 2.4; ctx2.lineCap = "round"; ctx2.lineJoin = "round"; ctx2.strokeStyle = "#0b1f40";
    if (sigRef.current) { const im = new Image(); im.onload = () => ctx2.drawImage(im, 0, 0, r.width, r.height); im.src = sigRef.current; }

    let drawing = false, last = { x: 0, y: 0 }, dirty = false;
    const pt = (e: PointerEvent) => { const b = c.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    const down = (e: PointerEvent) => { drawing = true; last = pt(e); c.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!drawing) return;
      const p = pt(e); ctx2.beginPath(); ctx2.moveTo(last.x, last.y); ctx2.lineTo(p.x, p.y); ctx2.stroke(); last = p; dirty = true;
    };
    const up = () => { if (!drawing) return; drawing = false; if (dirty) { const u = c.toDataURL("image/png"); sigRef.current = u; set("signature", u); ctx.blur("signature"); } };
    c.addEventListener("pointerdown", down); c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up);
    return () => { c.removeEventListener("pointerdown", down); c.removeEventListener("pointermove", move); c.removeEventListener("pointerup", up); c.removeEventListener("pointercancel", up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clear = () => { const c = cv.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); sigRef.current = undefined; set("signature", undefined); };

  return (
    <div className="fgrid">
      <div className={`fld full${err ? " invalid" : ""}`} data-f="signature" style={{ marginTop: 6 }}>
        <div className="lbl" id="l_signature">আবেদনকারীর স্বাক্ষর<span className="req" aria-hidden="true">*</span></div>
        <div className="sig-wrap"><canvas ref={cv} aria-labelledby="l_signature" /><div className="sig-line" />
          {!d.signature && <div className="sig-ph">এখানে আঙুল বা মাউস দিয়ে স্বাক্ষর করুন</div>}</div>
        <div className="sig-tools"><span className="hint">তারিখ: {bnDate(new Date())}</span><button type="button" className="btn btn-link btn-sm" onClick={clear}>মুছে আবার স্বাক্ষর করুন</button></div>
        <div className="err-msg" role="alert">{err}</div>
      </div>
    </div>
  );
}

function Review({ d: raw, go, summaries }: { d: Data; go: (i: number) => void; summaries: Summaries }) {
  const d = effective(raw);
  return (
    <>
      {STEPS.slice(0, REVIEW).map((s, i) => {
        const errs = summaries[i]?.errs.length || 0;
        const rows: React.ReactNode[] = [];
        s.sections.forEach((sec, si) => {
          if (!shown(sec, d)) return;
          sec.fields?.forEach((fd) => {
            if (!shown(fd, d) || fd.type === "note") return;
            const v = display(fd, d), miss = fd.req && isBlank(v);
            rows.push(<div className="k" key={fd.id + "k"}>{fd.no ? fd.no + ". " : ""}{fd.label || (fd.text ? val(fd.text, d) : fd.aria)}</div>,
              <div className={`v${miss ? " miss" : isBlank(v) ? " empty" : ""}`} key={fd.id + "v"}>{miss ? "পূরণ করা হয়নি" : isBlank(v) ? "—" : v}</div>);
          });
          if (sec.custom === "budget") {
            BUDGET.forEach((h, j) => {
              const k = `b${j + 1}`, a = num(d[`${k}_a`]);
              if (a) rows.push(<div className="k" key={k + "k"}>{h}</div>,
                <div className="v" key={k + "v"}>{taka(a)}{d[`${k}_d`] ? ` — ${d[`${k}_d`]}` : ""}{d[`${k}_s`] ? ` (${d[`${k}_s`]})` : ""}</div>);
            });
            rows.push(<div className="k" key={si + "bt"}><b>সর্বমোট ব্যয়</b></div>, <div className="v" key={si + "btv"}><b>{taka(budgetTotal(d))}</b></div>);
          }
          if (sec.custom === "uploads") DOCS.forEach((doc) => rows.push(
            <div className="k" key={doc.id + "k"}>{doc.t}</div>,
            <div className={`v${d[doc.id] ? "" : " empty"}`} key={doc.id + "v"}>{d[doc.id]?.name || "—"}</div>));
          if (sec.custom === "signature") rows.push(
            <div className="k" key="sigk">স্বাক্ষর</div>,
            // eslint-disable-next-line @next/next/no-img-element
            <div className={`v${d.signature ? "" : " miss"}`} key="sigv">{d.signature ? <img src={d.signature} alt="স্বাক্ষর" style={{ height: 54, background: "#fff" }} /> : "প্রদান করা হয়নি"}</div>);
        });
        return (
          <div className="rv-sec" key={s.key}>
            <div className="rv-head">
              <h3>{val(s.part, d)} · {val(s.short, d)}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {errs > 0 && <span className="bad">{bn(errs)}টি ত্রুটি</span>}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => go(i)}><Icon name="edit" />সম্পাদনা</button>
              </div>
            </div>
            {s.key === "personal" && (
              <div className="rv-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {d.photo ? <img src={d.photo} alt="ছবি" /> : <div className="ph">ছবি যুক্ত করা হয়নি</div>}
                <div><b style={{ fontSize: "1.1rem" }}>{d.name_bn}</b><br /><span className="en" style={{ color: "var(--ink-3)" }}>{d.name_en}</span></div>
              </div>
            )}
            <div className="rv-list">{rows}</div>
          </div>
        );
      })}
    </>
  );
}

// =====================================================================
function Success({ done, onNew, flash }: { done: { id: string; at: string; d: Data }; onNew: () => void; flash: (m: string) => void }) {
  return (
    <main className="success container">
      <div className="success-card">
        <div className="burst" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div>
        <div className="success-ico"><Icon name="check" /></div>
        <h1>আবেদন সফলভাবে জমা হয়েছে!</h1>
        <p>আপনার আবেদন কর্মসূচির ডাটাবেজে সংরক্ষিত হয়েছে। ট্র্যাকিং নম্বরটি সংরক্ষণ করুন এবং পূর্ণাঙ্গ আবেদনপত্র প্রিন্ট করে প্রয়োজনীয় সংযুক্তিসহ আপনার উপজেলার যেকোনো তফসিলি ব্যাংক শাখায় জমা দিন।</p>
        <div className="track-id">
          <small>ট্র্যাকিং নম্বর</small>
          <b className="en">{done.id}</b>
          <button className="btn btn-ghost btn-sm" type="button" onClick={async () => {
            try { await navigator.clipboard.writeText(done.id); flash("ট্র্যাকিং নম্বর কপি হয়েছে"); } catch { flash(done.id); }
          }}><Icon name="copy" />কপি</button>
        </div>
        <div className="success-actions">
          <button className="btn btn-primary" type="button" onClick={() => window.print()}><Icon name="print" />আবেদনপত্র প্রিন্ট / PDF</button>
          <Link className="btn btn-ghost" href={`/?track=${encodeURIComponent(done.id)}`}>আবেদনের অবস্থা দেখুন</Link>
          <button className="btn btn-link" type="button" onClick={onNew}>নতুন আবেদন</button>
        </div>
        <ul className="next-steps">
          <li><b>১</b>আবেদনপত্র প্রিন্ট করুন এবং নির্ধারিত স্থানে স্বাক্ষর করুন</li>
          <li><b>২</b>পাসপোর্ট সাইজ ছবি (২ কপি), এনআইডি ও নাগরিক সনদের কপি সংযুক্ত করুন</li>
          <li><b>৩</b>১৫ অক্টোবর ২০২৬ এর মধ্যে ব্যাংক শাখায় জমা দিন</li>
        </ul>
      </div>
    </main>
  );
}
