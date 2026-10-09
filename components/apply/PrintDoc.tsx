import { PROGRAM } from "@/lib/constants";
import { ageOn, bn, bnDate, num, taka } from "@/lib/format";
import { ADDR_KEYS, BUDGET, DECLARATION, DOCS, FIELD, budgetTotal, display, type Data } from "@/lib/schema";

/** Print-only rendering that mirrors the official 7-page paper form. Hidden on screen via CSS. */
export function PrintDoc({ d, trackingId, at }: { d: Data; trackingId: string; at: string | Date }) {
  const fv = (id: string) => display(FIELD[id], d);
  const join = (...a: unknown[]) => a.filter(Boolean).join(" — ");
  const Row = ({ n, k, v }: { n: string; k: string; v?: string }) => (
    <tr><td className="n">{n}</td><td className="k">{k}</td><td className="v">{v}</td></tr>
  );
  const M3 = ({ n, k, id }: { n: string; k: string; id: string }) => (
    <tr><td className="n">{n}</td><td className="k">{k}</td><td style={{ padding: 0 }}>
      <table className="pd-table" style={{ border: 0 }}><tbody>
        <tr><th>মাসিক</th><th>ত্রৈমাসিক</th><th>বার্ষিক</th></tr>
        <tr>{["m", "q", "y"].map((s) => <td key={s}>{num(d[`${id}_${s}`]) ? taka(num(d[`${id}_${s}`])) : ""}</td>)}</tr>
      </tbody></table>
    </td></tr>
  );
  const Addr = ({ p }: { p: string }) => (
    <table className="pd-table"><tbody>
      <tr><th>বাড়ি/মহল্লার নং ও নাম</th><th>রোড নং/এলাকা/গ্রামের নাম</th><th>ডাকঘর ও পোস্ট কোড</th><th>থানা/উপজেলা</th><th>জেলা</th><th>বিভাগ</th></tr>
      <tr>{ADDR_KEYS.map((k) => <td key={k}>{d[`${p}_${k}`]}</td>)}</tr>
    </tbody></table>
  );
  const Bar = ({ t, brk }: { t: string; brk?: boolean }) => <div className={`pd-bar${brk ? " pd-break" : ""}`}>{t}</div>;
  const isNewBiz = d.biz_status === "new";
  const age = ageOn(d.dob, PROGRAM.ageRefDate);

  return (
    <div className="print-doc" aria-hidden="true">
      <div className="pd-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/udyog-mark.png" alt="" />
        <div>
          <h1>উদ্যোগ (UDYOG)</h1>
          <h2>উপজেলাভিত্তিক তরুণ উদ্যোক্তা অনুসন্ধান, চিহ্নিতকরণ ও অর্থায়ন কর্মসূচি</h2>
          <p>এসএমই এন্ড স্পেশাল প্রোগ্রামস্ ডিপার্টমেন্ট, বাংলাদেশ ব্যাংক।</p>
        </div>
      </div>
      <div className="pd-title"><b>আবেদন ফরম</b><small>(আবেদন জমাদানের সর্বশেষ তারিখ ১৫ অক্টোবর ২০২৬) · অনলাইনে জমা: {bnDate(at)}</small></div>

      <div className="pd-top">
        <table className="pd-table"><tbody>
          <tr><th colSpan={2} style={{ textAlign: "center" }}>ব্যাংক শাখায় ব্যবহারের জন্য</th></tr>
          <tr><td className="k">ট্র্যাকিং নম্বর:</td><td><b>{trackingId}</b></td></tr>
          <tr><td className="k">আবেদন গ্রহণকারী ব্যাংক ও শাখা:</td><td>{d.bank_branch}</td></tr>
          <tr><td className="k">গ্রহণের তারিখ:</td><td>&nbsp;</td></tr>
          <tr><td className="k">জেলা:</td><td>{d.prog_district}</td></tr>
          <tr><td className="k">উপজেলা:</td><td>{d.prog_upazila}</td></tr>
          <tr><td className="k">শাখা ব্যবস্থাপকের নাম:</td><td>&nbsp;</td></tr>
          <tr><td className="k" style={{ height: "18mm" }}>স্বাক্ষর ও সীল:</td><td>&nbsp;</td></tr>
        </tbody></table>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="pd-photo">{d.photo ? <img src={d.photo} alt="" /> : <span>পাসপোর্ট সাইজ ছবি<br />(২ কপি)</span>}</div>
      </div>

      <Bar t="পার্ট-১: ব্যক্তিগত তথ্যাবলি" />
      <table className="pd-table"><tbody>
        <Row n="০১" k="আবেদনকারীর নাম (বাংলায়)" v={d.name_bn} />
        <Row n="" k="In English (Block Letters)" v={String(d.name_en || "").toUpperCase()} />
        <Row n="০২" k="পিতার নাম" v={d.father} />
        <Row n="০৩" k="মাতার নাম" v={d.mother} />
        <Row n="০৪" k="জাতীয় পরিচয়পত্র নম্বর" v={d.nid} />
        <Row n="০৫" k="জন্ম তারিখ ও আবেদনের শেষ তারিখে বয়স" v={d.dob ? `${bnDate(d.dob)} · ${age === null ? "" : bn(age) + " বছর"}` : ""} />
        <Row n="০৬" k="বৈবাহিক অবস্থা" v={d.marital} />
        <Row n="০৭" k="(বিবাহিত হলে) স্বামী/স্ত্রীর নাম ও জাতীয় পরিচয়পত্র নম্বর" v={d.marital === "বিবাহিত" ? [d.spouse_name, d.spouse_nid].filter(Boolean).join(" · ") : ""} />
        <Row n="০৮" k="শিক্ষাগত যোগ্যতা (সর্বশেষ পাসকৃত পরীক্ষা, বোর্ড/বিশ্ববিদ্যালয় ও সাল)" v={d.education} />
        <Row n="০৯" k="ফোন নম্বর / বিকল্প ফোন নম্বর" v={[d.phone, d.phone_alt].filter(Boolean).join(" / ")} />
        <Row n="১০" k="ই-মেইল আইডি" v={d.email} />
        <Row n="১১" k="দক্ষতা উন্নয়নমূলক কোনরূপ প্রশিক্ষণ থাকলে তার বিবরণ" v={d.training} />
        <Row n="১২" k="ব্যবসা/চাকরির অভিজ্ঞতা থাকলে তার বিবরণ" v={d.experience} />
        <Row n="১৩" k="ব্যাংক হিসাব থাকলে ব্যাংক হিসাবের তথ্য (ব্যাংকের নাম ও শাখা, হিসাবের ধরণ, হিসাব নম্বর)" v={d.bank_has === "হ্যাঁ" ? [d.acc_bank, d.acc_type, d.acc_no].filter(Boolean).join(", ") : d.bank_has} />
        <Row n="১৪" k="কোনো ব্যাংক/আর্থিক প্রতিষ্ঠানে বিদ্যমান ঋণ আছে কিনা (হ্যাঁ/না); থাকলে বিবরণ" v={join(d.loan_has, d.loan_has === "হ্যাঁ" && d.loan_details)} />
      </tbody></table>
      <div className="pd-h3">১৫. বর্তমান ঠিকানা (জাতীয় পরিচয়পত্র মোতাবেক)</div><Addr p="pres" />
      <div className="pd-h3">১৬. স্থায়ী ঠিকানা</div><Addr p="perm" />

      {isNewBiz ? (
        <>
          <Bar t="পার্ট-২: ব্যবসায়িক পরিকল্পনা সংক্রান্ত তথ্যাদি (ইতোপূর্বে ব্যবসা না থেকে থাকলে)" brk />
          <table className="pd-table"><tbody>
            <Row n="০১" k="ব্যবসায়িক ধারণা/উদ্যোগের সংক্ষিপ্ত বিবরণ (২০০ শব্দের মধ্যে)" v={d.p2_idea} />
            <Row n="০২" k="সম্ভাব্য ক্রেতা" v={d.p2_buyers} />
            <Row n="০৩" k="কত সময়ের মধ্যে ব্যবসায় শুরু করার পরিকল্পনা রয়েছে" v={d.p2_start} />
            <Row n="০৪" k="ব্যবসার ধরন (উৎপাদন / সেবা / ব্যবসা) ও বিবরণ" v={join(d.p2_type, d.p2_type_desc)} />
            <Row n="০৫" k="ব্যবসার সম্ভাব্য অবস্থান (গ্রাম/মহল্লা, ইউনিয়ন, উপজেলা)" v={d.p2_location} />
            <Row n="০৬" k="পণ্যের ধরন (আমদানির বিকল্প বা রপ্তানিযোগ্য পণ্য কিনা)" v={join(d.p2_product, d.p2_product_desc)} />
            <Row n="০৭" k="কাঁচামালের উৎস (প্রযোজ্য ক্ষেত্রে)" v={d.p2_raw} />
            <Row n="০৮" k="পণ্যের বাজার (স্থানীয়/আন্তর্জাতিক)" v={d.p2_market} />
            <M3 n="০৯" k="সম্ভাব্য বিক্রয়ের পরিমাণ (টাকায়)" id="p2_sales" />
            <M3 n="১০" k="সম্ভাব্য লাভ/মুনাফা (টাকায়)" id="p2_profit" />
            <Row n="১১" k="ব্যবসা পরিচালনার ক্ষেত্রে সম্ভাব্য সমস্যাসমূহ, ঝুঁকিসমূহ এবং ঝুঁকিসমূহ মোকাবেলায় পরিকল্পনা" v={d.p2_risk} />
            <Row n="১২" k="প্রথম বছরে সম্ভাব্য কর্মসংস্থান" v={fv("p2_emp")} />
            <Row n="১৩" k="যে পণ্য/সেবা বিক্রয় করা হবে, বর্তমানে বাজারে তার অবস্থান কেমন (কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ)" v={d.p2_competition} />
          </tbody></table>
        </>
      ) : (
        <>
          <Bar t="পার্ট-৩: ব্যবসা সম্পর্কিত তথ্যাবলি (বর্তমানে কোন ব্যবসা পরিচালনা করে থাকলে)" brk />
          <table className="pd-table"><tbody>
            <Row n="০১" k="ব্যবসা প্রতিষ্ঠানের নাম" v={d.p3_name} />
            <Row n="০২" k="ব্যবসার ধরন (উৎপাদন / সেবা / ব্যবসা) ও বিবরণ" v={join(d.p3_type, d.p3_type_desc)} />
            <Row n="০৩" k="ব্যবসা শুরুর তারিখ" v={bnDate(d.p3_start)} />
            <Row n="০৪" k="ট্রেড লাইসেন্স আছে কিনা (হ্যাঁ/না) এবং থাকলে ইস্যুর তারিখ ও নম্বর" v={join(d.p3_license, d.p3_license === "হ্যাঁ" && d.p3_license_info)} />
            <Row n="০৫" k="পণ্য/সেবার গড় বিক্রয়মূল্য (একক প্রতি)" v={d.p3_price} />
            <M3 n="০৬" k="বিক্রয়ের পরিমাণ (টাকায়)" id="p3_sales" />
            <M3 n="০৭" k="লাভ/মুনাফার পরিমাণ (টাকায়)" id="p3_profit" />
            <Row n="০৮" k="কাঁচামাল ও ব্যবসা পরিচালনা বাবদ বিভিন্ন খাতে মাসিক সম্ভাব্য খরচ (টাকা)" v={d.p3_cost} />
            <Row n="০৯" k="উদ্যোক্তা কীভাবে আলোচ্য ব্যবসায়ের সঙ্গে জড়িত হয়েছেন" v={d.p3_involve} />
            <Row n="১০" k="ব্যবসার সঙ্গে সম্পর্কিত মোট বিনিয়োগের পরিমাণ (টাকা)" v={fv("p3_invest")} />
            <Row n="১১" k="কাঁচামালের উৎস (প্রযোজ্য ক্ষেত্রে)" v={d.p3_raw} />
            <Row n="১২" k="পণ্য/সেবা বিপণন এলাকা" v={d.p3_area} />
            <Row n="১৩" k="যে পণ্য/সেবা বিক্রয় করা হয়, বর্তমানে বাজারে তার অবস্থান (কমপক্ষে ৩টি সম্ভাব্য প্রতিযোগী প্রতিষ্ঠানের তথ্যসহ)" v={d.p3_competition} />
            <Row n="১৪" k="বিদ্যমান ব্যবসায় পরিচালনায় সমস্যাসমূহ, ঝুঁকিসমূহ এবং ঝুঁকিসমূহ মোকাবেলায় পরিকল্পনা" v={d.p3_risk} />
            <Row n="১৫" k="কর্মীর সংখ্যা" v={fv("p3_emp")} />
            <Row n="১৬" k="চলমান ব্যবসায় সম্প্রসারণসহ কর্মী বাড়ানোর কোনো পরিকল্পনা রয়েছে কিনা; থাকলে বিবরণ" v={d.p3_expand} />
          </tbody></table>
        </>
      )}

      <Bar t="পার্ট-৪: অর্থায়ন পরিকল্পনা ও ব্যয় বিভাজন" brk />
      <div className="pd-h3">ক. অর্থায়ন প্যাকেজ</div>
      <table className="pd-table"><tbody>
        <tr><th>বিবরণ</th><th>পরিমাণ (টাকা)</th></tr>
        <tr><td>০১. প্রয়োজনীয় মোট মূলধনের পরিমাণ</td><td>{fv("fin_total")}</td></tr>
        <tr><td>০২. নিজস্ব বিনিয়োগ (যদি থাকে)</td><td>{fv("fin_own")}</td></tr>
        <tr><td>০৩. আবেদনকৃত অর্থায়নের পরিমাণ</td><td>{fv("fin_req")}</td></tr>
      </tbody></table>
      <div className="pd-h3">খ. খাতভিত্তিক ব্যয় বিভাজন</div>
      <table className="pd-table"><tbody>
        <tr><th>ক্রম</th><th>ব্যয়ের খাত</th><th>বিবরণ</th><th>মোট (টাকা)</th><th>অর্থের উৎস</th></tr>
        {BUDGET.map((h, i) => {
          const k = `b${i + 1}`;
          return <tr key={k}><td className="n">{bn(String(i + 1).padStart(2, "0"))}</td><td>{h}</td><td>{d[`${k}_d`]}</td><td>{num(d[`${k}_a`]) ? taka(num(d[`${k}_a`])) : ""}</td><td>{d[`${k}_s`]}</td></tr>;
        })}
        <tr><th colSpan={3} style={{ textAlign: "center" }}>সর্বমোট</th><th colSpan={2}>{taka(budgetTotal(d))}</th></tr>
      </tbody></table>

      <Bar t="পার্ট-৫: অন্যান্য তথ্য" />
      <table className="pd-table"><tbody>
        <Row n="০১" k="শারীরিক প্রতিবন্ধকতা আছে কিনা (হ্যাঁ / না); থাকলে ধরন" v={join(d.disability, d.disability === "হ্যাঁ" && d.disability_type)} />
        <Row n="০২" k="ক্ষুদ্র নৃগোষ্ঠীভুক্ত কিনা (হ্যাঁ / না)" v={d.ethnic} />
        <Row n="০৩" k="অন্যান্য" v={d.other_info} />
      </tbody></table>

      <div className="pd-h3" style={{ marginTop: 14 }}>ঘোষণা</div>
      <div className="pd-decl">{DECLARATION.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}</div>
      <div className="pd-sig"><div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {d.signature && <img src={d.signature} alt="" />}
        <div className="line">আবেদনকারীর স্বাক্ষর ও তারিখ: {bnDate(at)}</div>
      </div></div>

      <div className="pd-h3" style={{ marginTop: 14 }}>সংযুক্তি (আবেদনের সঙ্গে দাখিলযোগ্য)</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: "10pt" }}>
        {DOCS.map((doc) => <li key={doc.id}>{doc.t}{doc.req ? "" : " (যদি থাকে)"} {d[doc.id] ? `— ☑ ${d[doc.id].name}` : "— ☐"}</li>)}
      </ul>
      <div className="pd-foot">উদ্যোগ (UDYOG): উপজেলাভিত্তিক তরুণ উদ্যোক্তা অনুসন্ধান, চিহ্নিতকরণ ও অর্থায়ন কর্মসূচি · ট্র্যাকিং নম্বর {trackingId}</div>
    </div>
  );
}
