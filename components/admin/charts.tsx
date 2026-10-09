"use client";
/**
 * Small, dependency-free chart kit for the admin dashboard.
 * Specs: thin marks (bars <= 20px, 4px rounded data-end), 2px lines, 10% area wash,
 * hairline solid grid, 2px surface gaps between segments, hover tooltip on every mark,
 * text in ink tokens (never series colour). Palette validated (categorical, all-pairs, light).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { bn } from "@/lib/format";
import { Icon } from "../Icon";

export const SERIES = ["var(--series-1)", "var(--series-2)", "var(--series-3)"];

/* ---------- tooltip ---------- */
interface Tip { x: number; y: number; title: string; lines: [string, string][] }
function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const node = tip ? (
    <div className="viz-tip" style={{ left: tip.x, top: tip.y }} role="status">
      <b>{tip.title}</b>
      {tip.lines.map(([k, v]) => <div key={k}><span>{k}</span><strong>{v}</strong></div>)}
    </div>
  ) : null;
  return { setTip, node };
}
const rel = (e: React.MouseEvent, el: HTMLElement | null) => {
  const r = el?.getBoundingClientRect();
  return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
};

/* ---------- stat tile ---------- */
export function StatTile({ label, value, sub, icon, tone = "navy" }: { label: string; value: string; sub?: React.ReactNode; icon: string; tone?: "navy" | "green" | "amber" | "red" }) {
  return (
    <div className="kpi">
      <div className={`kpi-ico t-${tone}`}><Icon name={icon} /></div>
      <div className="kpi-body">
        <span className="kpi-l">{label}</span>
        <b className="kpi-v">{value}</b>
        {sub && <span className="kpi-s">{sub}</span>}
      </div>
    </div>
  );
}

/* ---------- horizontal bar list (single series) ---------- */
export function BarList({ rows, fmt = (n) => bn(n), detail, empty = "এখনো কোনো তথ্য নেই" }: {
  rows: { key: string; label: string; value: number; extra?: [string, string][] }[];
  fmt?: (n: number) => string; detail?: string; empty?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { setTip, node } = useTip();
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length || rows.every((r) => !r.value)) return <div className="viz-empty">{empty}</div>;
  return (
    <div className="barlist" ref={ref} onMouseLeave={() => setTip(null)}>
      {rows.map((r) => {
        const w = (r.value / max) * 100;
        return (
          <div className="bl-row" key={r.key}
            onMouseMove={(e) => { const p = rel(e, ref.current); setTip({ ...p, title: r.label, lines: [[detail || "সংখ্যা", fmt(r.value)], ...(r.extra || [])] }); }}>
            <span className="bl-label">{r.label}</span>
            <span className="bl-track">
              <i className="bl-bar" style={{ width: r.value ? `max(${w}%, 4px)` : 0 }} />
              <span className="bl-val" style={{ left: `calc(${w}% + 8px)` }}>{fmt(r.value)}</span>
            </span>
          </div>
        );
      })}
      {node}
    </div>
  );
}

/* ---------- trend line (single series, crosshair) ---------- */
export function TrendChart({ points, height = 220 }: { points: { date: string; n: number }[]; height?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { l: 36, r: 16, t: 14, b: 26 };
  const iw = w - pad.l - pad.r, ih = height - pad.t - pad.b;
  const maxV = Math.max(...points.map((p) => p.n), 0);
  // clean integer ticks: step from {1,2,5}×10^k, at least 4 intervals
  const raw = Math.max(1, maxV / 4), pow = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
  const top = maxV ? step * Math.ceil(maxV / step) : 4;
  const ticks = Array.from({ length: Math.floor(top / step) + 1 }, (_, i) => i * step);
  const x = (i: number) => pad.l + (points.length <= 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / top) * ih;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.n).toFixed(1)}`).join("");
  const area = points.length ? `${line}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z` : "";
  const fmtD = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
  const labelEvery = Math.ceil(points.length / Math.max(2, Math.floor(iw / 70)));
  const last = points.length - 1;

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const r = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * last);
    setHover(Math.max(0, Math.min(last, i)));
  };
  const total = points.reduce((s, p) => s + p.n, 0);

  return (
    <div className="trend" ref={wrap}>
      <svg width={w} height={height} role="img" aria-label={`গত ${bn(points.length)} দিনে মোট ${bn(total)}টি আবেদন`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} className={t === 0 ? "viz-base" : "viz-grid"} />
            <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="viz-tick">{bn(t)}</text>
          </g>
        ))}
        {points.map((p, i) => (i % labelEvery === 0 || i === last) && (i === last || last - i >= labelEvery * 0.6) ? (
          <text key={p.date} x={x(i)} y={height - 6} textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"} className="viz-tick">{fmtD(p.date)}</text>
        ) : null)}
        <path d={area} className="viz-area" />
        <path d={line} className="viz-line" />
        {last >= 0 && <circle cx={x(last)} cy={y(points[last].n)} r={4} className="viz-dot" />}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={y(0)} className="viz-cross" />
            <circle cx={x(hover)} cy={y(points[hover].n)} r={5} className="viz-dot" />
          </g>
        )}
        <rect x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <div className="viz-tip" style={{ left: Math.min(x(hover) + 12, w - 150), top: y(points[hover].n) - 10 }}>
          <b>{new Date(points[hover].date + "T00:00:00").toLocaleDateString("bn-BD", { weekday: "short", day: "numeric", month: "long" })}</b>
          <div><span>আবেদন</span><strong>{bn(points[hover].n)}</strong></div>
        </div>
      )}
    </div>
  );
}

/* ---------- 100% split bar (<= 3 categories) + legend ---------- */
export function SplitBar({ parts }: { parts: { label: string; value: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { setTip, node } = useTip();
  const total = parts.reduce((s, p) => s + p.value, 0);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const shown = useMemo(() => parts.map((p, i) => ({ ...p, color: SERIES[i % SERIES.length] })), [parts]);
  return (
    <div className="split" ref={ref} onMouseLeave={() => setTip(null)}>
      <div className="split-track">
        {total ? shown.filter((p) => p.value).map((p) => (
          <i key={p.label} style={{ flexGrow: p.value, background: p.color }}
            onMouseMove={(e) => setTip({ ...rel(e, ref.current), title: p.label, lines: [["সংখ্যা", bn(p.value)], ["অংশ", bn(pct(p.value)) + "%"]] })} />
        )) : <i style={{ flexGrow: 1, background: "var(--line-2)" }} />}
      </div>
      <ul className="split-legend">
        {shown.map((p) => (
          <li key={p.label}><span className="sw" style={{ background: p.color }} />{p.label}<b>{bn(p.value)}</b><small>{bn(pct(p.value))}%</small></li>
        ))}
      </ul>
      {node}
    </div>
  );
}

/* ---------- meter (progress against a target) ---------- */
export function Meter({ value, max, label }: { value: number; max: number; label?: string }) {
  const p = Math.min(100, max ? (value / max) * 100 : 0);
  return (
    <div className="meter" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <i style={{ width: `${p}%` }} />
    </div>
  );
}
