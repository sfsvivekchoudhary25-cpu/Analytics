"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircleFilled,
  ArrowRightOutlined,
  ThunderboltFilled,
  QuestionCircleOutlined,
  StarFilled,
} from "@ant-design/icons";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans antialiased selection:bg-[#f7cbdf] selection:text-[#871d4d] overflow-x-hidden">
      <MarketingNav />

      {/* ── HERO & BILLING SWITCH ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-white border-b border-[#e9e9ee]">
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#f7cbdf] rounded-full blur-[140px] pointer-events-none opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#bfbff9] rounded-full blur-[140px] pointer-events-none opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f7cbdf] border-2 border-[#ed83b3] text-xs font-black text-[#871d4d]">
            <StarFilled className="text-amber-400" /> Transparent Pricing
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-[1.1]">
            Simple Plans. <span className="text-[#e13181]">Immediate ROI.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Choose the plan that matches your monthly comment volume. Every plan includes official Meta Graph API v21.0 compliance, zero password storage, and 1-click setup.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-xs font-black ${!annual ? "text-slate-950" : "text-slate-400"}`}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className="relative w-14 h-8 rounded-full bg-slate-950 p-1 transition-colors cursor-pointer"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-transform ${
                  annual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-black ${annual ? "text-slate-950" : "text-slate-400"}`}>
                Annual Billing
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#f7cbdf] text-[#871d4d] border border-[#ed83b3] text-[10px] font-black uppercase">
                Save 20%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 PRICING TIERS ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Tier 1: Starter Creator */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-6 flex flex-col justify-between shadow-sm hover:border-black transition-all">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Starter Creator</span>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-slate-950 font-mono">
                    ${annual ? "23" : "29"}
                    <span className="text-sm font-semibold text-slate-500">/mo</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {annual ? "Billed annually ($276/yr)" : "Billed monthly"}
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Perfect for growing creators, personal brands, and info-product sellers launching lead magnets.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700 font-bold pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>Up to 2,500 automated comments/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>1 Instagram Business Account</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>Instant Comment-to-DM triggers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>24-Hour Story reaction automation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>Randomized anti-spam public replies</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/login"
                  style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                  className="w-full py-3.5 rounded-full text-center block font-black text-xs hover:bg-neutral-900 !text-white shadow-xs transition-all"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>

            {/* Tier 2: Growth Brand (Most Popular in Fabulate Pink) */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#f7cbdf] border-2 border-[#ed83b3] space-y-6 flex flex-col justify-between shadow-xl relative scale-105 z-10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#e13181] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                Most Popular
              </div>

              <div className="space-y-4">
                <span className="text-xs font-black uppercase text-[#871d4d] tracking-wider">Growth Brand</span>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-[#871d4d] font-mono">
                    ${annual ? "63" : "79"}
                    <span className="text-sm font-semibold text-[#871d4d]/80">/mo</span>
                  </div>
                  <p className="text-[11px] text-[#871d4d]/80">
                    {annual ? "Billed annually ($756/yr)" : "Billed monthly"}
                  </p>
                </div>
                <p className="text-xs text-[#871d4d] leading-relaxed font-medium">
                  Engineered for fast-growing DTC brands, e-commerce stores, and high-engagement influencers.
                </p>

                <ul className="space-y-2.5 text-xs text-[#871d4d] font-bold pt-4 border-t border-[#ed83b3]">
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-[#e13181]" />
                    <span>Up to 10,000 automated comments/mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-[#e13181]" />
                    <span>3 Instagram Business Accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-[#e13181]" />
                    <span>Autonomous AI Co-Pilot (Multilingual)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-[#e13181]" />
                    <span>Dynamic single-use discount generator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-[#e13181]" />
                    <span>Customer UGC ingestion &amp; reposting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-[#e13181]" />
                    <span>Advanced Meta webhook analytics</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/login"
                  style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                  className="w-full py-3.5 rounded-full text-center block font-black text-xs hover:bg-neutral-900 !text-white shadow-md transition-all"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>

            {/* Tier 3: Scale & Agency */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-6 flex flex-col justify-between shadow-sm hover:border-black transition-all">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Scale &amp; Agency</span>
                <div className="space-y-1">
                  <div className="text-4xl font-black text-slate-950 font-mono">
                    ${annual ? "159" : "199"}
                    <span className="text-sm font-semibold text-slate-500">/mo</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {annual ? "Billed annually ($1,908/yr)" : "Billed monthly"}
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For enterprise brands, multi-account creators, and marketing agencies managing client portfolios.
                </p>

                <ul className="space-y-2.5 text-xs text-slate-700 font-bold pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>Unlimited automated comments &amp; DMs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>10 Instagram Business Accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>Priority webhook execution (&lt;0.8s)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>Custom business knowledge base</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500" />
                    <span>Dedicated account manager &amp; Slack channel</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/login"
                  style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                  className="w-full py-3.5 rounded-full text-center block font-black text-xs hover:bg-neutral-900 !text-white shadow-xs transition-all"
                >
                  Contact Agency Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white border-t border-[#e9e9ee]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase text-[#e13181]">Billing Questions</span>
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#fafaf9] border border-slate-200 space-y-2">
              <h4 className="text-sm font-black text-slate-900">Can I change or cancel my plan at any time?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Yes! There are no long-term contracts. You can upgrade, downgrade, or cancel your subscription anytime directly inside your account billing panel.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#fafaf9] border border-slate-200 space-y-2">
              <h4 className="text-sm font-black text-slate-900">Are there any hidden Meta or Facebook API fees?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No. Connecting via official Meta Graph API v21.0 using Facebook Login for Business is completely free. You only pay for your Fabroniee software subscription.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#fafaf9] border border-slate-200 space-y-2">
              <h4 className="text-sm font-black text-slate-900">What happens if I exceed my monthly comment limit?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                We never shut down your funnels abruptly. We will notify you when you reach 85% and 100% of your tier, giving you the choice to upgrade seamlessly without missing a customer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
