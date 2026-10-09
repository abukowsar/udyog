"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";

const LINKS = [
  ["#about", "কর্মসূচি"], ["#finance", "অর্থায়ন"], ["#eligibility", "যোগ্যতা"],
  ["#coverage", "এলাকা"], ["#process", "প্রক্রিয়া"], ["#faq", "প্রশ্নোত্তর"]
];

export const openTrack = () => window.dispatchEvent(new Event("udyog:track"));

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`} id="top">
      <div className="container nav">
        <a href="#top" className="brand" aria-label="উদ্যোগ — হোম">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/udyog-logo.png" alt="UDYOG — Upazila-Driven Youth Opportunity for Growth" width={588} height={171} />
        </a>
        <ul className={`nav-links${open ? " open" : ""}`}>
          {LINKS.map(([h, t]) => (
            <li key={h}><a href={h} onClick={() => setOpen(false)}>{t}</a></li>
          ))}
        </ul>
        <div className="nav-actions">
          <button className="btn btn-ghost btn-sm" type="button" onClick={openTrack}><Icon name="search" />আবেদন ট্র্যাক</button>
          <Link className="btn btn-primary btn-sm" href="/apply">আবেদন করুন</Link>
          <button className="menu-toggle" type="button" aria-label="মেনু" aria-expanded={open} onClick={() => setOpen((o) => !o)}><Icon name="menu" /></button>
        </div>
      </div>
    </header>
  );
}

export function TrackButton({ className, children }: { className: string; children: React.ReactNode }) {
  return <button type="button" className={className} onClick={openTrack}>{children}</button>;
}
