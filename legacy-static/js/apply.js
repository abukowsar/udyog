/* UDYOG — schema-driven online application form (mirrors the official 7-page paper form) */
(function () {
  "use strict";
  const U = window.UDYOG;
  const { PROGRAM, DISTRICTS, DIVISIONS, bn, num, taka, lakh, ageOn, store, toast } = U;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const val = (x, d) => (typeof x === "function" ? x(d) : x);
  const empty = (v) => v === undefined || v === null || v === false || String(v).trim() === "";
  const words = (s) => (String(s || "").trim().match(/\S+/g) || []).length;
  const icon = (n) => `<svg><use href="#i-${n}"/></svg>`;
  const enMoney = (n) => (n ? Math.round(n).toLocaleString("en-IN") : "");
  const bnDate = (v) => {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d) ? v : d.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" });
  };
  const todayISO = () => new Date().toISOString().slice(0, 10);

  // ---------- validators ----------
  const digits = (v) => U.toEnDigits(v).replace(/[\s-]/g, "");
  const vNid = (v) => (/^(\d{10}|\d{13}|\d{17})$/.test(digits(v)) ? "" : "সঠিক এনআইডি নম্বর দিন (১০, ১৩ বা ১৭ অঙ্ক)");
  const vPhone = (v) => (/^(\+?88)?01[3-9]\d{8}$/.test(digits(v)) ? "" : "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");
  const vEmail = (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "সঠিক ই-মেইল ঠিকানা দিন");
  const vAge = (v) => {
    const a = ageOn(v, PROGRAM.ageRefDate);
    if (a === null) return "সঠিক তারিখ দিন";
    if (a < PROGRAM.minAge) return "আবেদনকারীকে প্রাপ্তবয়স্ক (১৮+) হতে হবে";
    if (a > PROGRAM.maxAge) return "আবেদনের শেষ তারিখে বয়স সর্বোচ্চ ২৮ বছর হতে হবে";
    return "";
  };

  // ---------- option lists ----------
  const YESNO = ["হ্যাঁ", "না"];
  const BIZ_TYPES = ["উৎপাদন", "সেবা", "ব্যবসা"];
  const SOURCES = ["ব্যাংক ঋণ", "অনুদান", "নিজস্ব বিনিয়োগ", "অন্যান্য"];
  const BUDGET = ["যন্ত্রপাতি ও সরঞ্জাম ক্রয়", "কাঁচামাল ও উপকরণ", "পরিচলন ব্যয়", "প্রোটোটাইপ/নমুনা উন্নয়ন",
    "প্যাকেজিং, লেবেল ও ব্র্যান্ডিং", "ব্যবসা নিবন্ধন, লাইসেন্স ও ছাড়পত্র", "বিপণন ও প্রচার", "কর্মীর মজুরি",
    "পরিবহন ও সরবরাহ", "প্রযুক্তি, সফটওয়্যার ও ইন্টারনেট", "প্রশিক্ষণ ও দক্ষতা উন্নয়ন", "অন্যান্য (উল্লেখ করুন)"];
  const DOCS = [
    { id: "doc_nid", t: "জাতীয় পরিচয়পত্র / জন্মনিবন্ধন সনদ", req: true },
    { id: "doc_edu", t: "সর্বশেষ শিক্ষাগত যোগ্যতার সনদ", req: false },
    { id: "doc_training", t: "দক্ষতা/উদ্যোক্তা উন্নয়ন প্রশিক্ষণ সনদ", req: false },
    { id: "doc_citizen", t: "ওয়ার্ড কমিশনার/কাউন্সিলর প্রদত্ত নাগরিক সনদ", req: true }
  ];

  const isNew = (d) => d.biz_status === "new";
  const isExisting = (d) => d.biz_status === "existing";
  const yes = (k) => (d) => d[k] === "হ্যাঁ";
  const f = (id, label, type, o = {}) => ({ id, label, type, ...o });

  const addr = (p, when) => [
    f(p + "_house", "বাড়ি/মহল্লার নং ও নাম", "text", { req: true, when }),
    f(p + "_road", "রোড নং/এলাকা/গ্রামের নাম", "text", { req: true, when }),
    f(p + "_post", "ডাকঘর ও পোস্ট কোড", "text", { req: true, when }),
    f(p + "_thana", "থানা/উপজেলা", "text", { req: true, when }),
    f(p + "_district", "জেলা", "text", { req: true, when }),
    f(p + "_division", "বিভাগ", "select", { req: true, when, options: DIVISIONS })
  ];

  // =====================================================================
  //  FORM SCHEMA
  // =====================================================================
  const STEPS = [
    {
      key: "start", short: "শুরু", en: "Get started", part: "প্রারম্ভিক তথ্য",
      title: "আবেদন শুরু করুন",
      desc: "আপনার উপজেলা ও উদ্যোগের অবস্থা নির্বাচন করুন — সে অনুযায়ী ফরমের প্রযোজ্য অংশ দেখানো হবে।",
      sections: [
        { html: () => (new Date() > PROGRAM.deadline
            ? `<div class="note danger">${icon("warn")}<div>আবেদনের নির্ধারিত শেষ তারিখ (১৫ অক্টোবর ২০২৬) অতিক্রান্ত হয়েছে। নতুন সময়সূচির জন্য সংশ্লিষ্ট ব্যাংক শাখায় যোগাযোগ করুন।</div></div>`
            : `<div class="note info">${icon("info")}<div>ফরমটি ৮টি সহজ ধাপে বিভক্ত এবং আপনার তথ্য এই ডিভাইসে স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়। <b>*</b> চিহ্নিত ঘরগুলো আবশ্যক।</div></div>`) },
        {
          title: "কর্মসূচি এলাকা", desc: "যে উপজেলার স্থায়ী বাসিন্দা হিসেবে আবেদন করছেন",
          fields: [
            f("prog_district", "জেলা", "select", { req: true, options: () => DISTRICTS.map((d) => d.bn) }),
            f("prog_upazila", "উপজেলা", "select", { req: true,
              options: (d) => (DISTRICTS.find((x) => x.bn === d.prog_district) || {}).upazilas || [],
              placeholder: (d) => (d.prog_district ? "উপজেলা নির্বাচন করুন" : "আগে জেলা নির্বাচন করুন") }),
            f("bank_branch", "আবেদন জমা দেওয়ার ব্যাংক ও শাখা", "text", { full: true,
              placeholder: "যেমন: সোনালী ব্যাংক পিএলসি, সিংগাইর শাখা",
              hint: "ঐচ্ছিক — উপজেলায় অবস্থিত যেকোনো তফসিলি ব্যাংকের শাখা। সেখানে পূর্ব থেকে হিসাব থাকা আবশ্যক নয়।" })
          ]
        },
        {
          title: "আপনার উদ্যোগের অবস্থা",
          fields: [
            f("biz_status", "", "cards", { req: true, full: true, reqMsg: "যেকোনো একটি নির্বাচন করুন", aria: "উদ্যোগের অবস্থা",
              options: [
                { v: "new", t: "নতুন ব্যবসায়িক ধারণা", d: "এখনো ব্যবসা শুরু করিনি — ফরমের পার্ট-২ প্রযোজ্য", icon: "bulb" },
                { v: "existing", t: "চলমান ব্যবসা", d: "বর্তমানে ব্যবসা পরিচালনা করছি — ফরমের পার্ট-৩ প্রযোজ্য", icon: "store" }
              ] })
          ]
        }
      ]
    },
    {
      key: "personal", short: "ব্যক্তিগত তথ্য", en: "Personal details", part: "পার্ট-১",
      title: "ব্যক্তিগত তথ্যাবলি", desc: "জাতীয় পরিচয়পত্র অনুযায়ী তথ্য প্রদান করুন।",
      sections: [
        {
          title: "পরিচিতি",
          fields: [
            f("name_bn", "আবেদনকারীর নাম (বাংলায়)", "text", { no: "০১", req: true }),
            f("name_en", "আবেদনকারীর নাম (ইংরেজিতে)", "text", { no: "০১", req: true, en: "Block Letters", cls: "upper", ac: "name",
              validate: (v) => (/^[A-Za-z .'-]+$/.test(v) ? "" : "শুধু ইংরেজি অক্ষরে লিখুন") }),
            f("father", "পিতার নাম", "text", { no: "০২", req: true }),
            f("mother", "মাতার নাম", "text", { no: "০৩", req: true }),
            f("nid", "জাতীয় পরিচয়পত্র নম্বর", "text", { no: "০৪", req: true, cls: "mono", inputmode: "numeric", validate: vNid, hint: "১০, ১৩ বা ১৭ অঙ্কের নম্বর" }),
            f("dob", "জন্ম তারিখ", "date", { no: "০৫", req: true, validate: vAge, extra: true }),
            f("marital", "বৈবাহিক অবস্থা", "select", { no: "০৬", req: true, options: ["অবিবাহিত", "বিবাহিত", "তালাকপ্রাপ্ত", "বিধবা/বিপত্নীক"] }),
            f("gender", "লিঙ্গ", "pills", { options: ["পুরুষ", "নারী", "তৃতীয় লিঙ্গ"], hint: "নারী উদ্যোক্তাদের ক্ষেত্রে সুদ/মুনাফার হার সর্বোচ্চ ৫%" }),
            f("spouse_name", "স্বামী/স্ত্রীর নাম", "text", { no: "০৭", req: true, when: (d) => d.marital === "বিবাহিত" }),
            f("spouse_nid", "স্বামী/স্ত্রীর জাতীয় পরিচয়পত্র নম্বর", "text", { no: "০৭", cls: "mono", inputmode: "numeric",
              when: (d) => d.marital === "বিবাহিত", validate: vNid }),
            f("education", "শিক্ষাগত যোগ্যতা", "text", { no: "০৮", req: true, full: true,
              placeholder: "যেমন: বিবিএ, জাতীয় বিশ্ববিদ্যালয়, ২০২৩", hint: "সর্বশেষ পাসকৃত পরীক্ষা, বোর্ড/বিশ্ববিদ্যালয় ও সাল" })
          ]
        },
        {
          title: "যোগাযোগ",
          fields: [
            f("phone", "ফোন নম্বর", "tel", { no: "০৯", req: true, cls: "mono", validate: vPhone, placeholder: "01XXXXXXXXX", ac: "tel" }),
            f("phone_alt", "বিকল্প ফোন নম্বর", "tel", { no: "০৯", cls: "mono", validate: vPhone, placeholder: "01XXXXXXXXX" }),
            f("email", "ই-মেইল আইডি", "email", { no: "১০", full: true, cls: "mono", validate: vEmail, ac: "email", placeholder: "name@example.com" })
          ]
        },
        {
          title: "অভিজ্ঞতা ও আর্থিক তথ্য",
          fields: [
            f("training", "দক্ষতা উন্নয়নমূলক প্রশিক্ষণ (যদি থাকে)", "textarea", { no: "১১", full: true,
              hint: "প্রতিষ্ঠান, কোর্সের নাম, মেয়াদ ও সাল; সনদের কপি সংযুক্ত করুন" }),
            f("experience", "ব্যবসা/চাকরির অভিজ্ঞতা (যদি থাকে)", "textarea", { no: "১২", full: true }),
            f("bank_has", "আপনার কি ব্যাংক হিসাব আছে?", "pills", { no: "১৩", full: true, options: YESNO }),
            f("acc_bank", "ব্যাংকের নাম ও শাখা", "text", { req: true, when: yes("bank_has") }),
            f("acc_type", "হিসাবের ধরণ", "select", { when: yes("bank_has"), options: ["সঞ্চয়ী", "চলতি", "স্টুডেন্ট", "কৃষক/১০ টাকার হিসাব", "অন্যান্য"] }),
            f("acc_no", "হিসাব নম্বর", "text", { full: true, cls: "mono", when: yes("bank_has") }),
            f("loan_has", "কোনো ব্যাংক/আর্থিক প্রতিষ্ঠানে বিদ্যমান ঋণ আছে কি?", "pills", { no: "১৪", req: true, full: true, options: YESNO }),
            f("loan_details", "ঋণের বিবরণ", "textarea", { req: true, full: true, when: yes("loan_has"),
              hint: "প্রতিষ্ঠানের নাম, ঋণের ধরন, পরিমাণ ও বর্তমান অবস্থা" }),
            f("loan_warn", "", "note", { tone: "warn", when: yes("loan_has"),
              text: "নীতিমালা অনুযায়ী, ইতোপূর্বে ব্যবসায়িক কার্যক্রমের জন্য ব্যাংক/আর্থিক প্রতিষ্ঠান থেকে ঋণ গ্রহণকারী এবং ঋণখেলাপি ব্যক্তি এ কর্মসূচির আওতায় বিবেচিত হবেন না। সিআইবি যাচাই করা হবে।" })
          ]
        }
      ]
    },
    {
      key: "address", short: "ঠিকানা", en: "Address", part: "পার্ট-১ · ১৫–১৬",
      title: "ঠিকানা", desc: "জাতীয় পরিচয়পত্র মোতাবেক বর্তমান ও স্থায়ী ঠিকানা।",
      sections: [
        { title: "১৫. বর্তমান ঠিকানা", fields: addr("pres") },
        {
          title: "১৬. স্থায়ী ঠিকানা",
          fields: [
            f("perm_same", "স্থায়ী ঠিকানা বর্তমান ঠিকানার অনুরূপ", "check", { full: true }),
            ...addr("perm", (d) => !d.perm_same),
            f("perm_note", "", "note", { tone: "info",
              text: (d) => `কর্মসূচির শর্ত অনুযায়ী আবেদনকারীকে সংশ্লিষ্ট উপজেলার স্থায়ী বাসিন্দা হতে হবে${d.prog_upazila ? ` (নির্বাচিত: ${esc(d.prog_upazila)}, ${esc(d.prog_district)})` : ""}। প্রমাণক হিসেবে নাগরিক সনদ দাখিল করতে হবে।` })
          ]
        }
      ]
    },
    {
      key: "business",
      short: (d) => (isExisting(d) ? "চলমান ব্যবসা" : "ব্যবসায়িক পরিকল্পনা"), en: "Business",
      part: (d) => (isExisting(d) ? "পার্ট-৩" : "পার্ট-২"),
      title: (d) => (isExisting(d) ? "ব্যবসা সম্পর্কিত তথ্যাবলি" : "ব্যবসায়িক পরিকল্পনা সংক্রান্ত তথ্যাদি"),
      desc: (d) => (isExisting(d) ? "বর্তমানে কোনো ব্যবসা পরিচালনা করে থাকলে" : "ইতোপূর্বে ব্যবসা না থেকে থাকলে"),
      sections: [
        { when: (d) => !d.biz_status, html: () => `<div class="note warn">${icon("warn")}<div>প্রথম ধাপে আপনার উদ্যোগের অবস্থা (নতুন ধারণা / চলমান ব্যবসা) নির্বাচন করুন। <button type="button" class="btn btn-link btn-sm" data-goto="0">প্রথম ধাপে যান</button></div></div>` },
        // ----- Part 2: new business idea -----
        {
          when: isNew, title: "ব্যবসায়িক ধারণা",
          fields: [
            f("p2_idea", "ব্যবসায়িক ধারণা/উদ্যোগের সংক্ষিপ্ত বিবরণ", "textarea", { no: "০১", req: true, full: true, tall: true, words: 200,
              placeholder: "আপনার পণ্য/সেবা কী, কোন সমস্যার সমাধান করবে, কীভাবে আয় হবে…" }),
            f("p2_buyers", "সম্ভাব্য ক্রেতা", "text", { no: "০২", req: true, full: true }),
            f("p2_start", "কত সময়ের মধ্যে ব্যবসা শুরু করার পরিকল্পনা", "select", { no: "০৩", req: true,
              options: ["অর্থায়ন প্রাপ্তির সাথে সাথে", "১ মাসের মধ্যে", "৩ মাসের মধ্যে", "৬ মাসের মধ্যে", "১ বছরের মধ্যে"] }),
            f("p2_type", "ব্যবসার ধরন", "pills", { no: "০৪", req: true, options: BIZ_TYPES }),
            f("p2_type_desc", "ব্যবসার ধরনের বিবরণ", "textarea", { no: "০৪", full: true }),
            f("p2_location", "ব্যবসার সম্ভাব্য অবস্থান", "text", { no: "০৫", req: true, full: true, hint: "গ্রাম/মহল্লা, ইউনিয়ন, উপজেলা" })
          ]
        },
        {
          when: isNew, title: "পণ্য ও বাজার",
          fields: [
            f("p2_product", "পণ্যের ধরন", "pills", { no: "০৬", options: ["আমদানির বিকল্প", "রপ্তানিযোগ্য", "প্রযোজ্য নয়"] }),
            f("p2_product_desc", "পণ্যের বিবরণ", "text", { no: "০৬" }),
            f("p2_raw", "কাঁচামালের উৎস (প্রযোজ্য ক্ষেত্রে)", "text", { no: "০৭", full: true }),
            f("p2_market", "পণ্যের বাজার", "pills", { no: "০৮", req: true, full: true, options: ["স্থানীয়", "আন্তর্জাতিক", "উভয়"] })
          ]
        },
        {
          when: isNew, title: "আর্থিক প্রক্ষেপণ",
          fields: [
            f("p2_sales", "সম্ভাব্য বিক্রয়ের পরিমাণ (টাকায়)", "money3", { no: "০৯", req: true, full: true }),
            f("p2_profit", "সম্ভাব্য লাভ/মুনাফা (টাকায়)", "money3", { no: "১০", req: true, full: true })
          ]
        },
        {
          when: isNew, title: "ঝুঁকি, কর্মসংস্থান ও প্রতিযোগিতা",
          fields: [
            f("p2_risk", "সম্ভাব্য সমস্যা, ঝুঁকি ও তা মোকাবেলার পরিকল্পনা", "textarea", { no: "১১", req: true, full: true }),
            f("p2_emp", "প্রথম বছরে সম্ভাব্য কর্মসংস্থান", "count2", { no: "১২", req: true, full: true }),
            f("p2_competition", "পণ্য/সেবার বর্তমান বাজার অবস্থান", "textarea", { no: "১৩", req: true, full: true, tall: true,
              hint: "কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ" })
          ]
        },
        // ----- Part 3: existing business -----
        {
          when: isExisting, title: "ব্যবসার পরিচিতি",
          fields: [
            f("p3_name", "ব্যবসা প্রতিষ্ঠানের নাম", "text", { no: "০১", req: true, full: true }),
            f("p3_type", "ব্যবসার ধরন", "pills", { no: "০২", req: true, options: BIZ_TYPES }),
            f("p3_start", "ব্যবসা শুরুর তারিখ", "date", { no: "০৩", req: true, max: todayISO() }),
            f("p3_type_desc", "ব্যবসার বিবরণ", "textarea", { no: "০২", full: true }),
            f("p3_license", "ট্রেড লাইসেন্স আছে কি?", "pills", { no: "০৪", req: true, options: YESNO }),
            f("p3_license_info", "ইস্যুর তারিখ ও নম্বর", "text", { no: "০৪", req: true, when: yes("p3_license") }),
            f("p3_price", "পণ্য/সেবার গড় বিক্রয়মূল্য (একক প্রতি)", "textarea", { no: "০৫", req: true, full: true })
          ]
        },
        {
          when: isExisting, title: "আর্থিক তথ্য",
          fields: [
            f("p3_sales", "বিক্রয়ের পরিমাণ (টাকায়)", "money3", { no: "০৬", req: true, full: true }),
            f("p3_profit", "লাভ/মুনাফার পরিমাণ (টাকায়)", "money3", { no: "০৭", req: true, full: true }),
            f("p3_cost", "কাঁচামাল ও ব্যবসা পরিচালনা বাবদ বিভিন্ন খাতে মাসিক সম্ভাব্য খরচ", "textarea", { no: "০৮", req: true, full: true }),
            f("p3_invest", "ব্যবসার সঙ্গে সম্পর্কিত মোট বিনিয়োগের পরিমাণ", "money", { no: "১০", req: true })
          ]
        },
        {
          when: isExisting, title: "পরিচালনা ও বাজার",
          fields: [
            f("p3_involve", "উদ্যোক্তা কীভাবে আলোচ্য ব্যবসায়ের সঙ্গে জড়িত হয়েছেন", "textarea", { no: "০৯", req: true, full: true }),
            f("p3_raw", "কাঁচামালের উৎস (প্রযোজ্য ক্ষেত্রে)", "text", { no: "১১" }),
            f("p3_area", "পণ্য/সেবা বিপণন এলাকা", "text", { no: "১২", req: true }),
            f("p3_competition", "পণ্য/সেবার বর্তমান বাজার অবস্থান", "textarea", { no: "১৩", req: true, full: true, tall: true,
              hint: "কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ" }),
            f("p3_risk", "বিদ্যমান ব্যবসা পরিচালনায় সমস্যা, ঝুঁকি ও তা মোকাবেলার পরিকল্পনা", "textarea", { no: "১৪", req: true, full: true }),
            f("p3_emp", "কর্মীর সংখ্যা", "count2", { no: "১৫", req: true, full: true }),
            f("p3_expand", "সম্প্রসারণসহ কর্মী বাড়ানোর পরিকল্পনা (থাকলে বিবরণ)", "textarea", { no: "১৬", full: true })
          ]
        }
      ]
    },
    {
      key: "finance", short: "অর্থায়ন পরিকল্পনা", en: "Financing plan", part: "পার্ট-৪",
      title: "অর্থায়ন পরিকল্পনা ও ব্যয় বিভাজন",
      desc: "সর্বোচ্চ ২০ লক্ষ টাকা — অর্ধেক ব্যাংক ঋণ, অর্ধেক অনুদান। প্রকৃত চাহিদা ও ব্যয় পরিকল্পনার ভিত্তিতে নির্ধারিত হবে।",
      sections: [
        {
          title: "ক. অর্থায়ন প্যাকেজ",
          fields: [
            f("fin_total", "প্রয়োজনীয় মোট মূলধনের পরিমাণ", "money", { no: "০১", req: true }),
            f("fin_own", "নিজস্ব বিনিয়োগ (যদি থাকে)", "money", { no: "০২" }),
            f("fin_req", "আবেদনকৃত অর্থায়নের পরিমাণ", "money", { no: "০৩", req: true, full: true,
              hint: "স্বয়ংক্রিয় হিসাব: মোট মূলধন − নিজস্ব বিনিয়োগ (সর্বোচ্চ ২০ লক্ষ)। প্রয়োজনে কম পরিমাণ লিখতে পারেন।",
              validate: (v, d) => {
                const R = num(v), T = num(d.fin_total), O = num(d.fin_own);
                if (R <= 0) return "আবেদনকৃত পরিমাণ দিন";
                if (R > PROGRAM.maxFinance) return "সর্বোচ্চ ২০ লক্ষ টাকা পর্যন্ত আবেদন করা যাবে";
                if (T && R > T - O) return "মোট মূলধন থেকে নিজস্ব বিনিয়োগ বাদ দিয়ে যা থাকে তার বেশি হতে পারবে না";
                return "";
              } })
          ],
          custom: "finsummary"
        },
        { title: "খ. খাতভিত্তিক ব্যয় বিভাজন", desc: "প্রযোজ্য ঘরসমূহ পূরণ করুন — মোট পরিমাণ স্বয়ংক্রিয়ভাবে যোগ হবে।", custom: "budget" }
      ]
    },
    {
      key: "other", short: "অন্যান্য ও সংযুক্তি", en: "Other info & documents", part: "পার্ট-৫",
      title: "অন্যান্য তথ্য ও সংযুক্তি", desc: "অতিরিক্ত তথ্য এবং প্রয়োজনীয় কাগজপত্র।",
      sections: [
        {
          title: "অন্যান্য তথ্য",
          fields: [
            f("disability", "শারীরিক প্রতিবন্ধকতা আছে কি?", "pills", { no: "০১", req: true, options: YESNO }),
            f("disability_type", "প্রতিবন্ধকতার ধরন", "text", { no: "০১", req: true, when: yes("disability") }),
            f("ethnic", "ক্ষুদ্র নৃগোষ্ঠীভুক্ত কি?", "pills", { no: "০২", req: true, options: YESNO }),
            f("other_info", "অন্যান্য", "textarea", { no: "০৩", full: true })
          ]
        },
        { title: "সংযুক্তি", desc: "পাসপোর্ট সাইজ ছবি ও কাগজপত্রের ছবি/PDF যুক্ত করুন।", custom: "uploads" }
      ]
    },
    {
      key: "declare", short: "ঘোষণা ও স্বাক্ষর", en: "Declaration", part: "ঘোষণা",
      title: "ঘোষণা ও স্বাক্ষর", desc: "অনুগ্রহ করে মনোযোগ দিয়ে পড়ুন এবং সম্মতি দিন।",
      sections: [
        {
          html: () => `<div class="decl-text">
            <p>আমি এই মর্মে ঘোষণা করছি যে, উপরে প্রদত্ত সমস্ত তথ্য সত্য ও সঠিক। কোনো তথ্য অসত্য প্রমাণিত হলে আমার আবেদন/অনুমোদন যেকোনো পর্যায়ে বাতিলযোগ্য হবে।</p>
            <p>আমি অবগত আছি যে অনুমোদিত হলে, প্রাপ্ত ঋণ ও অনুদান নির্ধারিত খাতে ব্যবহৃত হলে এবং ঋণ অংশ সম্পূর্ণ ও যথাসময়ে পরিশোধ করলেই কেবল অনুদানের প্রাপ্ত অর্থ অনুদান হিসেবে বিবেচিত হবে এবং ঋণের সদ্ব্যবহার না করা হলে অনুদান অংশ ঋণে পরিণত হবে এবং সম্পূর্ণ অর্থ ঋণ হিসেবে গণ্য হয়ে আমি খেলাপি হিসেবে চিহ্নিত হব। আমি অঙ্গীকার করছি যে প্রদানকৃত অর্থ ব্যক্তিগত ভোগ, জমি বা যানবাহন ক্রয়ে ব্যবহার করব না; প্রতিটি ব্যয়ের ভাউচার সংরক্ষণ করব এবং চাহিদামতো প্রতিবেদন দাখিল করব।</p></div>`
        },
        {
          fields: [
            f("decl_1", "", "check", { req: true, full: true, reqMsg: "সম্মতি প্রদান আবশ্যক",
              text: "আমি ঘোষণা করছি যে প্রদত্ত সকল তথ্য সত্য ও সঠিক।" }),
            f("decl_2", "", "check", { req: true, full: true, reqMsg: "সম্মতি প্রদান আবশ্যক",
              text: "আমি ঋণ ও অনুদান ব্যবহারের শর্তাবলি সম্পর্কে অবগত এবং তা মেনে চলার অঙ্গীকার করছি।" })
          ],
          custom: "signature"
        }
      ]
    },
    {
      key: "review", short: "পর্যালোচনা ও জমা", en: "Review & submit", part: "শেষ ধাপ",
      title: "পর্যালোচনা ও জমা", desc: "জমা দেওয়ার আগে সকল তথ্য একবার যাচাই করুন।",
      sections: [{ custom: "review" }]
    }
  ];

  const FIELD = {};
  STEPS.forEach((s) => s.sections.forEach((sec) => (sec.fields || []).forEach((fd) => (FIELD[fd.id] = fd))));
  const REVIEW = STEPS.length - 1;

  // =====================================================================
  //  STATE
  // =====================================================================
  let data = store.get(U.DRAFT_KEY, null) || {};
  data._auto = data._auto || {};
  let cur = Math.min(Math.max(0, data._step || 0), REVIEW);
  const visited = new Set(data._visited || []);
  let saveTimer;

  const save = () => {
    data._step = cur;
    data._visited = [...visited];
    let ok = store.set(U.DRAFT_KEY, data);
    if (!ok && data.photo) { // storage full — drop the photo preview rather than lose the draft
      const p = data.photo; delete data.photo; ok = store.set(U.DRAFT_KEY, data); data.photo = p;
    }
    const st = $("#saveState");
    st.querySelector("span").textContent = ok
      ? "সংরক্ষিত · " + new Date().toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" })
      : "এই ব্রাউজারে সংরক্ষণ সম্ভব হয়নি";
    st.classList.add("flash");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => st.classList.remove("flash"), 1200);
  };

  // effective data (permanent address may mirror present)
  const eff = (d = data) => {
    const e = { ...d };
    if (d.perm_same) ["house", "road", "post", "thana", "district", "division"].forEach((k) => (e["perm_" + k] = d["pres_" + k]));
    return e;
  };

  // =====================================================================
  //  VALIDATION
  // =====================================================================
  const isEmptyField = (fd, d) => {
    if (fd.type === "money3") return empty(d[fd.id + "_m"]);
    if (fd.type === "count2") return empty(d[fd.id + "_t"]);
    if (fd.type === "check") return !d[fd.id];
    if (fd.type === "money") return num(d[fd.id]) <= 0;
    return empty(d[fd.id]);
  };
  const fieldError = (fd, d) => {
    if (fd.type === "note") return "";
    if (isEmptyField(fd, d)) return fd.req ? fd.reqMsg || "এই তথ্যটি আবশ্যক" : "";
    if (fd.words && words(d[fd.id]) > fd.words) return `সর্বোচ্চ ${bn(fd.words)} শব্দের মধ্যে লিখুন`;
    if (fd.type === "count2" && num(d[fd.id + "_w"]) > num(d[fd.id + "_t"])) return "নারী কর্মীর সংখ্যা মোট কর্মীর চেয়ে বেশি হতে পারে না";
    return fd.validate ? fd.validate(d[fd.id], d) : "";
  };
  const shown = (x, d) => !x.when || x.when(d);

  function stepErrors(i, d = data) {
    const errs = []; let total = 0, filled = 0;
    STEPS[i].sections.forEach((sec) => {
      if (!shown(sec, d)) return;
      (sec.fields || []).forEach((fd) => {
        if (!shown(fd, d) || fd.type === "note") return;
        if (fd.req) { total++; if (!isEmptyField(fd, d)) filled++; }
        const e = fieldError(fd, d);
        if (e) errs.push({ id: fd.id, msg: e });
      });
      const c = sec.custom && CUSTOM[sec.custom];
      if (c && c.validate) { const r = c.validate(d); errs.push(...r.errs); total += r.total; filled += r.filled; }
    });
    return { errs, total, filled };
  }

  const setErr = (id, msg) => {
    const w = $(`.fld[data-f="${id}"]`); if (!w) return;
    w.classList.toggle("invalid", !!msg);
    const e = $("#e_" + id); if (e) e.textContent = msg || "";
    $$("input, select, textarea", w).forEach((el) => el.setAttribute("aria-invalid", msg ? "true" : "false"));
  };
  function showErrors(scroll) {
    $$(".fld.invalid").forEach((w) => setErr(w.dataset.f, ""));
    const { errs } = stepErrors(cur);
    errs.forEach((e) => setErr(e.id, e.msg));
    if (scroll && errs.length) {
      const w = $(`.fld[data-f="${errs[0].id}"]`);
      if (w) { w.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => $("input, select, textarea", w)?.focus({ preventScroll: true }), 350); }
    }
    return errs;
  }
  function validateLive(k) {
    const base = k.replace(/_(m|q|y|t|w)$/, "");
    const fd = FIELD[base] || FIELD[k];
    if (!fd || !$(`.fld[data-f="${fd.id}"].invalid`)) return; // only clear/refresh fields already flagged
    setErr(fd.id, shown(fd, data) ? fieldError(fd, data) : "");
  }

  // =====================================================================
  //  RENDERING
  // =====================================================================
  const optionsHTML = (fd) => {
    const v = data[fd.id] ?? "";
    const opts = val(fd.options, data);
    return `<option value="">${esc(val(fd.placeholder, data) || "নির্বাচন করুন")}</option>` +
      opts.map((o) => `<option ${o === v ? "selected" : ""}>${esc(o)}</option>`).join("");
  };
  const moneyHint = (v) => { const n = num(v); return n ? `= ${taka(n)}${n >= 100000 ? ` (${lakh(n)})` : ""}` : ""; };

  function labelHTML(fd, forId) {
    if (!fd.label && !fd.no) return "";
    const inner = `${fd.no ? `<span class="no">${fd.no}</span>` : ""}${fd.label}${fd.req ? '<span class="req" aria-hidden="true">*</span>' : ""}${fd.en ? `<span class="en-l">${fd.en}</span>` : ""}`;
    return forId ? `<label for="${forId}">${inner}</label>` : `<div class="lbl" id="l_${fd.id}">${inner}</div>`;
  }

  function fieldHTML(fd) {
    const d = data, id = "f_" + fd.id, v = d[fd.id] ?? "";
    const common = `id="${id}" data-k="${fd.id}" aria-describedby="e_${fd.id}"${fd.req ? ' aria-required="true"' : ""}`;
    const ph = fd.placeholder ? ` placeholder="${esc(val(fd.placeholder, d))}"` : "";
    let control = "", grouped = false;
    switch (fd.type) {
      case "text": case "tel": case "email":
        control = `<input class="inp ${fd.cls || ""}" type="${fd.type}" ${common} value="${esc(v)}"${ph}${fd.inputmode ? ` inputmode="${fd.inputmode}"` : ""}${fd.ac ? ` autocomplete="${fd.ac}"` : ""}>`;
        break;
      case "date":
        control = `<input class="inp" type="date" ${common} value="${esc(v)}"${fd.max ? ` max="${fd.max}"` : ""}>`;
        break;
      case "money":
        control = `<div class="prefix"><span>৳</span><input class="inp mono" inputmode="numeric" data-money ${common} value="${esc(v)}" placeholder="0"></div><div class="hint" id="mh_${fd.id}">${moneyHint(v)}</div>`;
        break;
      case "textarea":
        control = `<textarea class="${fd.tall ? "tall" : ""}" ${common}${ph}>${esc(v)}</textarea>` + (fd.words ? `<div class="wc" id="wc_${fd.id}"></div>` : "");
        break;
      case "select":
        control = `<select ${common}>${optionsHTML(fd)}</select>`;
        break;
      case "pills": grouped = true;
        control = `<div class="pills" role="radiogroup" aria-labelledby="l_${fd.id}">${val(fd.options, d).map((o) =>
          `<label><input type="radio" name="${fd.id}" data-k="${fd.id}" value="${esc(o)}" ${v === o ? "checked" : ""}><span>${esc(o)}</span></label>`).join("")}</div>`;
        break;
      case "cards": grouped = true;
        control = `<div class="cards" role="radiogroup" aria-label="${esc(fd.aria || fd.label)}">${fd.options.map((o) =>
          `<label><input type="radio" name="${fd.id}" data-k="${fd.id}" value="${o.v}" ${v === o.v ? "checked" : ""}><span class="card"><span class="ci">${icon(o.icon)}</span><b>${o.t}</b><small>${o.d}</small></span></label>`).join("")}</div>`;
        break;
      case "check":
        control = `<label class="check ${v ? "on" : ""}"><input type="checkbox" ${common} ${v ? "checked" : ""}><span>${fd.text || fd.label}${fd.req ? ' <span class="req" style="color:var(--red)">*</span>' : ""}</span></label>`;
        break;
      case "money3": grouped = true;
        control = `<div class="trio">${[["m", "মাসিক"], ["q", "ত্রৈমাসিক"], ["y", "বার্ষিক"]].map(([s, t]) =>
          `<label><span class="sub">${t}</span><div class="prefix"><span>৳</span><input class="inp mono" inputmode="numeric" data-money data-k="${fd.id}_${s}" id="f_${fd.id}_${s}" value="${esc(d[fd.id + "_" + s] ?? "")}" placeholder="0"></div></label>`).join("")}</div>
          <div class="hint">মাসিক পরিমাণ দিলে ত্রৈমাসিক ও বার্ষিক স্বয়ংক্রিয়ভাবে হিসাব হবে — প্রয়োজনে সংশোধন করুন।</div>`;
        break;
      case "count2": grouped = true;
        control = `<div class="duo">${[["t", "মোট (জন)"], ["w", "তন্মধ্যে নারী (জন)"]].map(([s, t]) =>
          `<label><span class="sub">${t}</span><input class="inp mono" inputmode="numeric" data-k="${fd.id}_${s}" id="f_${fd.id}_${s}" value="${esc(d[fd.id + "_" + s] ?? "")}" placeholder="০"></label>`).join("")}</div>`;
        break;
      case "note":
        return `<div class="fld full" data-f="${fd.id}"><div class="note ${fd.tone || "info"}">${icon(fd.tone === "warn" ? "warn" : "info")}<div data-note-text>${val(fd.text, d)}</div></div></div>`;
    }
    const lab = fd.type === "check" ? "" : labelHTML(fd, grouped ? null : id);
    return `<div class="fld${fd.full ? " full" : ""}" data-f="${fd.id}">${lab}${control}${fd.hint ? `<div class="hint">${fd.hint}</div>` : ""}${fd.extra ? `<div id="x_${fd.id}"></div>` : ""}<div class="err-msg" id="e_${fd.id}" role="alert"></div></div>`;
  }

  function sectionHTML(sec, i) {
    if (!shown(sec, data)) return "";
    let body = sec.html ? sec.html(data) : "";
    if (sec.fields) body += `<div class="fgrid">${sec.fields.map(fieldHTML).join("")}</div>`;
    if (sec.custom) body += CUSTOM[sec.custom].render(data);
    const head = sec.title ? `<h3 class="fsec-title">${val(sec.title, data)}</h3>${sec.desc ? `<p class="fsec-desc">${sec.desc}</p>` : ""}` : "";
    return `<div class="fsec" data-s="${i}">${head}${body}</div>`;
  }

  function renderStep() {
    const s = STEPS[cur];
    const card = $("#stepCard");
    card.innerHTML = `<div class="step-top"><span class="part">${val(s.part, data)}</span><h2>${val(s.title, data)}</h2><p>${val(s.desc, data)}</p></div>
      <div class="step-body">${s.sections.map(sectionHTML).join("")}</div>`;
    card.style.animation = "none"; void card.offsetWidth; card.style.animation = "";
    s.sections.forEach((sec) => shown(sec, data) && sec.custom && CUSTOM[sec.custom].bind && CUSTOM[sec.custom].bind());
    refresh();
    if (visited.has(cur) && cur !== REVIEW) showErrors(false);

    $("#prevBtn").style.visibility = cur === 0 ? "hidden" : "visible";
    const nb = $("#nextBtn");
    nb.innerHTML = cur === REVIEW ? `আবেদন জমা দিন${icon("check")}` : `পরবর্তী ধাপ${icon("arrow")}`;
    $("#stepCount").textContent = `ধাপ ${bn(cur + 1)} / ${bn(STEPS.length)}`;
    renderStepper();
    const ol = $("#stepList"), li = $("#stepList .cur");
    if (li && ol.scrollWidth > ol.clientWidth) ol.scrollLeft = li.offsetLeft - ol.clientWidth / 2 + li.clientWidth / 2;
  }

  function renderStepper() {
    let T = 0, F = 0;
    $("#stepList").innerHTML = STEPS.map((s, i) => {
      const r = i === REVIEW ? null : stepErrors(i);
      if (r) { T += r.total; F += r.filled; }
      const cls = [i === cur && "cur", r && visited.has(i) && (r.errs.length ? "err" : "done")].filter(Boolean).join(" ");
      const mark = r && visited.has(i) && !r.errs.length && i !== cur ? icon("check") : r && visited.has(i) && r.errs.length && i !== cur ? "!" : bn(i + 1);
      return `<li class="${cls}"><button type="button" data-goto="${i}" ${i === cur ? 'aria-current="step"' : ""}><span class="sn">${mark}</span><span class="st"><b>${val(s.short, data)}</b><small>${val(s.part, data)}</small></span></button></li>`;
    }).join("");
    const p = T ? Math.round((F / T) * 100) : 0;
    $("#ring").style.setProperty("--p", p);
    $("#ringTxt").textContent = bn(p) + "%";
  }

  // live-derived UI bits
  function refresh() {
    STEPS[cur].sections.forEach((sec) => (sec.fields || []).forEach((fd) => {
      const w = $(`.fld[data-f="${fd.id}"]`); if (!w) return;
      w.hidden = !shown(fd, data);
      if (fd.type === "note") { const t = $("[data-note-text]", w); if (t) t.innerHTML = val(fd.text, data); }
    }));
    const x = $("#x_dob");
    if (x) {
      const a = ageOn(data.dob, PROGRAM.ageRefDate);
      const ok = a !== null && a >= PROGRAM.minAge && a <= PROGRAM.maxAge;
      x.innerHTML = a === null ? "" : `<span class="chip-note ${ok ? "ok" : "bad"}">${icon(ok ? "check" : "warn")}১৫ অক্টোবর ২০২৬ তারিখে বয়স: ${bn(a)} বছর</span>`;
    }
    $$("[id^=wc_]").forEach((el) => {
      const k = el.id.slice(3), n = words(data[k]), max = FIELD[k].words;
      el.textContent = `${bn(n)} / ${bn(max)} শব্দ`;
      el.classList.toggle("over", n > max);
    });
    $$("[id^=mh_]").forEach((el) => (el.textContent = moneyHint(data[el.id.slice(3)])));
    $$(".check").forEach((c) => c.classList.toggle("on", c.querySelector("input").checked));
    STEPS[cur].sections.forEach((sec) => sec.custom && CUSTOM[sec.custom].update && $(".step-body") && CUSTOM[sec.custom].update());
  }

  // =====================================================================
  //  CUSTOM SECTIONS
  // =====================================================================
  const CUSTOM = {
    finsummary: {
      render: () => `<div class="fin-summary"><div class="fs-l">
          <div class="note info">${icon("info")}<div>সমন্বিত অর্থায়নের ঋণ-অনুদান অনুপাত <b>৫০:৫০</b>। কোনো সহায়ক জামানত লাগবে না।</div></div>
          <div class="note warn" id="finCapNote" hidden>${icon("warn")}<div>প্রয়োজন ২০ লক্ষ টাকার বেশি। অতিরিক্ত অংশ নিজস্ব বা অন্য বৈধ উৎস থেকে সংস্থান করতে হবে।</div></div>
          <div style="font-size:.9rem;color:var(--ink-2)" id="finRate"></div>
        </div>
        <div class="fs-r" aria-live="polite"><small>আবেদনকৃত অর্থায়ন</small><span class="tot" id="finTot">৳ ০</span>
          <div class="split-bar"><i class="loan" id="fbLoan"></i><i class="grant" id="fbGrant"></i><i class="own" id="fbOwn"></i></div>
          <div class="row"><span><i style="background:var(--leaf)"></i>ব্যাংক ঋণ (৫০%)</span><b id="finLoan">৳ ০</b></div>
          <div class="row"><span><i style="background:var(--amber)"></i>অনুদান (৫০%)</span><b id="finGrant">৳ ০</b></div>
          <div class="row"><span><i style="background:rgba(255,255,255,.4)"></i>নিজস্ব/অন্যান্য উৎস</span><b id="finOwn">৳ ০</b></div>
        </div></div>`,
      update() {
        if (!$("#finTot")) return;
        const T = num(data.fin_total), O = num(data.fin_own), R = Math.min(num(data.fin_req), PROGRAM.maxFinance);
        const loan = R / 2, grant = R / 2, rest = Math.max(0, T - R);
        $("#finTot").textContent = taka(R);
        $("#finLoan").textContent = taka(loan);
        $("#finGrant").textContent = taka(grant);
        $("#finOwn").textContent = taka(rest);
        const base = Math.max(T, R) || 1;
        $("#fbLoan").style.width = (loan / base) * 100 + "%";
        $("#fbGrant").style.width = (grant / base) * 100 + "%";
        $("#fbOwn").style.width = (rest / base) * 100 + "%";
        $("#finCapNote").hidden = !(T - O > PROGRAM.maxFinance);
        $("#finRate").innerHTML = data.gender === "নারী"
          ? "সুদ/মুনাফার হার (নারী উদ্যোক্তা): <b>সর্বোচ্চ ৫%</b>"
          : "সুদ/মুনাফার হার: <b>সর্বোচ্চ ৪% – ৭%</b> — স্টার্ট-আপ ৪%, নারী উদ্যোক্তা ৫%, সিএমএসএমই ও কৃষিপণ্য প্রক্রিয়াজাতকরণ ৭%।";
      }
    },

    budget: {
      render: (d) => `<div class="fld full" data-f="budget"><div class="budget-wrap"><table class="budget">
          <thead><tr><th>ক্রম</th><th>ব্যয়ের খাত</th><th>বিবরণ</th><th>মোট (টাকা)</th><th>অর্থের উৎস</th></tr></thead>
          <tbody>${BUDGET.map((h, i) => {
            const k = "b" + (i + 1);
            return `<tr><td>${String(i + 1).padStart(2, "0")}</td><td class="head">${h}</td>
              <td><input class="inp" data-k="${k}_d" value="${esc(d[k + "_d"] ?? "")}" aria-label="${h} — বিবরণ"></td>
              <td><input class="inp mono" inputmode="numeric" data-money data-k="${k}_a" value="${esc(d[k + "_a"] ?? "")}" placeholder="0" aria-label="${h} — টাকা"></td>
              <td><select data-k="${k}_s" aria-label="${h} — অর্থের উৎস"><option value="">—</option>${SOURCES.map((s) => `<option ${d[k + "_s"] === s ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>`;
          }).join("")}</tbody>
          <tfoot><tr><td colspan="3">সর্বমোট</td><td class="amt" id="budTotal" colspan="2">৳ ০</td></tr></tfoot>
        </table></div>
        <div class="note warn budget-check" id="budCheck" hidden></div>
        <div class="err-msg" id="e_budget" role="alert"></div></div>`,
      total: (d) => BUDGET.reduce((s, _, i) => s + num(d["b" + (i + 1) + "_a"]), 0),
      update() {
        const el = $("#budTotal"); if (!el) return;
        const t = CUSTOM.budget.total(data), T = num(data.fin_total);
        el.textContent = taka(t);
        const c = $("#budCheck");
        c.hidden = !(t && T && t !== T);
        if (!c.hidden) c.innerHTML = `${icon("warn")}<div>ব্যয় বিভাজনের সর্বমোট (${taka(t)}) প্রয়োজনীয় মোট মূলধনের (${taka(T)}) সাথে মিলছে না — ${t > T ? "বেশি" : "কম"} ${taka(Math.abs(t - T))}।</div>`;
      },
      validate: (d) => {
        const t = CUSTOM.budget.total(d);
        return { errs: t > 0 ? [] : [{ id: "budget", msg: "অন্তত একটি খাতে ব্যয়ের পরিমাণ দিন" }], total: 1, filled: t > 0 ? 1 : 0 };
      }
    },

    uploads: {
      render: (d) => `<div class="uploads">
          <div class="photo-drop" id="photoDrop">
            ${d.photo ? `<img src="${d.photo}" alt="আবেদনকারীর ছবি">` : `<div>${icon("upload")}<b>পাসপোর্ট সাইজ ছবি</b><small>JPG/PNG · ক্লিক বা ড্র্যাগ করুন</small></div>`}
            <input type="file" accept="image/*" id="photoIn" aria-label="পাসপোর্ট সাইজ ছবি আপলোড">
            ${d.photo ? `<button type="button" class="rm" id="photoRm">মুছুন</button>` : ""}
          </div>
          <div class="doc-ups">${DOCS.map((doc) => {
            const has = d[doc.id];
            return `<label class="doc-up ${has ? "has" : ""}"><span class="di">${icon(has ? "check" : "file")}</span>
              <div><b>${doc.t}</b><small>${has ? esc(has.name) + " · " + bn(Math.max(1, Math.round(has.size / 1024))) + " KB" : "ছবি বা PDF নির্বাচন করুন"}</small></div>
              <span class="tag ${doc.req ? "req" : ""}">${doc.req ? "আবশ্যক" : "যদি থাকে"}</span>
              <input type="file" accept="image/*,.pdf" data-doc="${doc.id}" aria-label="${doc.t}"></label>`;
          }).join("")}</div></div>
        <div class="note info" style="margin-top:14px">${icon("info")}<div>ফাইলগুলো শুধু আপনার ডিভাইসে প্রিভিউ হিসেবে থাকে। প্রিন্ট করা আবেদনপত্রের সাথে সকল সংযুক্তির কপি ব্যাংক শাখায় জমা দিতে হবে।</div></div>`,
      bind() {
        const drop = $("#photoDrop"), inp = $("#photoIn");
        ["dragenter", "dragover"].forEach((e) => drop.addEventListener(e, () => drop.classList.add("drag")));
        ["dragleave", "drop"].forEach((e) => drop.addEventListener(e, () => drop.classList.remove("drag")));
        inp.addEventListener("change", () => {
          const file = inp.files[0]; if (!file) return;
          if (!file.type.startsWith("image/")) return toast("অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন");
          const r = new FileReader();
          r.onload = () => {
            const img = new Image();
            img.onload = () => { // downscale to keep the draft small
              const s = Math.min(1, 480 / Math.max(img.width, img.height));
              const c = document.createElement("canvas");
              c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
              c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
              data.photo = c.toDataURL("image/jpeg", 0.85);
              save(); renderStep();
            };
            img.src = r.result;
          };
          r.readAsDataURL(file);
        });
        $("#photoRm")?.addEventListener("click", (e) => { e.preventDefault(); delete data.photo; save(); renderStep(); });
        $$("[data-doc]").forEach((el) => el.addEventListener("change", () => {
          const file = el.files[0]; if (!file) return;
          data[el.dataset.doc] = { name: file.name, size: file.size };
          save(); renderStep();
        }));
      }
    },

    signature: {
      render: () => `<div class="fgrid"><div class="fld full" data-f="signature" style="margin-top:6px">
          <div class="lbl" id="l_signature">আবেদনকারীর স্বাক্ষর<span class="req" aria-hidden="true">*</span></div>
          <div class="sig-wrap"><canvas id="sigPad" aria-labelledby="l_signature"></canvas><div class="sig-line"></div><div class="sig-ph" id="sigPh">এখানে আঙুল বা মাউস দিয়ে স্বাক্ষর করুন</div></div>
          <div class="sig-tools"><span class="hint">তারিখ: ${bnDate(todayISO())}</span><button type="button" class="btn btn-link btn-sm" id="sigClear">মুছে আবার স্বাক্ষর করুন</button></div>
          <div class="err-msg" id="e_signature" role="alert"></div></div></div>`,
      bind() {
        const cv = $("#sigPad"), ph = $("#sigPh"), ctx = cv.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const setup = () => {
          const r = cv.getBoundingClientRect();
          cv.width = r.width * dpr; cv.height = r.height * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0b1f40";
          if (data.signature) {
            const im = new Image();
            im.onload = () => ctx.drawImage(im, 0, 0, r.width, r.height);
            im.src = data.signature;
          }
          ph.hidden = !!data.signature;
        };
        setup();
        let drawing = false, last = null, dirty = false;
        const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
        cv.addEventListener("pointerdown", (e) => { drawing = true; last = pt(e); cv.setPointerCapture(e.pointerId); ph.hidden = true; });
        cv.addEventListener("pointermove", (e) => {
          if (!drawing) return;
          const p = pt(e);
          ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          last = p; dirty = true;
        });
        const end = () => {
          if (!drawing) return; drawing = false;
          if (dirty) { data.signature = cv.toDataURL("image/png"); save(); validateLive("signature"); renderStepper(); }
        };
        cv.addEventListener("pointerup", end);
        cv.addEventListener("pointercancel", end);
        $("#sigClear").addEventListener("click", () => {
          ctx.clearRect(0, 0, cv.width, cv.height); delete data.signature; dirty = false; ph.hidden = false; save(); renderStepper();
        });
      },
      validate: (d) => ({ errs: d.signature ? [] : [{ id: "signature", msg: "স্বাক্ষর প্রদান আবশ্যক" }], total: 1, filled: d.signature ? 1 : 0 })
    },

    review: {
      render: () => {
        const d = eff();
        return STEPS.slice(0, REVIEW).map((s, i) => {
          const errs = stepErrors(i).errs;
          let rows = "";
          s.sections.forEach((sec) => {
            if (!shown(sec, d)) return;
            (sec.fields || []).forEach((fd) => {
              if (!shown(fd, d) || fd.type === "note") return;
              const v = display(fd, d), miss = fd.req && empty(v);
              rows += `<div class="k">${fd.no ? bn(fd.no) + ". " : ""}${fd.label || fd.text || fd.aria}</div><div class="v ${miss ? "miss" : empty(v) ? "empty" : ""}">${miss ? "পূরণ করা হয়নি" : empty(v) ? "—" : esc(v)}</div>`;
            });
            if (sec.custom === "budget") {
              BUDGET.forEach((h, j) => {
                const k = "b" + (j + 1), a = num(d[k + "_a"]);
                if (a) rows += `<div class="k">${h}</div><div class="v">${esc(taka(a))}${d[k + "_d"] ? " — " + esc(d[k + "_d"]) : ""}${d[k + "_s"] ? " (" + esc(d[k + "_s"]) + ")" : ""}</div>`;
              });
              rows += `<div class="k"><b>সর্বমোট ব্যয়</b></div><div class="v"><b>${taka(CUSTOM.budget.total(d))}</b></div>`;
            }
            if (sec.custom === "uploads") {
              rows += DOCS.map((doc) => `<div class="k">${doc.t}</div><div class="v ${d[doc.id] ? "" : "empty"}">${d[doc.id] ? esc(d[doc.id].name) : "—"}</div>`).join("");
            }
            if (sec.custom === "signature") {
              rows += `<div class="k">স্বাক্ষর</div><div class="v ${d.signature ? "" : "miss"}">${d.signature ? `<img src="${d.signature}" alt="স্বাক্ষর" style="height:54px;background:#fff">` : "প্রদান করা হয়নি"}</div>`;
            }
          });
          const photo = s.key === "personal" ? `<div class="rv-photo">${d.photo ? `<img src="${d.photo}" alt="ছবি">` : `<div class="ph">ছবি যুক্ত করা হয়নি</div>`}<div><b style="font-size:1.1rem">${esc(d.name_bn || "")}</b><br><span class="en" style="color:var(--ink-3)">${esc(d.name_en || "")}</span></div></div>` : "";
          return `<div class="rv-sec"><div class="rv-head"><h3>${val(s.part, d)} · ${val(s.short, d)}</h3>
            <div style="display:flex;align-items:center;gap:10px">${errs.length ? `<span class="bad">${bn(errs.length)}টি ত্রুটি</span>` : ""}
            <button type="button" class="btn btn-ghost btn-sm" data-goto="${i}">${icon("edit")}সম্পাদনা</button></div></div>
            ${photo}<div class="rv-list">${rows}</div></div>`;
        }).join("");
      }
    }
  };
  // signature HTML contains <img> — rendered unescaped above on purpose; everything else is escaped.

  function display(fd, d) {
    switch (fd.type) {
      case "money": return num(d[fd.id]) ? taka(num(d[fd.id])) : "";
      case "money3": return empty(d[fd.id + "_m"]) ? "" :
        `মাসিক ${taka(num(d[fd.id + "_m"]))} · ত্রৈমাসিক ${taka(num(d[fd.id + "_q"]))} · বার্ষিক ${taka(num(d[fd.id + "_y"]))}`;
      case "count2": return empty(d[fd.id + "_t"]) ? "" : `মোট ${bn(num(d[fd.id + "_t"]))} জন, তন্মধ্যে নারী ${bn(num(d[fd.id + "_w"]))} জন`;
      case "date": return bnDate(d[fd.id]);
      case "check": return d[fd.id] ? (fd.req ? "সম্মত ✓" : "হ্যাঁ") : "";
      case "cards": return (fd.options.find((o) => o.v === d[fd.id]) || {}).t || "";
      default: return d[fd.id] ?? "";
    }
  }

  // =====================================================================
  //  EVENTS
  // =====================================================================
  const form = $("#form");

  function hooks(k, v) {
    // monthly → quarterly / yearly auto-fill
    const m = k.match(/^(.*)_m$/);
    if (m && FIELD[m[1]] && FIELD[m[1]].type === "money3") {
      const n = num(v);
      [["q", 3], ["y", 12]].forEach(([s, mult]) => {
        const key = m[1] + "_" + s;
        if (empty(data[key]) || data._auto[key]) {
          data[key] = enMoney(n * mult); data._auto[key] = true;
          const inp = $("#f_" + key); if (inp) inp.value = data[key];
        }
      });
    }
    if (k === "prog_district") {
      const list = (DISTRICTS.find((x) => x.bn === v) || {}).upazilas || [];
      if (!list.includes(data.prog_upazila)) data.prog_upazila = "";
      const sel = $("#f_prog_upazila"); if (sel) sel.innerHTML = optionsHTML(FIELD.prog_upazila);
    }
    if (k === "fin_total" || k === "fin_own") {
      if (empty(data.fin_req) || data._auto.fin_req) {
        const r = Math.max(0, Math.min(num(data.fin_total) - num(data.fin_own), PROGRAM.maxFinance));
        data.fin_req = enMoney(r); data._auto.fin_req = true;
        const inp = $("#f_fin_req"); if (inp) inp.value = data.fin_req;
      }
    }
    if (k === "perm_same" && !v) {
      const dist = DISTRICTS.find((x) => x.bn === data.prog_district);
      if (empty(data.perm_thana)) data.perm_thana = data.prog_upazila || "";
      if (empty(data.perm_district)) data.perm_district = data.prog_district || "";
      if (empty(data.perm_division) && dist) data.perm_division = dist.division;
      return "rerender";
    }
  }

  function onChange(e) {
    const el = e.target, k = el.dataset.k;
    if (!k) return;
    let v = el.type === "checkbox" ? el.checked : el.value;
    if (el.classList.contains("upper") && v !== v.toUpperCase()) {
      const p = el.selectionStart; v = v.toUpperCase(); el.value = v; el.setSelectionRange(p, p);
    }
    if (data[k] === v) return;
    data[k] = v;
    delete data._auto[k];
    const h = hooks(k, v);
    save();
    if (h === "rerender") return renderStep();
    refresh();
    validateLive(k);
    renderStepper();
  }
  form.addEventListener("input", onChange);
  form.addEventListener("change", onChange);
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("focusout", (e) => {
    const el = e.target;
    if (el.hasAttribute && el.hasAttribute("data-money")) {
      const f2 = enMoney(num(el.value));
      if (el.value !== f2) { el.value = f2; data[el.dataset.k] = f2; save(); }
    }
    // validate on blur once the user has interacted with the field
    const w = el.closest && el.closest(".fld");
    if (w && w.dataset.f && FIELD[w.dataset.f] && !empty(el.value)) {
      const fd = FIELD[w.dataset.f];
      if (shown(fd, data)) setErr(fd.id, fieldError(fd, data));
    }
  });

  function go(i) {
    visited.add(cur);
    cur = Math.max(0, Math.min(REVIEW, i));
    save();
    renderStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) { e.preventDefault(); go(+g.dataset.goto); }
  });

  $("#prevBtn").addEventListener("click", () => go(cur - 1));
  $("#nextBtn").addEventListener("click", () => {
    if (cur === REVIEW) return submit();
    visited.add(cur);
    const errs = showErrors(true);
    if (errs.length) { renderStepper(); toast(`${bn(errs.length)}টি ঘর পূরণ/সংশোধন প্রয়োজন`); return; }
    go(cur + 1);
  });

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("আপনার সংরক্ষিত খসড়া মুছে ফেলতে চান?")) return;
    store.del(U.DRAFT_KEY); location.reload();
  });

  // =====================================================================
  //  SUBMIT
  // =====================================================================
  const genId = () => {
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const r = new Uint32Array(6);
    (window.crypto || window.msCrypto).getRandomValues(r);
    return "UDY-26-" + [...r].map((x) => A[x % A.length]).join("");
  };

  let lastSub = null;
  function submit() {
    for (let i = 0; i < REVIEW; i++) {
      if (stepErrors(i).errs.length) {
        visited.add(i);
        toast(`"${val(STEPS[i].short, data)}" ধাপে কিছু তথ্য বাকি বা সঠিক নয়`);
        go(i);
        setTimeout(() => showErrors(true), 400);
        return;
      }
    }
    const id = genId(), at = new Date().toISOString(), d = eff();
    const clean = Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith("_")));
    const rec = { id, submittedAt: at, nameBn: d.name_bn, nameEn: d.name_en, district: d.prog_district, upazila: d.prog_upazila, data: clean };
    const list = store.get(U.SUBMISSIONS_KEY, []);
    if (!store.set(U.SUBMISSIONS_KEY, [...list, rec])) {
      const lite = { ...rec, data: { ...clean, photo: undefined, signature: undefined } };
      if (!store.set(U.SUBMISSIONS_KEY, [...list, lite])) store.set(U.SUBMISSIONS_KEY, [...list, { ...rec, data: undefined }]);
    }
    store.del(U.DRAFT_KEY);
    lastSub = { id, at, d };

    $("#app").hidden = true;
    $("#success").hidden = false;
    $("#trackId").textContent = id;
    $("#trackLink").href = "index.html?track=" + encodeURIComponent(id);
    $("#saveState span").textContent = "আবেদন সম্পন্ন";
    window.scrollTo({ top: 0 });
  }

  $("#copyId").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(lastSub.id); toast("ট্র্যাকিং নম্বর কপি হয়েছে"); }
    catch (e) { toast(lastSub.id); }
  });
  $("#printBtn").addEventListener("click", () => { buildPrint(lastSub); window.print(); });
  $("#newApp").addEventListener("click", () => location.reload());

  // =====================================================================
  //  PRINT — official paper-form layout
  // =====================================================================
  function buildPrint({ id, at, d }) {
    const V = (x) => esc(x ?? "");
    const row = (no, k, v) => `<tr><td class="n">${no}</td><td class="k">${k}</td><td class="v">${V(v)}</td></tr>`;
    const fv = (fid) => display(FIELD[fid], d);
    const addrTbl = (p) => `<table class="pd-table"><tr><th>বাড়ি/মহল্লার নং ও নাম</th><th>রোড নং/এলাকা/গ্রামের নাম</th><th>ডাকঘর ও পোস্ট কোড</th><th>থানা/উপজেলা</th><th>জেলা</th><th>বিভাগ</th></tr>
      <tr>${["house", "road", "post", "thana", "district", "division"].map((k) => `<td>${V(d[p + "_" + k])}</td>`).join("")}</tr></table>`;
    const m3 = (fid) => `<table class="pd-table" style="border:0"><tr><th>মাসিক</th><th>ত্রৈমাসিক</th><th>বার্ষিক</th></tr><tr>${["m", "q", "y"].map((s) => `<td>${num(d[fid + "_" + s]) ? V(taka(num(d[fid + "_" + s]))) : ""}</td>`).join("")}</tr></table>`;
    const m3row = (no, k, fid) => `<tr><td class="n">${no}</td><td class="k">${k}</td><td style="padding:0">${m3(fid)}</td></tr>`;
    const bar = (t, brk) => `<div class="pd-bar${brk ? " pd-break" : ""}">${t}</div>`;
    const yn = (k, extra) => V((d[k] || "") + (extra && d[extra] ? " — " + d[extra] : ""));

    let biz = "";
    if (d.biz_status === "new") {
      biz = bar("পার্ট-২: ব্যবসায়িক পরিকল্পনা সংক্রান্ত তথ্যাদি (ইতোপূর্বে ব্যবসা না থেকে থাকলে)", true) + `<table class="pd-table">
        ${row("০১", "ব্যবসায়িক ধারণা/উদ্যোগের সংক্ষিপ্ত বিবরণ (২০০ শব্দের মধ্যে)", d.p2_idea)}
        ${row("০২", "সম্ভাব্য ক্রেতা", d.p2_buyers)}
        ${row("০৩", "কত সময়ের মধ্যে ব্যবসায় শুরু করার পরিকল্পনা রয়েছে", d.p2_start)}
        ${row("০৪", "ব্যবসার ধরন (উৎপাদন / সেবা / ব্যবসা) ও বিবরণ", [d.p2_type, d.p2_type_desc].filter(Boolean).join(" — "))}
        ${row("০৫", "ব্যবসার সম্ভাব্য অবস্থান (গ্রাম/মহল্লা, ইউনিয়ন, উপজেলা)", d.p2_location)}
        ${row("০৬", "পণ্যের ধরন (আমদানির বিকল্প বা রপ্তানিযোগ্য পণ্য কিনা)", [d.p2_product, d.p2_product_desc].filter(Boolean).join(" — "))}
        ${row("০৭", "কাঁচামালের উৎস (প্রযোজ্য ক্ষেত্রে)", d.p2_raw)}
        ${row("০৮", "পণ্যের বাজার (স্থানীয়/আন্তর্জাতিক)", d.p2_market)}
        ${m3row("০৯", "সম্ভাব্য বিক্রয়ের পরিমাণ (টাকায়)", "p2_sales")}
        ${m3row("১০", "সম্ভাব্য লাভ/মুনাফা (টাকায়)", "p2_profit")}
        ${row("১১", "ব্যবসা পরিচালনার ক্ষেত্রে সম্ভাব্য সমস্যাসমূহ, ঝুঁকিসমূহ এবং ঝুঁকিসমূহ মোকাবেলায় পরিকল্পনা", d.p2_risk)}
        ${row("১২", "প্রথম বছরে সম্ভাব্য কর্মসংস্থান", fv("p2_emp"))}
        ${row("১৩", "যে পণ্য/সেবা বিক্রয় করা হবে, বর্তমানে বাজারে তার অবস্থান কেমন (কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ)", d.p2_competition)}
      </table>`;
    } else {
      biz = bar("পার্ট-৩: ব্যবসা সম্পর্কিত তথ্যাবলি (বর্তমানে কোন ব্যবসা পরিচালনা করে থাকলে)", true) + `<table class="pd-table">
        ${row("০১", "ব্যবসা প্রতিষ্ঠানের নাম", d.p3_name)}
        ${row("০২", "ব্যবসার ধরন (উৎপাদন / সেবা / ব্যবসা) ও বিবরণ", [d.p3_type, d.p3_type_desc].filter(Boolean).join(" — "))}
        ${row("০৩", "ব্যবসা শুরুর তারিখ", bnDate(d.p3_start))}
        ${row("০৪", "ট্রেড লাইসেন্স আছে কিনা (হ্যাঁ/না) এবং থাকলে ইস্যুর তারিখ ও নম্বর", [d.p3_license, d.p3_license === "হ্যাঁ" ? d.p3_license_info : ""].filter(Boolean).join(" — "))}
        ${row("০৫", "পণ্য/সেবার গড় বিক্রয়মূল্য (একক প্রতি)", d.p3_price)}
        ${m3row("০৬", "বিক্রয়ের পরিমাণ (টাকায়)", "p3_sales")}
        ${m3row("০৭", "লাভ/মুনাফার পরিমাণ (টাকায়)", "p3_profit")}
        ${row("০৮", "কাঁচামাল ও ব্যবসা পরিচালনা বাবদ বিভিন্ন খাতে মাসিক সম্ভাব্য খরচ (টাকা)", d.p3_cost)}
        ${row("০৯", "উদ্যোক্তা কীভাবে আলোচ্য ব্যবসায়ের সঙ্গে জড়িত হয়েছেন", d.p3_involve)}
        ${row("১০", "ব্যবসার সঙ্গে সম্পর্কিত মোট বিনিয়োগের পরিমাণ (টাকা)", fv("p3_invest"))}
        ${row("১১", "কাঁচামালের উৎস (প্রযোজ্য ক্ষেত্রে)", d.p3_raw)}
        ${row("১২", "পণ্য/সেবা বিপণন এলাকা", d.p3_area)}
        ${row("১৩", "যে পণ্য/সেবা বিক্রয় করা হয়, বর্তমানে বাজারে তার অবস্থান (কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ)", d.p3_competition)}
        ${row("১৪", "বিদ্যমান ব্যবসায় পরিচালনায় সমস্যাসমূহ, ঝুঁকিসমূহ এবং ঝুঁকিসমূহ মোকাবেলায় পরিকল্পনা", d.p3_risk)}
        ${row("১৫", "কর্মীর সংখ্যা", fv("p3_emp"))}
        ${row("১৬", "চলমান ব্যবসায় সম্প্রসারণসহ কর্মী বাড়ানোর কোনো পরিকল্পনা রয়েছে কিনা; থাকলে বিবরণ", d.p3_expand)}
      </table>`;
    }

    const budRows = BUDGET.map((h, i) => {
      const k = "b" + (i + 1);
      return `<tr><td class="n">${bn(String(i + 1).padStart(2, "0"))}</td><td>${h}</td><td>${V(d[k + "_d"])}</td><td>${num(d[k + "_a"]) ? V(taka(num(d[k + "_a"]))) : ""}</td><td>${V(d[k + "_s"])}</td></tr>`;
    }).join("");

    $("#printDoc").innerHTML = `
      <div class="pd-head"><img src="assets/udyog-mark.png" alt=""><div>
        <h1>উদ্যোগ (UDYOG)</h1><h2>উপজেলাভিত্তিক তরুণ উদ্যোক্তা অনুসন্ধান, চিহ্নিতকরণ ও অর্থায়ন কর্মসূচি</h2>
        <p>এসএমই এন্ড স্পেশাল প্রোগ্রামস্ ডিপার্টমেন্ট, বাংলাদেশ ব্যাংক।</p></div></div>
      <div class="pd-title"><b>আবেদন ফরম</b><small>(আবেদন জমাদানের সর্বশেষ তারিখ ১৫ অক্টোবর ২০২৬) · অনলাইনে পূরণকৃত: ${V(bnDate(at))}</small></div>

      <div class="pd-top"><table class="pd-table">
          <tr><th colspan="2" style="text-align:center">ব্যাংক শাখায় ব্যবহারের জন্য</th></tr>
          <tr><td class="k">ট্র্যাকিং নম্বর:</td><td><b>${V(id)}</b></td></tr>
          <tr><td class="k">আবেদন গ্রহণকারী ব্যাংক ও শাখা:</td><td>${V(d.bank_branch)}</td></tr>
          <tr><td class="k">গ্রহণের তারিখ:</td><td>&nbsp;</td></tr>
          <tr><td class="k">জেলা:</td><td>${V(d.prog_district)}</td></tr>
          <tr><td class="k">উপজেলা:</td><td>${V(d.prog_upazila)}</td></tr>
          <tr><td class="k">শাখা ব্যবস্থাপকের নাম:</td><td>&nbsp;</td></tr>
          <tr><td class="k" style="height:18mm">স্বাক্ষর ও সীল:</td><td>&nbsp;</td></tr>
        </table>
        <div class="pd-photo">${d.photo ? `<img src="${d.photo}" alt="">` : "পাসপোর্ট সাইজ ছবি<br>(২ কপি)"}</div></div>

      ${bar("পার্ট-১: ব্যক্তিগত তথ্যাবলি")}
      <table class="pd-table">
        ${row("০১", "আবেদনকারীর নাম (বাংলায়)", d.name_bn)}
        ${row("", "In English (Block Letters)", (d.name_en || "").toUpperCase())}
        ${row("০২", "পিতার নাম", d.father)}
        ${row("০৩", "মাতার নাম", d.mother)}
        ${row("০৪", "জাতীয় পরিচয়পত্র নম্বর", d.nid)}
        ${row("০৫", "জন্ম তারিখ ও আবেদনের শেষ তারিখে বয়স", d.dob ? `${bnDate(d.dob)} · ${bn(ageOn(d.dob, PROGRAM.ageRefDate))} বছর` : "")}
        ${row("০৬", "বৈবাহিক অবস্থা", d.marital)}
        ${row("০৭", "(বিবাহিত হলে) স্বামী/স্ত্রীর নাম ও জাতীয় পরিচয়পত্র নম্বর", d.marital === "বিবাহিত" ? [d.spouse_name, d.spouse_nid].filter(Boolean).join(" · ") : "")}
        ${row("০৮", "শিক্ষাগত যোগ্যতা (সর্বশেষ পাসকৃত পরীক্ষা, বোর্ড/বিশ্ববিদ্যালয় ও সাল)", d.education)}
        ${row("০৯", "ফোন নম্বর / বিকল্প ফোন নম্বর", [d.phone, d.phone_alt].filter(Boolean).join(" / "))}
        ${row("১০", "ই-মেইল আইডি", d.email)}
        ${row("১১", "দক্ষতা উন্নয়নমূলক কোনরূপ প্রশিক্ষণ থাকলে তার বিবরণ", d.training)}
        ${row("১২", "ব্যবসা/চাকরির অভিজ্ঞতা থাকলে তার বিবরণ", d.experience)}
        ${row("১৩", "ব্যাংক হিসাব থাকলে ব্যাংক হিসাবের তথ্য (ব্যাংকের নাম ও শাখা, হিসাবের ধরণ, হিসাব নম্বর)", d.bank_has === "হ্যাঁ" ? [d.acc_bank, d.acc_type, d.acc_no].filter(Boolean).join(", ") : d.bank_has)}
        ${row("১৪", "কোনো ব্যাংক/আর্থিক প্রতিষ্ঠানে বিদ্যমান ঋণ আছে কিনা (হ্যাঁ/না); থাকলে বিবরণ", [d.loan_has, d.loan_has === "হ্যাঁ" ? d.loan_details : ""].filter(Boolean).join(" — "))}
      </table>
      <div class="pd-h3">১৫. বর্তমান ঠিকানা (জাতীয় পরিচয়পত্র মোতাবেক)</div>${addrTbl("pres")}
      <div class="pd-h3">১৬. স্থায়ী ঠিকানা</div>${addrTbl("perm")}

      ${biz}

      ${bar("পার্ট-৪: অর্থায়ন পরিকল্পনা ও ব্যয় বিভাজন", true)}
      <div class="pd-h3">ক. অর্থায়ন প্যাকেজ</div>
      <table class="pd-table"><tr><th>বিবরণ</th><th>পরিমাণ (টাকা)</th></tr>
        <tr><td>০১. প্রয়োজনীয় মোট মূলধনের পরিমাণ</td><td>${V(fv("fin_total"))}</td></tr>
        <tr><td>০২. নিজস্ব বিনিয়োগ (যদি থাকে)</td><td>${V(fv("fin_own"))}</td></tr>
        <tr><td>০৩. আবেদনকৃত অর্থায়নের পরিমাণ</td><td>${V(fv("fin_req"))}</td></tr></table>
      <div class="pd-h3">খ. খাতভিত্তিক ব্যয় বিভাজন</div>
      <table class="pd-table"><tr><th>ক্রম</th><th>ব্যয়ের খাত</th><th>বিবরণ</th><th>মোট (টাকা)</th><th>অর্থের উৎস</th></tr>${budRows}
        <tr><th colspan="3" style="text-align:center">সর্বমোট</th><th colspan="2">${V(taka(CUSTOM.budget.total(d)))}</th></tr></table>

      ${bar("পার্ট-৫: অন্যান্য তথ্য")}
      <table class="pd-table">
        <tr><td class="n">০১</td><td class="k">শারীরিক প্রতিবন্ধকতা আছে কিনা (হ্যাঁ / না); থাকলে ধরন</td><td>${yn("disability", d.disability === "হ্যাঁ" ? "disability_type" : null)}</td></tr>
        <tr><td class="n">০২</td><td class="k">ক্ষুদ্র নৃগোষ্ঠীভুক্ত কিনা (হ্যাঁ / না)</td><td>${V(d.ethnic)}</td></tr>
        <tr><td class="n">০৩</td><td class="k">অন্যান্য</td><td class="v">${V(d.other_info)}</td></tr></table>

      <div class="pd-h3" style="margin-top:14px">ঘোষণা</div>
      <div class="pd-decl"><p>আমি এই মর্মে ঘোষণা করছি যে, উপরে প্রদত্ত সমস্ত তথ্য সত্য ও সঠিক। কোনো তথ্য অসত্য প্রমাণিত হলে আমার আবেদন/অনুমোদন যেকোনো পর্যায়ে বাতিলযোগ্য হবে।</p>
        <p>আমি অবগত আছি যে অনুমোদিত হলে, প্রাপ্ত ঋণ ও অনুদান নির্ধারিত খাতে ব্যবহৃত হলে এবং ঋণ অংশ সম্পূর্ণ ও যথাসময়ে পরিশোধ করলেই কেবল অনুদানের প্রাপ্ত অর্থ অনুদান হিসেবে বিবেচিত হবে এবং ঋণের সদ্ব্যবহার না করা হলে অনুদান অংশ ঋণে পরিণত হবে এবং সম্পূর্ণ অর্থ ঋণ হিসেবে গণ্য হয়ে আমি খেলাপি হিসেবে চিহ্নিত হব। আমি অঙ্গীকার করছি যে প্রদানকৃত অর্থ ব্যক্তিগত ভোগ, জমি বা যানবাহন ক্রয়ে ব্যবহার করব না; প্রতিটি ব্যয়ের ভাউচার সংরক্ষণ করব এবং চাহিদামতো প্রতিবেদন দাখিল করব।</p></div>
      <div class="pd-sig"><div>${d.signature ? `<img src="${d.signature}" alt="">` : ""}<div class="line">আবেদনকারীর স্বাক্ষর ও তারিখ: ${V(bnDate(at))}</div></div></div>

      <div class="pd-h3" style="margin-top:14px">সংযুক্তি (আবেদনের সঙ্গে দাখিলযোগ্য)</div>
      <ul style="margin:0;padding-left:18px;font-size:10pt">
        ${DOCS.map((doc) => `<li>${doc.t}${doc.req ? "" : " (যদি থাকে)"} ${d[doc.id] ? "— ☑ " + V(d[doc.id].name) : "— ☐"}</li>`).join("")}
      </ul>
      <div class="pd-foot">উদ্যোগ (UDYOG): উপজেলাভিত্তিক তরুণ উদ্যোক্তা অনুসন্ধান, চিহ্নিতকরণ ও অর্থায়ন কর্মসূচি · ট্র্যাকিং নম্বর ${V(id)}</div>`;
  }

  // ---------- boot ----------
  renderStep();
})();
