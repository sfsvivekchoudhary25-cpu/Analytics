"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  MessageOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  ThunderboltFilled,
  ClockCircleOutlined,
  SafetyCertificateFilled,
  FilterOutlined,
  SendOutlined,
} from "@ant-design/icons";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function WorkflowPage() {
  const [testComment, setTestComment] = useState("Where can I buy this dress? Need the link!");
  const [simulatedReply, setSimulatedReply] = useState<string | null>(
    "Trigger detected: 'LINK' matched -> Sent DM with direct checkout link in 0.8s"
  );

  const handleTestTrigger = (keyword: string) => {
    setSimulatedReply(`Processing... Matched keyword: '${keyword}'`);
    setTimeout(() => {
      setSimulatedReply(
        `Trigger: '${keyword}' detected! Random public reply posted & private DM dispatched with 15% discount link in 0.9s.`
      );
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans antialiased selection:bg-[#f7cbdf] selection:text-[#871d4d] overflow-x-hidden">
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-white border-b border-[#e9e9ee]">
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#bfbff9] rounded-full blur-[140px] pointer-events-none opacity-50" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#f7cbdf] rounded-full blur-[140px] pointer-events-none opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#bfbff9] border border-[#6666f1] text-xs font-semibold text-[#00008b]">
            <MessageOutlined /> Workflow Automation Engine
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            Turn Public Comments into <span className="text-[#0000e9]">Private Instant Checkout DMs</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Stop losing qualified buyers to manual DM delays. Fabroniee intercepts high-intent comments in under 2 seconds, posts randomized organic public replies, and delivers tracked direct checkout links.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <Link
              href="/login"
              style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full hover:bg-neutral-900 !text-white font-semibold text-sm shadow-xl transition-all"
            >
              <span>Build Your First Funnel Free</span>
              <ArrowRightOutlined className="text-xs !text-white" />
            </Link>

            <Link
              href="/login?demo=1"
              style={{ backgroundColor: "#bfbff9", color: "#000000", border: "2px solid #000000" }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full hover:bg-white text-sm font-semibold !text-black transition-all shadow-2xs"
            >
              <span className="!text-black">Launch Sandbox Simulator</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3-STEP VISUAL ENGINE PIPELINE ────────────────────────────────────── */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#0000e9]">
              How the Engine Operates
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Three Precision Steps. Fully Automated.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-4 shadow-sm hover:border-[#6666f1] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#bfbff9] text-[#00008b] flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Intelligent Keyword Trigger</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Match exact words like `PRICE`, `LINK`, `VIP`, `RECIPE` or use wildcard regex. Detect buyer intent even through emojis and typo variations.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 font-mono text-[11px] text-slate-700 border border-slate-200">
                match: /(link|buy|shop|price|vip)/i
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-4 shadow-sm hover:border-[#ed83b3] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#f7cbdf] text-[#871d4d] flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Randomized Public Reply</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Protect your Instagram account score by automatically rotating between multiple friendly public comments. Prevents robotic repetition flags.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 font-mono text-[11px] text-slate-700 border border-slate-200">
                replies: ["Check your DMs!", "Sent the link!"]
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-4 shadow-sm hover:border-[#ffe006] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#ffefb2] text-[#997a00] flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Instant Tracked DM Delivery</h3>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Dispatch rich interactive card with dynamic discount code, deep links directly into your Shopify/Stripe checkout, and conversion tracking tags.
              </p>
              <div className="p-3 rounded-xl bg-slate-50 font-mono text-[11px] text-slate-700 border border-slate-200">
                target: Direct DM &bull; latency: &lt;1.8s
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE WORKFLOW RULE BUILDER SIMULATION ──────────────────────── */}
      <section className="py-20 bg-white border-y border-[#e9e9ee]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#00008b]">
              Interactive Rule Playground
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Test How the Engine Processes Trigger Rules
            </h2>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-[#fafaf9] border-2 border-[#e9e9ee] space-y-6 shadow-md">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">
                Simulated Public Comment on Your Post:
              </label>
              <input
                type="text"
                value={testComment}
                onChange={(e) => setTestComment(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 font-medium text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00008b]"
              />
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700">Quick Test Trigger Keywords:</span>
              <div className="flex flex-wrap gap-2">
                {["LINK", "PRICE", "VIP", "DISCOUNT", "SYLLABUS"].map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => handleTestTrigger(kw)}
                    className="px-3.5 py-1.5 rounded-full bg-white border border-[#6666f1] text-[#00008b] font-semibold text-xs hover:bg-[#bfbff9] transition-colors cursor-pointer"
                  >
                    Test '{kw}'
                  </button>
                ))}
              </div>
            </div>

            {simulatedReply && (
              <div className="p-4 rounded-2xl bg-[#bfbff9] border-2 border-[#6666f1] space-y-1 animate-page-entrance">
                <span className="text-[10px] font-semibold uppercase text-[#00008b]">Engine Execution Log:</span>
                <p className="text-xs font-medium text-[#00008b] font-mono leading-relaxed">
                  {simulatedReply}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── RADIANT FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-[#bfbff9] via-[#f7cbdf] to-[#ffefb2] border-2 border-[#6666f1] space-y-5 shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Ready to Stop Losing Instagram Comment Sales?
            </h2>
            <p className="text-sm text-slate-700 max-w-lg mx-auto font-normal leading-relaxed">
              Join hundreds of stores and creators running official Meta v21.0 Comment-to-DM workflows with zero manual typing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/login"
                style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                className="w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-sm hover:bg-neutral-900 !text-white shadow-xl transition-all"
              >
                <span className="!text-white">Get Started Free &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
