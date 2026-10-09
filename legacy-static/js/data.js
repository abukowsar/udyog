/* Shared data + helpers for the UDYOG web app */
(function (global) {
  "use strict";

  // Programme constants (from SMESPD Circular No. 05, 13 Sep 2026)
  const PROGRAM = {
    deadline: new Date(2026, 9, 15, 23, 59, 59), // 15 Oct 2026
    ageRefDate: new Date(2026, 9, 15),
    maxAge: 28,
    minAge: 18,
    maxFinance: 2000000, // ৳20 lakh blended financing
    loanShare: 0.5,
    rates: { startup: 4, women: 5, cmsme: 7 }
  };

  // Phase-1 coverage: 8 districts, one per division, 64 upazilas
  const DISTRICTS = [
    { id: "manikganj", bn: "মানিকগঞ্জ", en: "Manikganj", division: "ঢাকা", color: "#e9f6ec",
      upazilas: ["মানিকগঞ্জ সদর", "সিংগাইর", "সাটুরিয়া", "হরিরামপুর", "ঘিওর", "দৌলতপুর", "শিবালয়"] },
    { id: "feni", bn: "ফেনী", en: "Feni", division: "চট্টগ্রাম", color: "#fff5e2",
      upazilas: ["ফেনী সদর", "ছাগলনাইয়া", "দাগনভূঞা", "পরশুরাম", "ফুলগাজী", "সোনাগাজী"] },
    { id: "naogaon", bn: "নওগাঁ", en: "Naogaon", division: "রাজশাহী", color: "#e8f4fc",
      upazilas: ["নওগাঁ সদর", "আত্রাই", "বদলগাছী", "ধামইরহাট", "মান্দা", "মহাদেবপুর", "নিয়ামতপুর", "পত্নীতলা", "পোরশা", "রাণীনগর", "সাপাহার"] },
    { id: "jhenaidah", bn: "ঝিনাইদহ", en: "Jhenaidah", division: "খুলনা", color: "#fdecec",
      upazilas: ["ঝিনাইদহ সদর", "শৈলকুপা", "হরিণাকুণ্ডু", "কালীগঞ্জ", "কোটচাঁদপুর", "মহেশপুর"] },
    { id: "bhola", bn: "ভোলা", en: "Bhola", division: "বরিশাল", color: "#e8f4fc",
      upazilas: ["ভোলা সদর", "বোরহানউদ্দিন", "চরফ্যাশন", "দৌলতখান", "লালমোহন", "মনপুরা", "তজুমদ্দিন"] },
    { id: "habiganj", bn: "হবিগঞ্জ", en: "Habiganj", division: "সিলেট", color: "#e9f6ec",
      upazilas: ["হবিগঞ্জ সদর", "আজমিরীগঞ্জ", "বাহুবল", "বানিয়াচং", "চুনারুঘাট", "লাখাই", "মাধবপুর", "নবীগঞ্জ", "শায়েস্তাগঞ্জ"] },
    { id: "rangpur", bn: "রংপুর", en: "Rangpur", division: "রংপুর", color: "#fff5e2",
      upazilas: ["রংপুর সদর", "বদরগঞ্জ", "গংগাচড়া", "কাউনিয়া", "মিঠাপুকুর", "পীরগাছা", "পীরগঞ্জ", "তারাগঞ্জ"] },
    { id: "netrokona", bn: "নেত্রকোণা", en: "Netrokona", division: "ময়মনসিংহ", color: "#fdecec",
      upazilas: ["নেত্রকোণা সদর", "আটপাড়া", "বারহাট্টা", "দুর্গাপুর", "কলমাকান্দা", "কেন্দুয়া", "খালিয়াজুরী", "মদন", "মোহনগঞ্জ", "পূর্বধলা"] }
  ];

  const DIVISIONS = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ"];

  // ---------- helpers ----------
  const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
  const bn = (v) => String(v).replace(/[0-9]/g, (d) => BN_DIGITS[d]);
  const toEnDigits = (v) => String(v ?? "").replace(/[০-৯]/g, (d) => BN_DIGITS.indexOf(d));
  const num = (v) => {
    const n = parseFloat(toEnDigits(v).replace(/[^0-9.]/g, ""));
    return isFinite(n) ? n : 0;
  };
  // South-Asian grouping (12,34,567) in Bengali digits
  const fmtMoney = (n) => {
    n = Math.round(Number(n) || 0);
    try { return new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 }).format(n); }
    catch (e) { return bn(n.toLocaleString("en-IN")); }
  };
  const taka = (n) => "৳ " + fmtMoney(n);
  const lakh = (n) => {
    const l = (Number(n) || 0) / 100000;
    return bn(l % 1 === 0 ? l : l.toFixed(2).replace(/0$/, "")) + " লক্ষ";
  };

  const ageOn = (dob, ref) => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d)) return null;
    let a = ref.getFullYear() - d.getFullYear();
    const m = ref.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) a--;
    return a;
  };

  const store = {
    get(k, fb) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  const toast = (msg, ms = 2600) => {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), ms);
  };

  global.UDYOG = { PROGRAM, DISTRICTS, DIVISIONS, bn, toEnDigits, num, fmtMoney, taka, lakh, ageOn, store, toast,
    SUBMISSIONS_KEY: "udyog-submissions", DRAFT_KEY: "udyog-draft" };
})(window);
