// Programme constants — SMESPD Circular No. 05 (13 Sep 2026), Bangladesh Bank
export const PROGRAM = {
  deadline: new Date("2026-10-15T23:59:59+06:00"),
  ageRefDate: new Date(2026, 9, 15),
  maxAge: 28,
  minAge: 18,
  maxFinance: 2_000_000, // ৳20 lakh blended financing
  loanShare: 0.5,
  rates: { startup: 4, women: 5, cmsme: 7 }
} as const;

export interface District {
  id: string;
  bn: string;
  en: string;
  division: string;
  color: string;
  upazilas: string[];
}

// Phase-1 coverage: 8 districts (one per division), 64 upazilas
export const DISTRICTS: District[] = [
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

export const DIVISIONS = ["ঢাকা", "চট্টগ্রাম", "রাজশাহী", "খুলনা", "বরিশাল", "সিলেট", "রংপুর", "ময়মনসিংহ"];

// Application lifecycle (circular §11.4, §12, §13)
export const STATUSES = [
  { key: "submitted", bn: "অনলাইনে জমা হয়েছে", hint: "প্রিন্ট করা আবেদনপত্র সংযুক্তিসহ ব্যাংক শাখায় জমা দিন" },
  { key: "branch_received", bn: "ব্যাংক শাখায় গৃহীত", hint: "শাখা কর্তৃক যাচাই চলছে" },
  { key: "upazila_lead", bn: "উপজেলা লীড ব্যাংকে প্রেরিত", hint: "শেষ তারিখের পরবর্তী কার্যদিবসে" },
  { key: "district_lead", bn: "জেলা লীড ব্যাংকে প্রেরিত", hint: "জেলার সকল আবেদন সমন্বয়" },
  { key: "shortlisted", bn: "বাছাই কমিটিতে মূল্যায়ন", hint: "ব্যবসায়িক ধারণা, বাজার, আর্থিক পরিকল্পনা ও সক্ষমতা" },
  { key: "approved", bn: "ঋণ অনুমোদিত", hint: "মনোনয়নের পর ১৫ কার্যদিবসের মধ্যে" },
  { key: "disbursed", bn: "ঋণ ও অনুদান বিতরণ", hint: "উদ্যোক্তার ব্যাংক হিসাবে" }
] as const;
export const REJECTED = { key: "rejected", bn: "আবেদন বিবেচিত হয়নি", hint: "বিস্তারিত জানতে সংশ্লিষ্ট শাখায় যোগাযোগ করুন" } as const;
export type StatusKey = (typeof STATUSES)[number]["key"] | "rejected";
export const STATUS_KEYS: StatusKey[] = [...STATUSES.map((s) => s.key), "rejected"];
export const statusLabel = (k: string) => (k === "rejected" ? REJECTED.bn : STATUSES.find((s) => s.key === k)?.bn ?? k);
