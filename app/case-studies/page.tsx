"use client";

import React from "react";
import Link from "next/link";
import {
  RiseOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  ThunderboltFilled,
  StarFilled,
} from "@ant-design/icons";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans antialiased selection:bg-[#f7cbdf] selection:text-[#871d4d] overflow-x-hidden">
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-white border-b border-[#e9e9ee]">
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#bfbff9] rounded-full blur-[140px] pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#f7cbdf] rounded-full blur-[140px] pointer-events-none opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#bfbff9] border-2 border-[#6666f1] text-xs font-black text-[#00008b]">
            <RiseOutlined /> Customer Case Studies
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-[1.1]">
            Real Brands. Real DMs. <span className="text-[#00008b]">Measurable Revenue.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Discover how modern DTC stores, creators, and social agencies use Fabroniee to capture qualified buyers right when their interest is at its absolute peak.
          </p>

          <div className="pt-2">
            <Link
              href="/login"
              style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-sm hover:bg-neutral-900 !text-white shadow-xl transition-all"
            >
              <span>Start Your Growth Story Free</span>
              <ArrowRightOutlined className="text-xs !text-white" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3 CASE STUDIES ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Case Study 1: Streetwear E-Commerce */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white border-2 border-[#e9e9ee] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-black uppercase text-[#e13181] tracking-wider">
                Luxury Apparel &bull; Limited Drop
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                How a Vintage Streetwear Brand Generated $42,000 in 48h from 14,200 Reel Comments
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Before Fabroniee, their team struggled to manually respond to comments during flash drops, causing 80% of interested buyers to bounce. By setting a `DROP` keyword trigger, buyers received instant checkout DMs with their unique discount applied.
              </p>
              <div className="p-4 rounded-2xl bg-[#fdf1f7] border border-[#f7cbdf] text-xs font-medium text-[#871d4d] italic">
                "Fabroniee paid for its entire yearly plan in the first 12 minutes of our Friday drop. Our checkout conversion shot up by 38%."
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#f8d7ca] border-2 border-[#eea07f] space-y-4 text-center">
              <div>
                <div className="text-4xl font-black text-[#883a19] font-mono">$42,000</div>
                <div className="text-xs font-black text-[#883a19] uppercase">Drop Revenue in 48 Hours</div>
              </div>
              <div className="pt-3 border-t border-[#eea07f]/50 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-black text-[#883a19] font-mono">14,200</div>
                  <div className="text-[10px] text-[#883a19]/80 font-bold">Comments Handled</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#883a19] font-mono">1.2s</div>
                  <div className="text-[10px] text-[#883a19]/80 font-bold">Average DM Latency</div>
                </div>
              </div>
            </div>
          </div>

          {/* Case Study 2: Digital Creator */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white border-2 border-[#e9e9ee] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-black uppercase text-[#00008b] tracking-wider">
                Creator &bull; Coaching Course
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                89.4% DM Open Rate and 4.8x Higher Course Enrollment vs Linktree
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rather than asking 120,000 followers to click an external link-in-bio, Alex prompted viewers to comment "SYLLABUS". Fabroniee instantly messaged the curriculum download and early-bird checkout link directly in Instagram chat.
              </p>
              <div className="p-4 rounded-2xl bg-[#e6f7ff] border border-[#91d5ff] text-xs font-medium text-[#002766] italic">
                "DM automation outperforms link-in-bio by a mile. Nobody wants to leave Instagram. Bringing the checkout directly into their DMs was a game-changer."
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#bfbff9] border-2 border-[#6666f1] space-y-4 text-center">
              <div>
                <div className="text-4xl font-black text-[#00008b] font-mono">89.4%</div>
                <div className="text-xs font-black text-[#00008b] uppercase">DM Open Rate</div>
              </div>
              <div className="pt-3 border-t border-[#6666f1]/50 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-black text-[#00008b] font-mono">4.8x</div>
                  <div className="text-[10px] text-[#00008b]/80 font-bold">Conversion vs Linktree</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#00008b] font-mono">1,840</div>
                  <div className="text-[10px] text-[#00008b]/80 font-bold">Leads Captured</div>
                </div>
              </div>
            </div>
          </div>

          {/* Case Study 3: Beauty Skincare UGC */}
          <div className="p-8 sm:p-12 rounded-3xl bg-white border-2 border-[#e9e9ee] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-black uppercase text-[#997a00] tracking-wider">
                Beauty &amp; Skincare &bull; Customer UGC
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                2,400 Customer Tagged Photos Automated into Feed Social Proof &amp; Repeat Sales
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                By enabling Fabroniee's UGC moderation engine, whenever customers tagged their unboxing photos, the brand reviewed submissions in 1 click and auto-published them to their official feed, rewarding the customer with an automated $10 thank-you coupon.
              </p>
              <div className="p-4 rounded-2xl bg-[#fefbe8] border border-[#ffe58f] text-xs font-medium text-[#613400] italic">
                "Our customers love seeing themselves reposted on our official page, and the automated thank-you DM drove over 600 repeat orders in 30 days."
              </div>
            </div>

            <div className="lg:col-span-5 p-6 rounded-2xl bg-[#ffefb2] border-2 border-[#ffe006] space-y-4 text-center">
              <div>
                <div className="text-4xl font-black text-[#451a03] font-mono">2,400+</div>
                <div className="text-xs font-black text-[#451a03] uppercase">UGC Photos Curated</div>
              </div>
              <div className="pt-3 border-t border-[#ffe006]/50 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-black text-[#451a03] font-mono">612</div>
                  <div className="text-[10px] text-[#451a03]/80 font-bold">Repeat Coupon Orders</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#451a03] font-mono">100%</div>
                  <div className="text-[10px] text-[#451a03]/80 font-bold">Automated Ingestion</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-t border-[#e9e9ee]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Ready to Generate Similar Results for Your Brand?
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Set up your first automated comment trigger in under 60 seconds with official Meta Login.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
              className="inline-flex px-8 py-4 rounded-full font-black text-sm hover:bg-neutral-900 !text-white shadow-xl transition-all"
            >
              <span className="!text-white">Get Started with Meta Login &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
