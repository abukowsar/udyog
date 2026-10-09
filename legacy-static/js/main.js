/* Landing page interactions */
(function () {
  "use strict";
  const { PROGRAM, DISTRICTS, bn, num, taka, store, SUBMISSIONS_KEY } = window.UDYOG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- header + menu ----------
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = $("#navLinks"), menuBtn = $("#menuToggle");
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  $$("a", navLinks).forEach((a) => a.addEventListener("click", () => { navLinks.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }));

  // ---------- reveal + count-up ----------
  const countUp = (el) => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || "";
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = bn(Math.round(target * e).toLocaleString("en-IN")) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        $$("[data-count]", en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
    $$("[data-count]").forEach(countUp);
  }

  // ---------- countdown ----------
  const cd = $("#countdown");
  const pad = (n) => bn(String(n).padStart(2, "0"));
  const tickCd = () => {
    let ms = PROGRAM.deadline - new Date();
    if (ms <= 0) {
      cd.querySelector(".cd-units").innerHTML = '<div class="cd-unit" style="padding:8px 14px"><b style="font-size:1rem">আবেদনের সময় শেষ</b></div>';
      return clearInterval(cdTimer);
    }
    const d = Math.floor(ms / 864e5); ms %= 864e5;
    const h = Math.floor(ms / 36e5); ms %= 36e5;
    const m = Math.floor(ms / 6e4); const s = Math.floor((ms % 6e4) / 1000);
    cd.querySelector('[data-cd="d"]').textContent = bn(d);
    cd.querySelector('[data-cd="h"]').textContent = pad(h);
    cd.querySelector('[data-cd="m"]').textContent = pad(m);
    cd.querySelector('[data-cd="s"]').textContent = pad(s);
  };
  const cdTimer = setInterval(tickCd, 1000);
  tickCd();

  // ---------- financing calculator ----------
  const need = $("#calcNeed"), range = $("#calcRange"), own = $("#calcOwn");
  let rate = 4;
  const fmtInput = (el) => { const v = num(el.value); el.value = v ? v.toLocaleString("en-IN") : (el === own ? "0" : ""); };
  const calc = () => {
    const N = num(need.value), O = Math.min(num(own.value), N);
    const requested = Math.max(0, N - O);
    const fin = Math.min(requested, PROGRAM.maxFinance);
    const loan = fin * PROGRAM.loanShare, grant = fin - loan, rest = N - fin;
    $("#calcTotal").textContent = taka(fin);
    $("#calcLoan").textContent = taka(loan);
    $("#calcGrant").textContent = taka(grant);
    $("#calcOwnOut").textContent = taka(rest);
    $("#calcRate").textContent = bn(rate) + "%";
    const pct = (v) => (N ? (v / N) * 100 : 0) + "%";
    $("#barLoan").style.width = pct(loan);
    $("#barGrant").style.width = pct(grant);
    $("#barOwn").style.width = pct(rest);
    $("#calcWarn").classList.toggle("show", requested > PROGRAM.maxFinance);
  };
  need.addEventListener("input", () => { range.value = num(need.value); calc(); });
  need.addEventListener("blur", () => fmtInput(need));
  own.addEventListener("input", calc);
  own.addEventListener("blur", () => fmtInput(own));
  range.addEventListener("input", () => { need.value = (+range.value).toLocaleString("en-IN"); calc(); });
  $$("#calcCat button").forEach((b) => b.addEventListener("click", () => {
    $$("#calcCat button").forEach((x) => { x.classList.remove("on"); x.setAttribute("aria-checked", "false"); });
    b.classList.add("on"); b.setAttribute("aria-checked", "true");
    rate = +b.dataset.rate; calc();
  }));
  fmtInput(need); calc();

  // ---------- eligibility quiz ----------
  const Q = [
    { q: "১৫ অক্টোবর ২০২৬ তারিখে আপনার বয়স কি ২৮ বছর বা তার কম (এবং আপনি প্রাপ্তবয়স্ক)?", pass: "yes", fail: "আবেদনের শেষ তারিখে বয়স সর্বোচ্চ ২৮ বছর হতে হবে।" },
    { q: "আপনি কি কর্মসূচিভুক্ত ৬৪টি উপজেলার কোনো একটির স্থায়ী বাসিন্দা?", pass: "yes", fail: "প্রথম ধাপে কেবল ৮টি জেলার ৬৪টি উপজেলার স্থায়ী বাসিন্দারা আবেদন করতে পারবেন।" },
    { q: "আপনার কি একটি বাস্তবসম্মত ব্যবসায়িক ধারণা বা চলমান ব্যবসা আছে?", pass: "yes", fail: "আবেদনের জন্য নিজস্ব উদ্যোগ বা বাস্তবসম্মত ব্যবসায়িক পরিকল্পনা থাকতে হবে।" },
    { q: "আপনি কি আগে ব্যবসার জন্য কোনো ব্যাংক বা আর্থিক প্রতিষ্ঠান থেকে ঋণ নিয়েছেন?", pass: "no", fail: "ইতোপূর্বে ব্যবসার জন্য ঋণ গ্রহণকারী এ কর্মসূচির আওতায় বিবেচিত হবেন না।" },
    { q: "আপনি কি কোনো ব্যাংক বা আর্থিক প্রতিষ্ঠানে ঋণখেলাপি হিসেবে চিহ্নিত?", pass: "no", fail: "ঋণখেলাপি ব্যক্তি আবেদনের যোগ্য নন।" },
    { q: "আপনি কি সরকারি, আধা-সরকারি বা স্বায়ত্তশাসিত প্রতিষ্ঠানে কর্মরত?", pass: "no", fail: "সরকারি, আধা-সরকারি বা স্বায়ত্তশাসিত প্রতিষ্ঠানে কর্মরত ব্যক্তি অর্থায়নের যোগ্য নন।" }
  ];
  const quizBody = $("#quizBody"), quizBar = $("#quizBar"), quizStep = $("#quizStep");
  let qi = 0, fails = [];
  const renderQ = () => {
    quizBar.style.width = (qi / Q.length) * 100 + "%";
    if (qi >= Q.length) return renderResult();
    quizStep.textContent = bn(qi + 1) + " / " + bn(Q.length);
    quizBody.innerHTML = `<div class="quiz-q">${Q[qi].q}</div>
      <div class="quiz-opts"><button type="button" data-a="yes">হ্যাঁ</button><button type="button" data-a="no">না</button></div>`;
    $$("button", quizBody).forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.a !== Q[qi].pass) fails.push(Q[qi].fail);
      qi++; renderQ();
    }));
  };
  const renderResult = () => {
    quizStep.textContent = "";
    const ok = fails.length === 0;
    quizBody.innerHTML = `<div class="quiz-result ${ok ? "ok" : "bad"}">
      <div class="ri"><svg><use href="#i-${ok ? "check" : "x"}"/></svg></div>
      <h3>${ok ? "অভিনন্দন! আপনি আবেদনের যোগ্য বলে মনে হচ্ছে" : "দুঃখিত, আপনি সম্ভবত যোগ্য নন"}</h3>
      ${ok ? '<p style="color:var(--ink-2)">চূড়ান্ত যোগ্যতা ব্যাংক কর্তৃক যাচাই (KYC, সিআইবি) সাপেক্ষে নির্ধারিত হবে।</p>'
           : "<ul>" + fails.map((f) => `<li>${f}</li>`).join("") + "</ul>"}
      <div class="btns">${ok ? '<a class="btn btn-primary" href="apply.html">এখনই আবেদন করুন</a>' : ""}
        <button class="btn btn-ghost" type="button" id="quizReset">আবার যাচাই করুন</button></div></div>`;
    $("#quizReset").addEventListener("click", () => { qi = 0; fails = []; renderQ(); });
  };
  renderQ();

  // ---------- districts ----------
  const grid = $("#distGrid"), panel = $("#upzPanel");
  grid.innerHTML = DISTRICTS.map((d) => `<button type="button" class="dist" style="--c:${d.color}" data-id="${d.id}" aria-expanded="false">
      <small>${d.division} বিভাগ</small><h3>${d.bn}</h3>
      <span class="n"><b>${bn(d.upazilas.length)}</b> উপজেলা</span></button>`).join("");
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".dist"); if (!btn) return;
    const wasActive = btn.classList.contains("active");
    $$(".dist", grid).forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-expanded", "false"); });
    if (wasActive) { panel.classList.remove("show"); return; }
    btn.classList.add("active"); btn.setAttribute("aria-expanded", "true");
    const d = DISTRICTS.find((x) => x.id === btn.dataset.id);
    panel.innerHTML = `<h4>${d.bn} জেলার উপজেলাসমূহ <span class="en" style="color:var(--ink-3);font-weight:500">· ${d.en}</span></h4>
      <div class="upz-list">${d.upazilas.map((u) => `<span>${u}</span>`).join("")}</div>
      <p style="margin:14px 0 0;color:var(--ink-2);font-size:.92rem">প্রতিটি উপজেলা থেকে ১০ জন — এই জেলা থেকে মোট ${bn(d.upazilas.length * 10)} জন উদ্যোক্তা নির্বাচিত হবেন।</p>`;
    panel.classList.add("show");
  });

  // ---------- modal + tracking ----------
  const openModal = (id) => { const m = $("#" + id); m.classList.add("open"); setTimeout(() => $("input", m)?.focus(), 50); };
  const closeModal = (m) => m.classList.remove("open");
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.open)));
  $$(".modal").forEach((m) => {
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) closeModal(m); });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".modal.open").forEach(closeModal); });

  const fmtDate = (iso) => { try { return new Date(iso).toLocaleString("bn-BD", { dateStyle: "long", timeStyle: "short" }); } catch (e) { return iso; } };
  const track = (id) => {
    id = id.trim().toUpperCase();
    const res = $("#trackResult");
    if (!id) { res.innerHTML = ""; return; }
    const sub = store.get(SUBMISSIONS_KEY, []).find((s) => s.id === id);
    if (!sub) {
      res.innerHTML = `<div class="empty-note">এই নম্বরে কোনো আবেদন এই ডিভাইসে পাওয়া যায়নি। অনুগ্রহ করে নম্বরটি পুনরায় যাচাই করুন অথবা সংশ্লিষ্ট ব্যাংক শাখায় যোগাযোগ করুন।</div>`;
      return;
    }
    res.innerHTML = `<div style="padding:14px 16px;border-radius:14px;background:var(--bg);margin-top:4px">
        <b>${sub.nameBn || sub.nameEn || "আবেদনকারী"}</b><br>
        <small style="color:var(--ink-3)">${sub.upazila || ""}${sub.district ? ", " + sub.district : ""} · <span class="en">${sub.id}</span></small></div>
      <ul class="timeline">
        <li class="done"><i></i><b>অনলাইন ফরম পূরণ সম্পন্ন</b><small>${fmtDate(sub.submittedAt)}</small></li>
        <li class="now"><i></i><b>ব্যাংক শাখায় জমা ও যাচাই</b><small>প্রিন্ট করা আবেদনপত্র সংযুক্তিসহ শাখায় জমা দিন</small></li>
        <li><i></i><b>উপজেলা ও জেলা লীড ব্যাংকে প্রেরণ</b><small>শেষ তারিখের পরবর্তী কার্যদিবসে</small></li>
        <li><i></i><b>বাছাই কমিটির মূল্যায়ন</b><small>ব্যবসায়িক ধারণা, বাজার, আর্থিক পরিকল্পনা ও সক্ষমতা</small></li>
        <li><i></i><b>ঋণ অনুমোদন ও বিতরণ</b><small>মনোনয়নের পর ১৫ কার্যদিবসের মধ্যে</small></li>
      </ul>`;
  };
  $("#trackForm").addEventListener("submit", (e) => { e.preventDefault(); track($("#trackInput").value); });

  const qp = new URLSearchParams(location.search).get("track");
  if (qp) { $("#trackInput").value = qp; openModal("trackModal"); track(qp); }
})();
