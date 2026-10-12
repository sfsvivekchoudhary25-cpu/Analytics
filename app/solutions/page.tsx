"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShopOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  ThunderboltFilled,
  MessageOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function SolutionsPage() {
  const [activeTab, setActiveTab] = useState<"dtc" | "creators" | "agencies">("dtc");

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans antialiased selection:bg-[#ffefb2] selection:text-[#997a00] overflow-x-hidden">
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-white border-b border-[#e9e9ee]">
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#ffefb2] rounded-full blur-[140px] pointer-events-none opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#f8d7ca] rounded-full blur-[140px] pointer-events-none opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffefb2] border-2 border-[#ffe006] text-xs font-black text-[#997a00]">
            <GiftOutlined /> Industry Solutions
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-[1.1]">
            Automated Social Commerce <span className="text-[#997a00]">for Every Growth Model</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Whether you run a high-volume apparel brand, sell digital creator templates, or manage 20+ client accounts as an agency, Fabroniee scales your Instagram conversion funnels without extra headcount.
          </p>

          {/* Solution Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("dtc")}
              className={`px-5 py-3 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === "dtc"
                  ? "bg-[#000000] text-white shadow-md"
                  : "bg-white border-2 border-[#e9e9ee] text-slate-700 hover:border-black"
              }`}
            >
              <ShopOutlined className="mr-1.5" /> For DTC Brands &amp; Stores
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("creators")}
              className={`px-5 py-3 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === "creators"
                  ? "bg-[#000000] text-white shadow-md"
                  : "bg-white border-2 border-[#e9e9ee] text-slate-700 hover:border-black"
              }`}
            >
              <UserOutlined className="mr-1.5" /> For Creators &amp; Influencers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("agencies")}
              className={`px-5 py-3 rounded-full text-xs font-black transition-all cursor-pointer ${
                activeTab === "agencies"
                  ? "bg-[#000000] text-white shadow-md"
                  : "bg-white border-2 border-[#e9e9ee] text-slate-700 hover:border-black"
              }`}
            >
              <TeamOutlined className="mr-1.5" /> For Marketing Agencies
            </button>
          </div>
        </div>
      </section>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === "dtc" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-page-entrance">
              <div className="space-y-6">
                <span className="text-xs font-black uppercase text-[#e13181] tracking-wider">E-Commerce &amp; Retail</span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                  Convert Viral Reels Directly into Shopify &amp; Stripe Sales
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  When a product video takes off, thousands of comments ask "Where do I buy this?" Sending manual DMs takes hours and results in lost momentum. Fabroniee converts high-intent comments in under 2 seconds.
                </p>
                <ul className="space-y-3 text-xs font-bold text-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                    <span>Single-use dynamic coupon codes injected automatically</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                    <span>AI sizing &amp; shipping co-pilot answers catalog questions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                    <span>Customer UGC photo curation and 1-click reward coupons</span>
                  </li>
                </ul>
                <Link
                  href="/login"
                  style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                  className="inline-flex px-7 py-3.5 rounded-full font-black text-xs hover:bg-neutral-900 !text-white shadow-md transition-all"
                >
                  <span>Start Free Trial &rarr;</span>
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#f8d7ca] border-2 border-[#eea07f] space-y-4 shadow-lg">
                <div className="text-xs font-black uppercase text-[#883a19]">Verified E-Commerce Metric</div>
                <div className="text-5xl font-black text-[#883a19] font-mono">+34.8%</div>
                <div className="text-sm font-black text-[#883a19]">Higher Checkout Rate vs. Link-in-Bio</div>
                <p className="text-xs text-[#883a19]/90 leading-relaxed font-medium">
                  Direct message checkout links eliminate the extra friction of visiting an external link aggregator. Buyers tap directly into their cart.
                </p>
              </div>
            </div>
          )}

          {activeTab === "creators" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-page-entrance">
              <div className="space-y-6">
                <span className="text-xs font-black uppercase text-[#0000e9] tracking-wider">Creators &amp; Educators</span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                  Automate Freebie Downloads, Notion Templates &amp; VIP Access
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tell your followers to comment "TEMPLATE" or "SYLLABUS". Fabroniee instantly messages them the direct access link, building a qualified email and DM subscriber list organically.
                </p>
                <ul className="space-y-3 text-xs font-bold text-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                    <span>Instant lead magnet and Notion template distribution</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                    <span>24h story emoji reaction funnels (`🔥` triggers coaching link)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                    <span>89% open rate vs 15% traditional email marketing</span>
                  </li>
                </ul>
                <Link
                  href="/login"
                  style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                  className="inline-flex px-7 py-3.5 rounded-full font-black text-xs hover:bg-neutral-900 !text-white shadow-md transition-all"
                >
                  <span>Automate Your Lead Magnet &rarr;</span>
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#bfbff9] border-2 border-[#6666f1] space-y-4 shadow-lg">
                <div className="text-xs font-black uppercase text-[#00008b]">Verified Creator Metric</div>
                <div className="text-5xl font-black text-[#00008b] font-mono">89.4%</div>
                <div className="text-sm font-black text-[#00008b]">Direct Message Open Rate</div>
                <p className="text-xs text-[#082f49] leading-relaxed font-medium">
                  Followers are already inside Instagram. Delivering links directly to their message requests yields massive conversion rates compared to external landing pages.
                </p>
              </div>
            </div>
          )}

          {activeTab === "agencies" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-page-entrance">
              <div className="space-y-6">
                <span className="text-xs font-black uppercase text-[#871d4d] tracking-wider">Agencies &amp; Social Teams</span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                  Manage Multiple Client Accounts with Zero Password Sharing
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Never ask clients for their Instagram password again. Clients connect their Facebook Page and Instagram Business Account via official Meta OAuth in 60 seconds, keeping access scoped and completely secure.
                </p>
                <ul className="space-y-3 text-xs font-bold text-slate-800">
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                    <span>Official Meta Graph API v21.0 compliance protects client pages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                    <span>Full automated comment logs and revenue attribution reporting</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleFilled className="text-emerald-500 text-sm" />
                    <span>Self-service data deletion and GDPR compliance</span>
                  </li>
                </ul>
                <Link
                  href="/login"
                  style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                  className="inline-flex px-7 py-3.5 rounded-full font-black text-xs hover:bg-neutral-900 !text-white shadow-md transition-all"
                >
                  <span>Explore Agency Sandbox &rarr;</span>
                </Link>
              </div>

              <div className="p-8 rounded-3xl bg-[#f7cbdf] border-2 border-[#ed83b3] space-y-4 shadow-lg">
                <div className="text-xs font-black uppercase text-[#871d4d]">Agency Guarantee</div>
                <div className="text-5xl font-black text-[#871d4d] font-mono">0</div>
                <div className="text-sm font-black text-[#871d4d]">Passwords Stored or Handled</div>
                <p className="text-xs text-[#871d4d]/90 leading-relaxed font-medium">
                  Eliminate security liabilities. Everything runs through military-grade AES-256 encrypted tokens authorized through official Facebook Login for Business dialogs.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
