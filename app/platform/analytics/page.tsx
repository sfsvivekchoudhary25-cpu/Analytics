"use client";

import React from "react";
import Link from "next/link";
import {
  LineChartOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  ThunderboltFilled,
  SafetyCertificateFilled,
  RiseOutlined,
  LockOutlined,
} from "@ant-design/icons";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function AnalyticsPlatformPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans antialiased selection:bg-[#f7cbdf] selection:text-[#871d4d] overflow-x-hidden">
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-white border-b border-[#e9e9ee]">
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#f7cbdf] rounded-full blur-[140px] pointer-events-none opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#bfbff9] rounded-full blur-[140px] pointer-events-none opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f7cbdf] border border-[#ed83b3] text-xs font-semibold text-[#871d4d]">
            <LineChartOutlined /> Authenticated Meta Analytics
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            First-Party Meta Data <span className="text-[#e13181]">You Can Bet Your Revenue On</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Say goodbye to estimated guesswork and fragile scraper extensions. Fabroniee tracks actual direct message delivery webhooks, link clicks, and conversion rates straight from the Meta Graph API v21.0.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <Link
              href="/login"
              style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full hover:bg-neutral-900 !text-white font-semibold text-sm shadow-xl transition-all"
            >
              <span>View Live Sandbox Analytics</span>
              <ArrowRightOutlined className="text-xs !text-white" />
            </Link>

            <Link
              href="/login?demo=1"
              style={{ backgroundColor: "#f7cbdf", color: "#871d4d", border: "2px solid #ed83b3" }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full hover:bg-white text-sm font-semibold transition-all shadow-2xs"
            >
              <span>⚡ Reviewer Sandbox</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4 CORE STATS ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-8 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-2 text-center shadow-xs">
              <div className="text-4xl font-bold text-[#e13181] font-mono">89.4%</div>
              <div className="text-sm font-semibold text-slate-900">Average DM Open Rate</div>
              <p className="text-xs text-slate-500 font-normal">Instagram direct messages achieve 4x higher open rates than traditional email campaigns.</p>
            </div>

            <div className="p-8 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-2 text-center shadow-xs">
              <div className="text-4xl font-bold text-[#0000e9] font-mono">&lt; 1.8s</div>
              <div className="text-sm font-semibold text-slate-900">Webhook Event Latency</div>
              <p className="text-xs text-slate-500 font-normal">Direct real-time subscription pipes ensure near-instantaneous checkout link dispatch.</p>
            </div>

            <div className="p-8 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-2 text-center shadow-xs">
              <div className="text-4xl font-bold text-[#e3622b] font-mono">+42.6%</div>
              <div className="text-sm font-semibold text-slate-900">Link Click-Through Lift</div>
              <p className="text-xs text-slate-500 font-normal">Personalized in-DM links outperform static "link-in-bio" link trees by over 40%.</p>
            </div>

            <div className="p-8 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-2 text-center shadow-xs">
              <div className="text-4xl font-bold text-emerald-600 font-mono">100%</div>
              <div className="text-sm font-semibold text-slate-900">Zero-Scraper Compliance</div>
              <p className="text-xs text-slate-500 font-normal">Operates exclusively under official Facebook Login for Business terms and rate limits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DATA INTEGRITY ARCHITECTURE ──────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-[#e9e9ee]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e13181]">
              First-Party Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Why First-Party Graph API Data Matters
            </h2>
            <p className="text-sm text-slate-600 font-normal leading-relaxed">
              Other tools use unofficial browser scraping or extension hacks that violate Instagram rules and get accounts flagged. Fabroniee connects directly through authenticated endpoints.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-[#fafaf9] border-2 border-[#e9e9ee] flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#bfbff9] text-[#00008b] flex items-center justify-center text-lg font-bold shrink-0">
                <SafetyCertificateFilled />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">Official Webhook Verification</h4>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Every comment and DM trigger is cryptographically validated using Meta's `X-Hub-Signature-256` SHA256 HMAC hash. Zero spoofing.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#fafaf9] border-2 border-[#e9e9ee] flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#f7cbdf] text-[#871d4d] flex items-center justify-center text-lg font-bold shrink-0">
                <LockOutlined />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">AES-256 Encryption at Rest</h4>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  All page tokens, customer IDs, and message logs are securely encrypted with symmetric AES-256 keys inside isolated PostgreSQL tables.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#fafaf9] border-2 border-[#e9e9ee] flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#ffefb2] text-[#997a00] flex items-center justify-center text-lg font-bold shrink-0">
                <CheckCircleFilled />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">Instant GDPR &amp; Meta Data Deletion</h4>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  Compliant with Meta Platform Terms Section 4. Users can request immediate automated deletion of all associated tokens and logs at <Link href="/data-deletion" className="text-[#e13181] underline font-medium">/data-deletion</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-[#f7cbdf] via-[#bfbff9] to-[#ffefb2] border-2 border-[#ed83b3] space-y-5 shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Unlock Your Instagram Attribution Data
            </h2>
            <p className="text-sm text-slate-700 max-w-lg mx-auto font-normal leading-relaxed">
              See exact comment conversions, follower engagement, and revenue attribution across all your reels and stories.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                className="inline-flex px-8 py-4 rounded-full font-semibold text-sm hover:bg-neutral-900 !text-white shadow-xl transition-all"
              >
                <span className="!text-white">Start Free Trial &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
