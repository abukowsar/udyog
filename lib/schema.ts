/**
 * Form schema for the UDYOG application — mirrors the official 7-page paper form.
 * Pure data + validators: shared by the browser form and the API route (server-side validation).
 */
import { DISTRICTS, DIVISIONS, PROGRAM } from "./constants";
import { ageOn, bn, bnDate, isBlank, num, taka, toEnDigits, words } from "./format";

export type Data = Record<string, any>;
type Fn<T> = T | ((d: Data) => T);
export const val = <T,>(x: Fn<T>, d: Data): T => (typeof x === "function" ? (x as (d: Data) => T)(d) : x);

export type FieldType =
  | "text" | "tel" | "email" | "date" | "money" | "textarea" | "select"
  | "pills" | "cards" | "check" | "money3" | "count2" | "note";

export interface CardOption { v: string; t: string; d: string; icon: string }

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  no?: string;
  req?: boolean;
  reqMsg?: string;
  full?: boolean;
  hint?: string;
  en?: string;
  cls?: string;
  inputMode?: "numeric" | "text" | "tel" | "email";
  ac?: string;
  placeholder?: Fn<string>;
  options?: Fn<string[]> | CardOption[];
  when?: (d: Data) => boolean;
  validate?: (v: any, d: Data) => string;
  words?: number;
  tall?: boolean;
  extra?: boolean;
  text?: Fn<string>;
  tone?: "info" | "warn";
  max?: string;
  aria?: string;
}

export type CustomKind = "finsummary" | "budget" | "uploads" | "signature" | "review";
export type BlockKind = "intro" | "needStatus" | "declText";

export interface Section {
  title?: string;
  desc?: string;
  when?: (d: Data) => boolean;
  fields?: Field[];
  custom?: CustomKind;
  block?: BlockKind;
}

export interface Step {
  key: string;
  short: Fn<string>;
  en: string;
  part: Fn<string>;
  title: Fn<string>;
  desc: Fn<string>;
  sections: Section[];
}

// ---------- validators ----------
const digits = (v: unknown) => toEnDigits(v).replace(/[\s-]/g, "");
export const vNid = (v: string) => (/^(\d{10}|\d{13}|\d{17})$/.test(digits(v)) ? "" : "সঠিক এনআইডি নম্বর দিন (১০, ১৩ বা ১৭ অঙ্ক)");
export const vPhone = (v: string) => (/^(\+?88)?01[3-9]\d{8}$/.test(digits(v)) ? "" : "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");
export const vEmail = (v: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "সঠিক ই-মেইল ঠিকানা দিন");
export const vAge = (v: string) => {
  const a = ageOn(v, PROGRAM.ageRefDate);
  if (a === null) return "সঠিক তারিখ দিন";
  if (a < PROGRAM.minAge) return "আবেদনকারীকে প্রাপ্তবয়স্ক (১৮+) হতে হবে";
  if (a > PROGRAM.maxAge) return "আবেদনের শেষ তারিখে বয়স সর্বোচ্চ ২৮ বছর হতে হবে";
  return "";
};

// ---------- option lists ----------
export const YESNO = ["হ্যাঁ", "না"];
export const BIZ_TYPES = ["উৎপাদন", "সেবা", "ব্যবসা"];
export const SOURCES = ["ব্যাংক ঋণ", "অনুদান", "নিজস্ব বিনিয়োগ", "অন্যান্য"];
export const BUDGET = [
  "যন্ত্রপাতি ও সরঞ্জাম ক্রয়", "কাঁচামাল ও উপকরণ", "পরিচলন ব্যয়", "প্রোটোটাইপ/নমুনা উন্নয়ন",
  "প্যাকেজিং, লেবেল ও ব্র্যান্ডিং", "ব্যবসা নিবন্ধন, লাইসেন্স ও ছাড়পত্র", "বিপণন ও প্রচার", "কর্মীর মজুরি",
  "পরিবহন ও সরবরাহ", "প্রযুক্তি, সফটওয়্যার ও ইন্টারনেট", "প্রশিক্ষণ ও দক্ষতা উন্নয়ন", "অন্যান্য (উল্লেখ করুন)"
];
export const DOCS = [
  { id: "doc_nid", t: "জাতীয় পরিচয়পত্র / জন্মনিবন্ধন সনদ", req: true },
  { id: "doc_edu", t: "সর্বশেষ শিক্ষাগত যোগ্যতার সনদ", req: false },
  { id: "doc_training", t: "দক্ষতা/উদ্যোক্তা উন্নয়ন প্রশিক্ষণ সনদ", req: false },
  { id: "doc_citizen", t: "ওয়ার্ড কমিশনার/কাউন্সিলর প্রদত্ত নাগরিক সনদ", req: true }
];
export const ADDR_KEYS = ["house", "road", "post", "thana", "district", "division"] as const;

export const isNew = (d: Data) => d.biz_status === "new";
export const isExisting = (d: Data) => d.biz_status === "existing";
const yes = (k: string) => (d: Data) => d[k] === "হ্যাঁ";
const f = (id: string, label: string, type: FieldType, o: Partial<Field> = {}): Field => ({ id, label, type, ...o });
const todayISO = () => new Date().toISOString().slice(0, 10);

const addr = (p: string, when?: (d: Data) => boolean): Field[] => [
  f(p + "_house", "বাড়ি/মহল্লার নং ও নাম", "text", { req: true, when }),
  f(p + "_road", "রোড নং/এলাকা/গ্রামের নাম", "text", { req: true, when }),
  f(p + "_post", "ডাকঘর ও পোস্ট কোড", "text", { req: true, when }),
  f(p + "_thana", "থানা/উপজেলা", "text", { req: true, when }),
  f(p + "_district", "জেলা", "text", { req: true, when }),
  f(p + "_division", "বিভাগ", "select", { req: true, when, options: DIVISIONS })
];

export const upazilasOf = (district?: string) => DISTRICTS.find((x) => x.bn === district)?.upazilas ?? [];

// =====================================================================
export const STEPS: Step[] = [
  {
    key: "start", short: "শুরু", en: "Get started", part: "প্রারম্ভিক তথ্য",
    title: "আবেদন শুরু করুন",
    desc: "আপনার উপজেলা ও উদ্যোগের অবস্থা নির্বাচন করুন — সে অনুযায়ী ফরমের প্রযোজ্য অংশ দেখানো হবে।",
    sections: [
      { block: "intro" },
      {
        title: "কর্মসূচি এলাকা", desc: "যে উপজেলার স্থায়ী বাসিন্দা হিসেবে আবেদন করছেন",
        fields: [
          f("prog_district", "জেলা", "select", { req: true, options: () => DISTRICTS.map((d) => d.bn) }),
          f("prog_upazila", "উপজেলা", "select", {
            req: true, options: (d) => upazilasOf(d.prog_district),
            placeholder: (d) => (d.prog_district ? "উপজেলা নির্বাচন করুন" : "আগে জেলা নির্বাচন করুন"),
            validate: (v, d) => (upazilasOf(d.prog_district).includes(v) ? "" : "তালিকা থেকে উপজেলা নির্বাচন করুন")
          }),
          f("bank_branch", "আবেদন জমা দেওয়ার ব্যাংক ও শাখা", "text", {
            full: true, placeholder: "যেমন: সোনালী ব্যাংক পিএলসি, সিংগাইর শাখা",
            hint: "ঐচ্ছিক — উপজেলায় অবস্থিত যেকোনো তফসিলি ব্যাংকের শাখা। সেখানে পূর্ব থেকে হিসাব থাকা আবশ্যক নয়।"
          })
        ]
      },
      {
        title: "আপনার উদ্যোগের অবস্থা",
        fields: [
          f("biz_status", "", "cards", {
            req: true, full: true, reqMsg: "যেকোনো একটি নির্বাচন করুন", aria: "উদ্যোগের অবস্থা",
            options: [
              { v: "new", t: "নতুন ব্যবসায়িক ধারণা", d: "এখনো ব্যবসা শুরু করিনি — ফরমের পার্ট-২ প্রযোজ্য", icon: "bulb" },
              { v: "existing", t: "চলমান ব্যবসা", d: "বর্তমানে ব্যবসা পরিচালনা করছি — ফরমের পার্ট-৩ প্রযোজ্য", icon: "store" }
            ]
          })
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
          f("name_en", "আবেদনকারীর নাম (ইংরেজিতে)", "text", {
            no: "০১", req: true, en: "Block Letters", cls: "upper", ac: "name",
            validate: (v) => (/^[A-Za-z .'-]+$/.test(v) ? "" : "শুধু ইংরেজি অক্ষরে লিখুন")
          }),
          f("father", "পিতার নাম", "text", { no: "০২", req: true }),
          f("mother", "মাতার নাম", "text", { no: "০৩", req: true }),
          f("nid", "জাতীয় পরিচয়পত্র নম্বর", "text", { no: "০৪", req: true, cls: "mono", inputMode: "numeric", validate: vNid, hint: "১০, ১৩ বা ১৭ অঙ্কের নম্বর" }),
          f("dob", "জন্ম তারিখ", "date", { no: "০৫", req: true, validate: vAge, extra: true }),
          f("marital", "বৈবাহিক অবস্থা", "select", { no: "০৬", req: true, options: ["অবিবাহিত", "বিবাহিত", "তালাকপ্রাপ্ত", "বিধবা/বিপত্নীক"] }),
          f("gender", "লিঙ্গ", "pills", { options: ["পুরুষ", "নারী", "তৃতীয় লিঙ্গ"], hint: "নারী উদ্যোক্তাদের ক্ষেত্রে সুদ/মুনাফার হার সর্বোচ্চ ৫%" }),
          f("spouse_name", "স্বামী/স্ত্রীর নাম", "text", { no: "০৭", req: true, when: (d) => d.marital === "বিবাহিত" }),
          f("spouse_nid", "স্বামী/স্ত্রীর জাতীয় পরিচয়পত্র নম্বর", "text", { no: "০৭", cls: "mono", inputMode: "numeric", when: (d) => d.marital === "বিবাহিত", validate: vNid }),
          f("education", "শিক্ষাগত যোগ্যতা", "text", {
            no: "০৮", req: true, full: true,
            placeholder: "যেমন: বিবিএ, জাতীয় বিশ্ববিদ্যালয়, ২০২৩", hint: "সর্বশেষ পাসকৃত পরীক্ষা, বোর্ড/বিশ্ববিদ্যালয় ও সাল"
          })
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
          f("training", "দক্ষতা উন্নয়নমূলক প্রশিক্ষণ (যদি থাকে)", "textarea", { no: "১১", full: true, hint: "প্রতিষ্ঠান, কোর্সের নাম, মেয়াদ ও সাল; সনদের কপি সংযুক্ত করুন" }),
          f("experience", "ব্যবসা/চাকরির অভিজ্ঞতা (যদি থাকে)", "textarea", { no: "১২", full: true }),
          f("bank_has", "আপনার কি ব্যাংক হিসাব আছে?", "pills", { no: "১৩", full: true, options: YESNO }),
          f("acc_bank", "ব্যাংকের নাম ও শাখা", "text", { req: true, when: yes("bank_has") }),
          f("acc_type", "হিসাবের ধরণ", "select", { when: yes("bank_has"), options: ["সঞ্চয়ী", "চলতি", "স্টুডেন্ট", "কৃষক/১০ টাকার হিসাব", "অন্যান্য"] }),
          f("acc_no", "হিসাব নম্বর", "text", { full: true, cls: "mono", when: yes("bank_has") }),
          f("loan_has", "কোনো ব্যাংক/আর্থিক প্রতিষ্ঠানে বিদ্যমান ঋণ আছে কি?", "pills", { no: "১৪", req: true, full: true, options: YESNO }),
          f("loan_details", "ঋণের বিবরণ", "textarea", { req: true, full: true, when: yes("loan_has"), hint: "প্রতিষ্ঠানের নাম, ঋণের ধরন, পরিমাণ ও বর্তমান অবস্থা" }),
          f("loan_warn", "", "note", {
            tone: "warn", when: yes("loan_has"),
            text: "নীতিমালা অনুযায়ী, ইতোপূর্বে ব্যবসায়িক কার্যক্রমের জন্য ব্যাংক/আর্থিক প্রতিষ্ঠান থেকে ঋণ গ্রহণকারী এবং ঋণখেলাপি ব্যক্তি এ কর্মসূচির আওতায় বিবেচিত হবেন না। সিআইবি যাচাই করা হবে।"
          })
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
          f("perm_note", "", "note", {
            tone: "info",
            text: (d) => `কর্মসূচির শর্ত অনুযায়ী আবেদনকারীকে সংশ্লিষ্ট উপজেলার স্থায়ী বাসিন্দা হতে হবে${d.prog_upazila ? ` (নির্বাচিত: ${d.prog_upazila}, ${d.prog_district})` : ""}। প্রমাণক হিসেবে নাগরিক সনদ দাখিল করতে হবে।`
          })
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
      { when: (d) => !d.biz_status, block: "needStatus" },
      // ----- Part 2: new business idea -----
      {
        when: isNew, title: "ব্যবসায়িক ধারণা",
        fields: [
          f("p2_idea", "ব্যবসায়িক ধারণা/উদ্যোগের সংক্ষিপ্ত বিবরণ", "textarea", {
            no: "০১", req: true, full: true, tall: true, words: 200,
            placeholder: "আপনার পণ্য/সেবা কী, কোন সমস্যার সমাধান করবে, কীভাবে আয় হবে…"
          }),
          f("p2_buyers", "সম্ভাব্য ক্রেতা", "text", { no: "০২", req: true, full: true }),
          f("p2_start", "কত সময়ের মধ্যে ব্যবসা শুরু করার পরিকল্পনা", "select", {
            no: "০৩", req: true, options: ["অর্থায়ন প্রাপ্তির সাথে সাথে", "১ মাসের মধ্যে", "৩ মাসের মধ্যে", "৬ মাসের মধ্যে", "১ বছরের মধ্যে"]
          }),
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
          f("p2_competition", "পণ্য/সেবার বর্তমান বাজার অবস্থান", "textarea", {
            no: "১৩", req: true, full: true, tall: true, hint: "কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ"
          })
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
          f("p3_competition", "পণ্য/সেবার বর্তমান বাজার অবস্থান", "textarea", {
            no: "১৩", req: true, full: true, tall: true, hint: "কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ"
          }),
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
          f("fin_req", "আবেদনকৃত অর্থায়নের পরিমাণ", "money", {
            no: "০৩", req: true, full: true,
            hint: "স্বয়ংক্রিয় হিসাব: মোট মূলধন − নিজস্ব বিনিয়োগ (সর্বোচ্চ ২০ লক্ষ)। প্রয়োজনে কম পরিমাণ লিখতে পারেন।",
            validate: (v, d) => {
              const R = num(v), T = num(d.fin_total), O = num(d.fin_own);
              if (R <= 0) return "আবেদনকৃত পরিমাণ দিন";
              if (R > PROGRAM.maxFinance) return "সর্বোচ্চ ২০ লক্ষ টাকা পর্যন্ত আবেদন করা যাবে";
              if (T && R > T - O) return "মোট মূলধন থেকে নিজস্ব বিনিয়োগ বাদ দিয়ে যা থাকে তার বেশি হতে পারবে না";
              return "";
            }
          })
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
      { block: "declText" },
      {
        fields: [
          f("decl_1", "", "check", { req: true, full: true, reqMsg: "সম্মতি প্রদান আবশ্যক", text: "আমি ঘোষণা করছি যে প্রদত্ত সকল তথ্য সত্য ও সঠিক।" }),
          f("decl_2", "", "check", { req: true, full: true, reqMsg: "সম্মতি প্রদান আবশ্যক", text: "আমি ঋণ ও অনুদান ব্যবহারের শর্তাবলি সম্পর্কে অবগত এবং তা মেনে চলার অঙ্গীকার করছি।" })
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

export const REVIEW = STEPS.length - 1;
export const FIELD: Record<string, Field> = {};
STEPS.forEach((s) => s.sections.forEach((sec) => sec.fields?.forEach((fd) => (FIELD[fd.id] = fd))));

export const DECLARATION = [
  "আমি এই মর্মে ঘোষণা করছি যে, উপরে প্রদত্ত সমস্ত তথ্য সত্য ও সঠিক। কোনো তথ্য অসত্য প্রমাণিত হলে আমার আবেদন/অনুমোদন যেকোনো পর্যায়ে বাতিলযোগ্য হবে।",
  "আমি অবগত আছি যে অনুমোদিত হলে, প্রাপ্ত ঋণ ও অনুদান নির্ধারিত খাতে ব্যবহৃত হলে এবং ঋণ অংশ সম্পূর্ণ ও যথাসময়ে পরিশোধ করলেই কেবল অনুদানের প্রাপ্ত অর্থ অনুদান হিসেবে বিবেচিত হবে এবং ঋণের সদ্ব্যবহার না করা হলে অনুদান অংশ ঋণে পরিণত হবে এবং সম্পূর্ণ অর্থ ঋণ হিসেবে গণ্য হয়ে আমি খেলাপি হিসেবে চিহ্নিত হব। আমি অঙ্গীকার করছি যে প্রদানকৃত অর্থ ব্যক্তিগত ভোগ, জমি বা যানবাহন ক্রয়ে ব্যবহার করব না; প্রতিটি ব্যয়ের ভাউচার সংরক্ষণ করব এবং চাহিদামতো প্রতিবেদন দাখিল করব।"
];

// =====================================================================
//  Validation
// =====================================================================
export const shown = (x: { when?: (d: Data) => boolean }, d: Data) => !x.when || x.when(d);

export const isEmptyField = (fd: Field, d: Data) => {
  if (fd.type === "money3") return isBlank(d[fd.id + "_m"]);
  if (fd.type === "count2") return isBlank(d[fd.id + "_t"]);
  if (fd.type === "check") return !d[fd.id];
  if (fd.type === "money") return num(d[fd.id]) <= 0;
  return isBlank(d[fd.id]);
};

export const fieldError = (fd: Field, d: Data): string => {
  if (fd.type === "note") return "";
  if (isEmptyField(fd, d)) return fd.req ? fd.reqMsg || "এই তথ্যটি আবশ্যক" : "";
  if (fd.words && words(d[fd.id]) > fd.words) return `সর্বোচ্চ ${bn(fd.words)} শব্দের মধ্যে লিখুন`;
  if (fd.type === "count2" && num(d[fd.id + "_w"]) > num(d[fd.id + "_t"])) return "নারী কর্মীর সংখ্যা মোট কর্মীর চেয়ে বেশি হতে পারে না";
  return fd.validate ? fd.validate(d[fd.id], d) : "";
};

export const budgetTotal = (d: Data) => BUDGET.reduce((s, _, i) => s + num(d[`b${i + 1}_a`]), 0);

const CUSTOM_VALIDATE: Partial<Record<CustomKind, (d: Data) => { errs: { id: string; msg: string }[]; total: number; filled: number }>> = {
  budget: (d) => {
    const t = budgetTotal(d);
    return { errs: t > 0 ? [] : [{ id: "budget", msg: "অন্তত একটি খাতে ব্যয়ের পরিমাণ দিন" }], total: 1, filled: t > 0 ? 1 : 0 };
  },
  signature: (d) => ({
    errs: d.signature ? [] : [{ id: "signature", msg: "স্বাক্ষর প্রদান আবশ্যক" }],
    total: 1, filled: d.signature ? 1 : 0
  })
};

export function stepErrors(i: number, d: Data) {
  const errs: { id: string; msg: string }[] = [];
  let total = 0, filled = 0;
  STEPS[i].sections.forEach((sec) => {
    if (!shown(sec, d)) return;
    sec.fields?.forEach((fd) => {
      if (!shown(fd, d) || fd.type === "note") return;
      if (fd.req) { total++; if (!isEmptyField(fd, d)) filled++; }
      const e = fieldError(fd, d);
      if (e) errs.push({ id: fd.id, msg: e });
    });
    const cv = sec.custom && CUSTOM_VALIDATE[sec.custom];
    if (cv) { const r = cv(d); errs.push(...r.errs); total += r.total; filled += r.filled; }
  });
  return { errs, total, filled };
}

export function allErrors(d: Data) {
  const out: { step: number; id: string; msg: string }[] = [];
  for (let i = 0; i < REVIEW; i++) stepErrors(i, d).errs.forEach((e) => out.push({ step: i, ...e }));
  return out;
}

// effective data: permanent address may mirror the present one
export const effective = (d: Data): Data => {
  const e = { ...d };
  if (d.perm_same) ADDR_KEYS.forEach((k) => (e["perm_" + k] = d["pres_" + k]));
  return e;
};

// Keys the server accepts — everything else is dropped.
export function allowedKeys(): Set<string> {
  const keys = new Set<string>(["photo", "signature", ...DOCS.map((x) => x.id)]);
  Object.values(FIELD).forEach((fd) => {
    if (fd.type === "note") return;
    if (fd.type === "money3") ["m", "q", "y"].forEach((s) => keys.add(`${fd.id}_${s}`));
    else if (fd.type === "count2") ["t", "w"].forEach((s) => keys.add(`${fd.id}_${s}`));
    else keys.add(fd.id);
  });
  BUDGET.forEach((_, i) => ["d", "a", "s"].forEach((s) => keys.add(`b${i + 1}_${s}`)));
  return keys;
}

// Human-readable value of a field (review screen, print, admin)
export function display(fd: Field, d: Data): string {
  switch (fd.type) {
    case "money": return num(d[fd.id]) ? taka(num(d[fd.id])) : "";
    case "money3":
      return isBlank(d[fd.id + "_m"]) ? "" :
        `মাসিক ${taka(num(d[fd.id + "_m"]))} · ত্রৈমাসিক ${taka(num(d[fd.id + "_q"]))} · বার্ষিক ${taka(num(d[fd.id + "_y"]))}`;
    case "count2": return isBlank(d[fd.id + "_t"]) ? "" : `মোট ${bn(num(d[fd.id + "_t"]))} জন, তন্মধ্যে নারী ${bn(num(d[fd.id + "_w"]))} জন`;
    case "date": return bnDate(d[fd.id]);
    case "check": return d[fd.id] ? (fd.req ? "সম্মত ✓" : "হ্যাঁ") : "";
    case "cards": return (fd.options as CardOption[]).find((o) => o.v === d[fd.id])?.t || "";
    default: return d[fd.id] ?? "";
  }
}
