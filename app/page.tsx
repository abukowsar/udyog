import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SiteHeader, TrackButton } from "@/components/landing/SiteHeader";
import { Calculator, Countdown, Districts, Quiz, RevealObserver, TrackModal } from "@/components/landing/Interactive";

const FIN = [
  { ico: "coin", c: "ico-green", big: "২০ লক্ষ ৳", h: "সর্বোচ্চ অর্থায়ন", p: "প্রকৃত ব্যবসায়িক চাহিদা ও ব্যয় পরিকল্পনার ভিত্তিতে নির্ধারিত।" },
  { ico: "pie", c: "ico-amber", big: "৫০ : ৫০", h: "ঋণ : অনুদান", p: "অর্ধেক ব্যাংক ঋণ এবং বাকি অর্ধেক অনুদান।" },
  { ico: "shield", c: "ico-navy", big: "শূন্য", h: "সহায়ক জামানত", p: "ঋণের ক্ষেত্রে কোনো সহায়ক জামানতের প্রয়োজন হবে না।" },
  { ico: "percent", c: "ico-red", big: "৪% – ৭%", h: "সুদ/মুনাফার হার", p: "স্টার্ট-আপ ৪%, নারী উদ্যোক্তা ৫%, সিএমএসএমই ও কৃষিপণ্য প্রক্রিয়াজাতকরণ ৭%।" }
];

const ELIG: [boolean, React.ReactNode][] = [
  [true, <><strong>প্রাপ্তবয়স্ক নাগরিক</strong> — আবেদনের শেষ তারিখে বয়স অনূর্ধ্ব ২৮ বছর।</>],
  [true, <><strong>সংশ্লিষ্ট উপজেলার স্থায়ী বাসিন্দা</strong> — ওয়ার্ড কমিশনার/কাউন্সিলরের নাগরিক সনদ প্রয়োজন।</>],
  [true, <><strong>বাস্তবসম্মত ব্যবসায়িক ধারণা</strong> অথবা চলমান নিজস্ব উদ্যোগ।</>],
  [true, <>আবেদন <strong>সম্পূর্ণ বিনামূল্যে</strong>; যে ব্যাংকে আবেদন করবেন সেখানে পূর্ব থেকে হিসাব থাকা আবশ্যক নয়।</>],
  [false, <>ইতোপূর্বে ব্যবসার জন্য কোনো ব্যাংক/আর্থিক প্রতিষ্ঠান থেকে <strong>ঋণ গ্রহণকারী</strong> বিবেচিত হবেন না।</>],
  [false, <>সিআইবি যাচাইয়ে <strong>ঋণখেলাপি</strong> প্রমাণিত হলে আবেদন বাতিল হবে।</>],
  [false, <><strong>সরকারি, আধা-সরকারি বা স্বায়ত্তশাসিত</strong> প্রতিষ্ঠানে কর্মরত ব্যক্তি যোগ্য নন।</>]
];

const SECTORS = [["🌾", "কৃষি"], ["🥫", "খাদ্য প্রক্রিয়াজাতকরণ"], ["🧵", "হস্তশিল্প"], ["🐟", "মৎস্য"], ["🐄", "পশুপালন"], ["🏞️", "পর্যটন"],
  ["🛎️", "সেবা"], ["☀️", "সৌরবিদ্যুৎ ও নবায়নযোগ্য জ্বালানি"], ["⚙️", "হালকা প্রকৌশল"], ["💻", "প্রযুক্তিভিত্তিক স্টার্ট-আপ"], ["🛒", "ই-কমার্স"], ["📱", "ফিনটেক / এডটেক / এগ্রিটেক"]];

const SERVICES = [
  ["cap", "ico-green", "উদ্যোক্তা উন্নয়ন প্রশিক্ষণ", "নির্বাচিত উদ্যোক্তাদের জন্য কাঠামোবদ্ধ প্রশিক্ষণ।"],
  ["users", "ico-amber", "অভিজ্ঞ মেন্টরের পরামর্শ", "অভিজ্ঞ মেন্টরের ধারাবাহিক পরামর্শ ও দিকনির্দেশনা।"],
  ["doc", "ico-navy", "ব্যবসা নিবন্ধন", "ট্রেড লাইসেন্স, টিআইএন ইত্যাদি নিবন্ধনে সহায়তা।"],
  ["bulb", "ico-red", "ব্যবসায়িক পরিকল্পনা", "বিজনেস প্ল্যান প্রণয়নে সহায়তা।"],
  ["store", "ico-green", "বাজার সংযোগ", "পণ্য ও সেবার জন্য বাজার সংযোগ স্থাপনের সুযোগ।"],
  ["book", "ico-amber", "আর্থিক সাক্ষরতা", "প্রত্যেক আবেদনকারী Financial Literacy Programme-এর আওতায় আসবেন।"]
];

const STEPS = [
  ["আবেদন দাখিল", "অনলাইনে অথবা উপজেলার যেকোনো তফসিলি ব্যাংক শাখায়"],
  ["উপজেলা লীড ব্যাংক", "শেষ তারিখের পরবর্তী কার্যদিবসে প্রেরণ"],
  ["জেলা লীড ব্যাংক", "জেলার সকল আবেদন সমন্বয়"],
  ["বাছাই কমিটি", "বাংলাদেশ ব্যাংক, সফল উদ্যোক্তা, শিক্ষাবিদ ও বিশেষজ্ঞ"],
  ["ঋণ অনুমোদন", "চূড়ান্ত মনোনয়নের পর ১৫ কার্যদিবসের মধ্যে"],
  ["বিতরণ ও পরিবীক্ষণ", "ঋণ ও অনুদান একসাথে ব্যাংক হিসাবে"]
];

const FAQ = [
  ["আবেদন করতে কি কোনো ফি লাগবে?", "না। আবেদন সম্পূর্ণ বিনামূল্যে এবং সংশ্লিষ্ট উপজেলায় অবস্থিত যেকোনো তফসিলি ব্যাংকের শাখায় নির্ধারিত ফরমের মাধ্যমে দাখিল করা যাবে।"],
  ["আগে থেকে ব্যবসা না থাকলেও কি আবেদন করা যাবে?", "হ্যাঁ। পূর্ব হতে ব্যবসা পরিচালনা করা আবশ্যক নয়; একটি বাস্তবসম্মত ব্যবসায়িক ধারণা থাকলেই আবেদন করা যাবে। ফরমের পার্ট-২ নতুন উদ্যোক্তাদের জন্য এবং পার্ট-৩ চলমান ব্যবসার জন্য।"],
  ["নির্বাচিত হলে কি সবাই ২০ লক্ষ টাকা পাবেন?", "না। সর্বোচ্চ সীমা ২০ লক্ষ টাকা, তবে উদ্যোক্তার প্রকৃত ব্যবসায়িক চাহিদা, প্রস্তাবিত ব্যয় পরিকল্পনা এবং চূড়ান্ত মূল্যায়নের ভিত্তিতে পরিমাণ নির্ধারিত হবে। যেমন, ১২ লক্ষ টাকা প্রয়োজন হলে সর্বোচ্চ ৬ লক্ষ টাকা ঋণ এবং ৬ লক্ষ টাকা অনুদান।"],
  ["ঋণ পরিশোধে ব্যর্থ হলে কী হবে?", "নির্ধারিত সময়ে ঋণ পরিশোধে ব্যর্থ হলে বা ঋণের সদ্ব্যবহার না হলে অনুদানের অর্থ সুদবিহীন ঋণে রূপান্তরিত হবে, ঋণ হিসাবটি শ্রেণীকৃত হবে এবং ঋণগ্রহীতা খেলাপি হিসেবে বিবেচিত হয়ে পরবর্তীতে ঋণ পাওয়ার যোগ্যতা হারাবেন।"],
  ["অর্থ কীভাবে বিতরণ করা হবে?", "ব্যাংক ঋণ ও অনুদান একই সময়ে, এককালীন এবং অনুমোদিত পূর্ণ পরিমাণে উদ্যোক্তার ব্যাংক হিসাবে বিতরণ করা হবে। নগদে কোনো অর্থ প্রদান করা হবে না। অনুদানের সমপরিমাণ Post-Dated Cheque ব্যাংক গ্রহণ করবে।"],
  ["অর্থ কোন কাজে ব্যবহার করা যাবে না?", "প্রদত্ত অর্থ ব্যক্তিগত ভোগ, জমি বা যানবাহন ক্রয়ে ব্যবহার করা যাবে না। প্রতিটি ব্যয়ের ভাউচার সংরক্ষণ এবং চাহিদামতো প্রতিবেদন দাখিল করতে হবে।"],
  ["অনলাইনে আবেদন জমা দিলে কী করতে হবে?", "অনলাইনে জমা দিলে একটি ট্র্যাকিং নম্বর পাবেন এবং আবেদনটি সরাসরি কর্মসূচির ডাটাবেজে সংরক্ষিত হবে। পূর্ণাঙ্গ আবেদনপত্র প্রিন্ট করে সংযুক্তিসহ আপনার উপজেলার যেকোনো তফসিলি ব্যাংক শাখায় জমা দিন।"]
];

const DOWNLOADS = [
  ["/docs/udyog-form.pdf", "আবেদন ফরম", "৭ পৃষ্ঠা · পার্ট ১–৫"],
  ["/docs/udyog-circular.pdf", "এসএমইএসপিডি সার্কুলার নং-০৫", "নীতিমালা · ১৩ সেপ্টেম্বর ২০২৬"],
  ["/docs/innfairleafletudyog.pdf", "কর্মসূচি লিফলেট", "সংক্ষিপ্ত পরিচিতি"]
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="hero">
          <div className="container hero-grid">
            <div className="reveal">
              <div className="hero-badge"><b>বাংলাদেশ ব্যাংক</b> এসএমই এন্ড স্পেশাল প্রোগ্রামস্ ডিপার্টমেন্ট</div>
              <h1><span className="grad">উদ্যোগ</span> <span className="en">UDYOG</span></h1>
              <p className="lead">উপজেলাভিত্তিক তরুণ উদ্যোক্তা অনুসন্ধান, চিহ্নিতকরণ ও অর্থায়ন কর্মসূচি — আপনার ব্যবসায়িক ধারণাকে বাস্তবে রূপ দিন।</p>
              <p className="lead-en">Upazila-Driven Youth Opportunity for Growth</p>
              <div className="hero-cta">
                <Link className="btn btn-primary" href="/apply">অনলাইনে আবেদন করুন <Icon name="arrow" /></Link>
                <a className="btn btn-ghost" href="#eligibility">যোগ্যতা যাচাই করুন</a>
              </div>
              <Countdown />
            </div>
            <div className="hero-visual reveal" aria-hidden="true">
              <div className="orbit" /><div className="orbit o2" /><div className="orbit o3" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="hero-core"><img src="/assets/udyog-mark.png" alt="" /></div>
              <div className="chip-float cf1"><span className="ico"><Icon name="coin" /></span><div><b>সর্বোচ্চ ২০ লক্ষ টাকা</b><small>সমন্বিত অর্থায়ন</small></div></div>
              <div className="chip-float cf2"><span className="ico"><Icon name="pie" /></span><div><b>৫০% অনুদান</b><small>৫০% ব্যাংক ঋণ</small></div></div>
              <div className="chip-float cf3"><span className="ico"><Icon name="shield" /></span><div><b>জামানত ছাড়াই</b><small>সুদ ৪% – ৭%</small></div></div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="stats">
          <div className="container">
            <div className="stats-card reveal">
              {[[8, "বিভাগ"], [8, "জেলা"], [64, "উপজেলা"], [640, "তরুণ উদ্যোক্তা (প্রথম ধাপ)"]].map(([n, l]) => (
                <div className="stat" key={l}><b data-count={n}>০</b><span>{l}</span></div>
              ))}
              <div className="stat"><b data-count="5000" data-suffix="+">০</b><span>উদ্যোক্তা প্রতি বছর (লক্ষ্য)</span></div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about">
          <div className="container about-grid">
            <div className="about-text reveal">
              <span className="eyebrow">কর্মসূচির স্বরূপ</span>
              <h2>প্রতিযোগিতা নয় — সম্ভাবনার অনুসন্ধান</h2>
              <p>দেশের উপজেলা পর্যায়ের সম্ভাবনাময় তরুণ-তরুণীদের উদ্যোক্তা হিসেবে গড়ে তুলতে বাংলাদেশ ব্যাংক “উদ্যোগ (UDYOG)” কর্মসূচি বাস্তবায়ন করছে।</p>
              <p>“উদ্যোগ” প্রচলিত অর্থে কোনো প্রতিযোগিতা নয়। এর আওতায় তফসিলি ব্যাংকসমূহ তাদের বিদ্যমান শাখা নেটওয়ার্ক ব্যবহার করে উপজেলা পর্যায়ে স্বতঃপ্রণোদিতভাবে সম্ভাবনাময় তরুণ উদ্যোক্তা অনুসন্ধান ও চিহ্নিত করবে, তাঁদের ব্যবসায়িক ধারণা ও প্রকৃত অর্থের চাহিদা যাচাই করবে এবং অর্থায়ন করবে।</p>
              <div className="pull-quote">একজন সফল ক্ষুদ্র উদ্যোক্তা গড়ে ৩ থেকে ৫ জনের কর্মসংস্থান সৃষ্টি করেন।</div>
            </div>
            <div className="reveal">
              <div className="name-table">
                <div className="name-row"><div>সংক্ষিপ্ত নাম</div><div>“উদ্যোগ” (UDYOG)</div></div>
                <div className="name-row"><div>ইংরেজি পূর্ণরূপ</div><div className="en">UDYOG: Upazila-Driven Youth Opportunity for Growth</div></div>
                <div className="name-row"><div>পূর্ণনাম (বাংলা)</div><div>উদ্যোগ: উপজেলাভিত্তিক তরুণ উদ্যোক্তা অনুসন্ধান, চিহ্নিতকরণ ও অর্থায়ন কর্মসূচি</div></div>
                <div className="name-row"><div>বাস্তবায়নকারী</div><div>এসএমই এন্ড স্পেশাল প্রোগ্রামস্ ডিপার্টমেন্ট, বাংলাদেশ ব্যাংক — তফসিলি ব্যাংকসমূহের মাধ্যমে</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* FINANCE */}
        <section id="finance" className="finance">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">অর্থায়নের পরিমাণ</span>
              <h2>অর্ধেক ঋণ, অর্ধেক অনুদান</h2>
              <p>নির্বাচিত প্রত্যেক উদ্যোক্তা তাঁর প্রকৃত চাহিদা অনুযায়ী সর্বোচ্চ ২০ (বিশ) লক্ষ টাকার একটি অর্থায়ন প্যাকেজ পাবেন।</p>
            </div>
            <div className="fin-grid">
              {FIN.map((x) => (
                <div className="fin-card reveal" key={x.h}><div className={`ico ${x.c}`}><Icon name={x.ico} /></div><div className="big">{x.big}</div><h3>{x.h}</h3><p>{x.p}</p></div>
              ))}
            </div>
            <Calculator />
          </div>
        </section>

        {/* ELIGIBILITY */}
        <section id="eligibility">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">আবেদনের যোগ্যতা ও পদ্ধতি</span>
              <h2>আপনি কি আবেদন করতে পারবেন?</h2>
              <p>পূর্ব হতে ব্যবসা পরিচালনা করা আবশ্যক নয়; একটি বাস্তবসম্মত ব্যবসায়িক ধারণা থাকলেই আবেদন করা যাবে।</p>
            </div>
            <div className="elig-grid">
              <ul className="check-list reveal">
                {ELIG.map(([ok, t], i) => (
                  <li key={i} className={ok ? "yes" : "no"}><span className="ci"><Icon name={ok ? "check" : "x"} /></span><p>{t}</p></li>
                ))}
              </ul>
              <Quiz />
            </div>
          </div>
        </section>

        {/* COVERAGE */}
        <section id="coverage" className="coverage">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">কর্মসূচির আওতাভুক্ত এলাকা</span>
              <h2>৮ বিভাগ · ৮ জেলা · ৬৪ উপজেলা</h2>
              <p>প্রাথমিকভাবে ৮টি বিভাগের ৮টি জেলার অন্তর্গত ৬৪টি উপজেলায় কর্মসূচি শুরু হবে। প্রতিটি উপজেলা হতে ১০ জন করে সর্বমোট ৬৪০ জন তরুণ উদ্যোক্তা নির্বাচিত হবেন। ধারাবাহিকভাবে দেশের অন্যান্য জেলায় কর্মসূচি সম্প্রসারিত হবে।</p>
            </div>
            <Districts />
          </div>
        </section>

        {/* SECTORS */}
        <section id="sectors">
          <div className="container">
            <div className="section-head center reveal">
              <span className="eyebrow">উদ্যোগের ধরণ</span>
              <h2>সব ধরনের বৈধ উদ্যোগই সমান বিবেচনায়</h2>
              <p>বিদ্যমান ব্যবসার পাশাপাশি নতুন ব্যবসায়িক ধারণাও অনুরূপ প্রাধান্য পাবে।</p>
            </div>
            <div className="sector-cloud reveal">
              {SECTORS.map(([e, t]) => <span className="sector" key={t}><span className="em" aria-hidden="true">{e}</span>{t}</span>)}
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">অর্থায়নের পাশাপাশি অন্যান্য সেবা</span>
              <h2>শুধু অর্থ নয় — পূর্ণাঙ্গ সহায়তা</h2>
              <p>কর্মসূচির পরিধি কেবল অর্থায়নেই সীমাবদ্ধ থাকবে না।</p>
            </div>
            <div className="svc-grid">
              {SERVICES.map(([ico, c, h, p], i) => (
                <div className="svc reveal" key={h}><span className="num">{String(i + 1).padStart(2, "0")}</span><div className={`ico ${c}`}><Icon name={ico} /></div><h3>{h}</h3><p>{p}</p></div>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section id="process" className="process">
          <div className="container" style={{ position: "relative" }}>
            <div className="section-head reveal">
              <span className="eyebrow">উদ্যোক্তা নির্বাচন প্রক্রিয়া</span>
              <h2>স্বচ্ছ, নিরপেক্ষ ও অংশগ্রহণমূলক</h2>
              <p>ব্যবসায়িক ধারণার যৌক্তিকতা, বাজার সম্ভাবনা, আর্থিক পরিকল্পনা, উদ্যোক্তার সক্ষমতা এবং কর্মসংস্থান সৃষ্টির সম্ভাবনা বিবেচনায় চূড়ান্ত মনোনয়ন দেওয়া হবে।</p>
            </div>
            <div className="steps">
              {STEPS.map(([h, p], i) => (
                <div className="step reveal" key={h}><div className="dot">{"১২৩৪৫৬"[i]}</div><div><h4>{h}</h4><p>{p}</p></div></div>
              ))}
            </div>
          </div>
        </section>

        {/* IMPACT */}
        <section id="impact">
          <div className="container">
            <div className="impact-card reveal">
              <div className="l">
                <h2>একজন উদ্যোক্তা, অনেক কর্মসংস্থান</h2>
                <p>একজন সফল ক্ষুদ্র উদ্যোক্তা গড়ে ৩ হতে ৫ জনের কর্মসংস্থান সৃষ্টি করেন। এ বিবেচনায় “উদ্যোগ” কর্মসূচি কর্মসংস্থান সৃষ্টি ও দেশের সামগ্রিক অর্থনৈতিক উন্নয়নে গুরুত্বপূর্ণ ভূমিকা রাখবে বলে বাংলাদেশ ব্যাংক আশা করে।</p>
                <div className="people" aria-hidden="true">
                  <Icon name="person" />{[1, 2, 3, 4, 5].map((k) => <Icon key={k} name="person" className="dim" />)}
                </div>
              </div>
              <div className="r">
                <div className="impact-num"><b>১,৯২০ – ৩,২০০</b><span>প্রথম ধাপের ৬৪০ উদ্যোক্তা থেকে সম্ভাব্য কর্মসংস্থান</span></div>
                <div className="impact-num"><b>১৫,০০০ – ২৫,০০০</b><span>বছরে ৫,০০০ উদ্যোক্তা থেকে সম্ভাব্য কর্মসংস্থান</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* DOCUMENTS */}
        <section id="documents" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head reveal"><span className="eyebrow">প্রয়োজনীয় দলিলাদি</span><h2>আবেদনের সাথে যা লাগবে</h2></div>
            <div className="docs-grid">
              <div className="doc-box reveal">
                <h3>সংযুক্তি</h3>
                <ul className="doc-list">
                  {["জাতীয় পরিচয়পত্র / জন্মনিবন্ধন সনদের কপি", "পাসপোর্ট সাইজ ছবি (২ কপি)", "সর্বশেষ শিক্ষাগত যোগ্যতার সনদের কপি (যদি থাকে)",
                    "দক্ষতা/উদ্যোক্তা উন্নয়ন প্রশিক্ষণ সনদ (যদি থাকে)", "ওয়ার্ড কমিশনার/কাউন্সিলর প্রদত্ত নাগরিক সনদ"].map((t) => <li key={t}><Icon name="check" />{t}</li>)}
                </ul>
              </div>
              <div className="doc-box reveal">
                <h3>ডাউনলোড</h3>
                <p style={{ color: "var(--ink-2)" }}>অনলাইনে আবেদন করুন, অথবা মূল ফরম ডাউনলোড করে হাতে পূরণ করুন।</p>
                <div className="dl-list">
                  {DOWNLOADS.map(([href, b, s]) => (
                    <a className="dl" href={href} download key={href}><span className="fi">PDF</span><div><b>{b}</b><small>{s}</small></div><Icon name="download" className="arr" width={20} height={20} /></a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head center reveal"><span className="eyebrow">প্রশ্নোত্তর</span><h2>সচরাচর জিজ্ঞাসা</h2></div>
            <div className="faq-list">
              {FAQ.map(([q, a]) => <details className="faq reveal" key={q}><summary>{q}</summary><div className="a">{a}</div></details>)}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-band">
          <div className="container">
            <div className="cta-inner reveal">
              <h2>আপনার উদ্যোগের যাত্রা শুরু হোক আজই</h2>
              <p>সহজ ধাপে অনলাইনে ফরম পূরণ করুন — খসড়া স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে, আর জমা দেওয়া আবেদন সরাসরি কর্মসূচির ডাটাবেজে পৌঁছাবে।</p>
              <div className="btns">
                <Link className="btn btn-amber" href="/apply">আবেদন শুরু করুন <Icon name="arrow" /></Link>
                <TrackButton className="btn btn-ghost">আবেদনের অবস্থা দেখুন</TrackButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="foot-grid">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/udyog-logo.png" alt="UDYOG" />
              <p>উপজেলাভিত্তিক তরুণ উদ্যোক্তা অনুসন্ধান, চিহ্নিতকরণ ও অর্থায়ন কর্মসূচি</p>
            </div>
            <div>
              <h4>যোগাযোগ</h4>
              <ul>
                <li>এসএমই এন্ড স্পেশাল প্রোগ্রামস্ ডিপার্টমেন্ট</li>
                <li>২য় সংলগ্নী ভবন, ২৫ তলা</li>
                <li>বাংলাদেশ ব্যাংক, প্রধান কার্যালয়, ঢাকা-১০০০</li>
                <li><a href="https://www.bb.org.bd" target="_blank" rel="noopener noreferrer" className="en">www.bb.org.bd</a></li>
              </ul>
            </div>
            <div>
              <h4>দ্রুত লিংক</h4>
              <ul>
                <li><Link href="/apply">অনলাইন আবেদন</Link></li>
                <li><a href="#calculator">অর্থায়ন ক্যালকুলেটর</a></li>
                <li><a href="#eligibility">যোগ্যতা যাচাই</a></li>
                <li><Link href="/admin">ব্যাংক শাখা লগইন</Link></li>
              </ul>
            </div>
          </div>
          <div className="foot-bottom"><span>© ২০২৬ বাংলাদেশ ব্যাংক · উদ্যোগ (UDYOG)</span><span>আবেদনের শেষ তারিখ: ১৫ অক্টোবর ২০২৬</span></div>
        </div>
      </footer>

      <TrackModal />
      <RevealObserver />
    </>
  );
}
