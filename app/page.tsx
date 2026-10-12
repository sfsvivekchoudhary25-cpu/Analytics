"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ThunderboltFilled,
  RobotOutlined,
  InstagramOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  SafetyCertificateFilled,
  LockOutlined,
  FireOutlined,
  MessageOutlined,
  CheckOutlined,
  DownOutlined,
  UpOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  StarFilled,
  AppstoreOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { auth } from "@/lib/api";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import SplitCard from "@/components/marketing/SplitCard";
import TechText from "@/components/TechText";

// ── TRIGGER KEYWORD DEMO PRESETS ──────────────────────────────────────────────
const DEMO_PRESETS = [
  {
    keyword: "LINK",
    comment: "Where can I get this jacket? Need the link!",
    reply: "Sent you the VIP checkout link in your DMs! Check your message requests",
    dmTitle: "VIP Drop Access: Oversized Vintage Jacket",
    dmDesc: "Hey Sarah! Here is your exclusive direct link with 15% off applied at checkout:",
    dmButton: "Shop Vintage Jacket ($68.00)",
    tag: "E-Commerce",
  },
  {
    keyword: "PRICE",
    comment: "How much is this coaching program?",
    reply: "Just messaged you the full program syllabus and early-bird pricing!",
    dmTitle: "Creator Accelerator 2026 Syllabus",
    dmDesc: "Hey Alex! Early bird pricing is $199 (reg $399). Click below to view the syllabus and book your onboarding call:",
    dmButton: "View Syllabus & Enroll ($199)",
    tag: "Digital Product",
  },
  {
    keyword: "VIP",
    comment: "VIP please! Can't wait for Friday's launch",
    reply: "You're on the VIP list! Check your DMs for your secret 1-hour early access pass",
    dmTitle: "Exclusive VIP Early Access Pass",
    dmDesc: "Welcome to the inner circle! You get access 60 minutes before the public release on Friday at 9 AM EST:",
    dmButton: "Activate VIP Pass (#VIP-841)",
    tag: "Event & Launch",
  },
  {
    keyword: "FREEBIE",
    comment: "Would love the free Notion content template!",
    reply: "DM sent with your free Notion template download link! Enjoy!",
    dmTitle: "Free Notion Content Planner Template",
    dmDesc: "Hey! Tap below to duplicate the template directly into your Notion workspace in 1 click:",
    dmButton: "Download Notion Template (Free)",
    tag: "Lead Magnet",
  },
];

// ── CORE AUTOMATION ENGINES (KINETIC TEXT PRESETS) ───────────────────────────
const ENGINE_PRESETS = [
  {
    id: "workflow",
    label: "Comment-to-DM",
    keyword: "COMMENT-TO-DM",
    title: "Instant Comment Trigger Funnels",
    desc: "Dispatches private VIP checkout links in < 1.8s the millisecond a follower comments on your reels or posts.",
    bgColor: "#bfbff9",
    borderColor: "border-[#6666f1]",
    textColor: "text-[#00008b]",
    accentColor: "#bfbff9",
    href: "/platform/workflow",
  },
  {
    id: "ai",
    label: "AI Co-Pilot",
    keyword: "AI CO-PILOT",
    title: "Autonomous Conversational Agent",
    desc: "Answers complex customer questions about sizing, inventory, and order status 24/7 in 40+ languages.",
    bgColor: "#f8d7ca",
    borderColor: "border-[#eea07f]",
    textColor: "text-[#883a19]",
    accentColor: "#f8d7ca",
    href: "/platform/ai",
  },
  {
    id: "stories",
    label: "Story Funnels",
    keyword: "STORY FUNNELS",
    title: "24h Story Reaction Automation",
    desc: "Captures high-intent leads from expiring stories by converting reactions into ongoing DM conversations.",
    bgColor: "#f7cbdf",
    borderColor: "border-[#ed83b3]",
    textColor: "text-[#871d4d]",
    accentColor: "#f7cbdf",
    href: "/platform/workflow",
  },
  {
    id: "ugc",
    label: "UGC Ingestion",
    keyword: "UGC INGESTION",
    title: "Customer Photo Moderation & Rewards",
    desc: "Curates tagged customer unboxings, republishes to feed with 1 click, and fires automatic reward discount coupons.",
    bgColor: "#ffefb2",
    borderColor: "border-[#ffe006]",
    textColor: "text-[#997a00]",
    accentColor: "#ffefb2",
    href: "/solutions",
  },
];

// ── FAQ DATA ──────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Will automating comments and DMs get my Instagram account flagged or banned?",
    a: "No! Fabroniee connects exclusively through the official Meta Graph API v21.0 using official Facebook Login for Business OAuth. We never ask for your Instagram password, and we strictly follow Meta's rate limits and randomized reply spacing to ensure 100% platform safety.",
  },
  {
    q: "Do I need an Instagram Business or Creator Account?",
    a: "Yes. Meta's official Graph API requires your Instagram account to be set as a Business or Creator account and linked to a Facebook Page you manage. The setup takes under 60 seconds directly through our guided onboarding.",
  },
  {
    q: "How does the AI Co-Pilot handle customer questions?",
    a: "Our AI assistant uses strict contextual boundaries defined by you. It can answer shipping questions, product availability, and sizing in the customer's native language. If asked about unknown facts, it gracefully directs them to human support without guessing.",
  },
  {
    q: "Can I test the platform before connecting my live production account?",
    a: "Yes! You can explore this entire interactive page, or click 'Launch Reviewer Demo' to explore a fully pre-populated sandbox dashboard with live simulator rules and mock analytics.",
  },
  {
    q: "What happens if a customer wants their data deleted?",
    a: "We comply 100% with Meta Platform Terms and GDPR. Users can request automated data deletion in 1 click from their account panel or via our dedicated /data-deletion compliance endpoint.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [activeEngineIdx, setActiveEngineIdx] = useState(0);
  const [simState, setSimState] = useState<"idle" | "triggered" | "delivered">("delivered");
  const [simStepText, setSimStepText] = useState("Delivered in 0.8s");
  const [monthlyComments, setMonthlyComments] = useState(2500);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Catch any OAuth token landed on "/" and immediately forward to /dashboard
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const authToken = q.get("auth_token");
    if (authToken) {
      auth.set(authToken);
      router.replace("/dashboard");
    }
  }, [router]);

  const currentPreset = DEMO_PRESETS[activePresetIdx];
  const currentEngine = ENGINE_PRESETS[activeEngineIdx];

  const handleSelectPreset = (idx: number) => {
    setActivePresetIdx(idx);
    setSimState("triggered");
    setSimStepText("Trigger Detected...");
    setTimeout(() => {
      setSimState("delivered");
      setSimStepText("Delivered in 0.8s");
    }, 600);
  };

  const hoursSaved = Math.round((monthlyComments * 42) / 3600);
  const qualifiedLeads = Math.round(monthlyComments * 0.62);
  const estimatedRevenue = Math.round(qualifiedLeads * 0.08 * 45);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans antialiased selection:bg-[#f7cbdf] selection:text-[#871d4d] overflow-x-hidden">
      {/* ── SHARED MARKETING HEADER ── */}
      <MarketingNav />

      {/* ── 3. HERO SECTION WITH SPLIT INTERACTIVE SIMULATOR ────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-white">
        {/* Soft Ambient Radiance using Fabulate Signature Pastels */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#f7cbdf] rounded-full blur-[140px] pointer-events-none opacity-70" />
        <div className="absolute top-1/3 left-1/4 w-[420px] h-[420px] bg-[#f8d7ca] rounded-full blur-[140px] pointer-events-none opacity-60" />
        <div className="absolute bottom-0 right-10 w-[350px] h-[350px] bg-[#bfbff9] rounded-full blur-[140px] pointer-events-none opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Headline & Value Prop (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Top Tag Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f7cbdf] border border-[#ed83b3] text-xs font-medium text-[#871d4d] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#e13181] animate-pulse" />
                <span>The Operating System for Instagram Commerce</span>
                <span className="text-[#ed83b3]">&bull;</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/meta-logo.png" alt="Meta" className="h-3.5 w-auto object-contain shrink-0" />
                <span className="font-semibold">v21.0</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Turn Every Instagram Comment Into An{" "}
                <span className="text-[#e13181]">
                  Instant Sales DM
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Stop letting high-intent reel comments slip away. Automatically dispatch direct checkout links, answer product questions with AI, and convert 24h story viewers into ongoing buyers in under 2 seconds.
              </p>

              {/* CTA Row */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/login"
                  style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full hover:bg-neutral-800 !text-white font-semibold text-sm shadow-xl active:scale-[0.99] transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/meta-logo.png" alt="Meta" className="h-4 w-auto object-contain shrink-0 brightness-0 invert" />
                  <span className="!text-white">Connect with Facebook Login</span>
                  <ArrowRightOutlined className="text-xs !text-white" />
                </Link>

                <a
                  href="#simulator"
                  style={{ backgroundColor: "#f7cbdf", color: "#871d4d", border: "2px solid #ed83b3" }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full hover:bg-white text-sm font-semibold transition-all shadow-2xs"
                >
                  <ThunderboltFilled className="text-[#e13181]" />
                  <span>Test Live Simulator Below</span>
                </a>
              </div>

              {/* Trust Micro-Row */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-normal text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircleFilled className="text-emerald-500" />
                  <span>Zero Password Storage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircleFilled className="text-emerald-500" />
                  <span>AES-256 Encrypted Tokens</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircleFilled className="text-emerald-500" />
                  <span>Anti-Spam Delay Variance</span>
                </div>
              </div>
            </div>

            {/* Right Live Interactive Simulator Card (5 cols) */}
            <div id="simulator" className="lg:col-span-5 relative">
              <div className="rounded-3xl border border-[#e9e9ee] bg-white p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
                {/* Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-[#e9e9ee]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e13181] animate-pulse" />
                    <span className="text-xs font-semibold text-slate-900 tracking-tight uppercase">
                      Interactive Live Simulator
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-[#871d4d] bg-[#f7cbdf] border border-[#ed83b3] px-2.5 py-0.5 rounded-full">
                    {simStepText}
                  </span>
                </div>

                {/* Preset Keywords Switcher */}
                <div>
                  <div className="text-[11px] font-normal text-slate-500 mb-2">
                    Click a trigger keyword to simulate instant automation:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {DEMO_PRESETS.map((p, idx) => (
                      <button
                        key={p.keyword}
                        type="button"
                        onClick={() => handleSelectPreset(idx)}
                        className={`px-2 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          activePresetIdx === idx
                            ? "bg-[#e13181] text-white shadow-md shadow-[#e13181]/30"
                            : "bg-[#e9e9ee] text-slate-700 hover:bg-[#f7cbdf] hover:text-[#871d4d]"
                        }`}
                      >
                        {p.keyword}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Simulated Public Instagram Comment */}
                <div className="p-4 rounded-2xl bg-[#fafaf9] border border-[#e9e9ee] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-800">
                      <InstagramOutlined className="text-pink-500 text-sm" />
                      <span>Public Instagram Reel Comment</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[1.5px] shrink-0">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-900">
                        S
                      </div>
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>@sarah_creator</span>
                        <span className="text-[10px] text-slate-400 font-normal">Fan</span>
                      </div>
                      <p className="text-slate-700 mt-0.5 leading-snug font-normal">
                        {currentPreset.comment}
                      </p>
                    </div>
                  </div>

                  {/* Public Reply Generated */}
                  <div className="ml-9 p-2.5 rounded-xl bg-white border border-[#e9e9ee] text-[11px] text-slate-700 flex items-start gap-2 shadow-2xs">
                    <CheckOutlined className="text-[#e13181] text-xs shrink-0 mt-0.5 font-bold" />
                    <span>
                      <strong className="text-slate-900 font-semibold">@fabroniee:</strong> {currentPreset.reply}
                    </span>
                  </div>
                </div>

                {/* 2. Simulated Instant Private DM Card Delivered (Fabulate Soft Pink Accent) */}
                <div
                  className={`p-4 rounded-2xl bg-[#f7cbdf] border border-[#ed83b3] space-y-2.5 transition-all duration-300 ${
                    simState === "delivered" ? "opacity-100 scale-100" : "opacity-60 scale-[0.99]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-[#871d4d] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <MessageOutlined /> Instant Direct Message (DM)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#ed83b3] text-[#e13181] text-[10px] font-medium shadow-2xs">
                      Delivered in 0.8s
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#f7cbdf] space-y-2 shadow-xs">
                    <div className="text-xs font-semibold text-slate-900">{currentPreset.dmTitle}</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {currentPreset.dmDesc}
                    </p>

                    {/* Rich Action Button inside DM */}
                    <button
                      type="button"
                      style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                      className="w-full py-2.5 px-3 rounded-full hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-between shadow-md transition-all cursor-pointer"
                    >
                      <span className="text-white">{currentPreset.dmButton}</span>
                      <ArrowRightOutlined className="text-[10px] text-white" />
                    </button>
                  </div>
                </div>

                {/* Conversion Tag */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Targeted Funnel: <strong className="text-slate-900 font-medium">{currentPreset.tag}</strong></span>
                  <span className="text-emerald-600 font-semibold">+42% Higher Click-Through</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. LIVE METRICS & PERFORMANCE BANNER ──────────────────────────────── */}
      <section className="border-y border-[#e9e9ee] bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-mono">
                &lt; 1.8s
              </div>
              <p className="text-xs font-normal text-slate-500">
                Average DM Delivery Latency
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-[#e13181] tracking-tight font-mono">
                89.4%
              </div>
              <p className="text-xs font-normal text-slate-500">
                Average Direct Message Open Rate
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-[#0000e9] tracking-tight font-mono">
                +34.8%
              </div>
              <p className="text-xs font-normal text-slate-500">
                Conversion Lift vs. "Link-in-Bio"
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-[#e3622b] tracking-tight font-mono">
                100%
              </div>
              <p className="text-xs font-normal text-slate-500">
                Official Meta Graph API Compliant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. INTEGRATED KINETIC AUTOMATION ENGINE (Fabulate 'We help brands automate:') ── */}
      <section className="py-16 bg-[#fafaf9] border-b border-[#e9e9ee]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#e9e9ee] text-xs font-medium text-slate-700 shadow-2xs">
              <ThunderboltFilled className="text-[#e13181]" /> The Autonomous Social Commerce Engine
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
              We help modern brands &amp; creators automate:
            </h2>
            <p className="text-sm font-normal text-slate-600 leading-relaxed">
              Select an engine below. Hover or drag any letter to test real-time Meta Graph API trigger mechanics.
            </p>

            {/* Interactive Engine Switcher Tabs in Fabulate Colors */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              {ENGINE_PRESETS.map((eng, idx) => {
                const isSelected = activeEngineIdx === idx;
                return (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => setActiveEngineIdx(idx)}
                    style={
                      isSelected
                        ? {
                            backgroundColor: eng.bgColor,
                            borderColor: "#000000",
                            color: eng.textColor,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }
                        : undefined
                    }
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border-2 ${
                      isSelected
                        ? "scale-105"
                        : "bg-white text-slate-700 hover:text-black border-[#e9e9ee] hover:border-slate-300"
                    }`}
                  >
                    {eng.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Integrated Kinetic Engine Display Card */}
          <div className="rounded-3xl border-2 border-slate-900 bg-[#0c0d14] p-4 sm:p-7 shadow-2xl relative overflow-hidden">
            {/* Top Engine Status Ribbon */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Meta Graph API v21.0 Active
                </span>
                <span
                  className="px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider"
                  style={{ backgroundColor: currentEngine.bgColor, color: currentEngine.textColor }}
                >
                  Engine 0{activeEngineIdx + 1}
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white/60 font-mono">
                Kinetic Wireframe Physics &bull; Drag Any Letter
              </span>
            </div>

            {/* Kinetic Typography Canvas Viewport */}
            <div className="w-full h-[240px] sm:h-[280px] relative rounded-2xl overflow-hidden bg-black/70 border border-white/10 flex items-center justify-center">
              <TechText
                text={currentEngine.keyword}
                fontWeight={700}
                fontSize={110}
                reveal="letter"
                dashLength={4}
                dashGap={2}
                specks={15}
                fontFamily=""
                color="#ffffff"
                accentColor={currentEngine.accentColor}
                letterSpacing={-0.03}
                reach={180}
                softness={0.7}
                strokeWidth={1.5}
                speed={0.9}
                lineStyle="dashed"
                selection
                labels
                draggable
                sweep
              />
            </div>

            {/* Live Engine Action Bar */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-neutral-300 font-normal text-center sm:text-left text-xs max-w-xl space-y-1">
                <div className="text-white font-semibold text-sm">
                  {currentEngine.title}
                </div>
                <p className="text-neutral-400 leading-relaxed font-normal">
                  {currentEngine.desc}
                </p>
              </div>
              <Link
                href={currentEngine.href}
                style={{
                  backgroundColor: currentEngine.bgColor,
                  color: currentEngine.textColor,
                  border: "2px solid #000000",
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-xs hover:brightness-105 transition-all shrink-0 shadow-md"
              >
                <span>Explore Engine Blueprint</span>
                <ArrowRightOutlined className="text-[10px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. THE 4 CORE PLATFORM PILLARS (Fabulate's Signature 4 Color Cards) ── */}
      <section id="pillars" className="py-20 lg:py-28 relative bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f7cbdf] border border-[#ed83b3] text-xs font-medium text-[#871d4d]">
              <ThunderboltFilled className="text-[#e13181]" /> The Complete Social Commerce Suite
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Four Engines. Zero Manual Typing.
            </h2>
            <p className="text-base font-normal text-slate-600 leading-relaxed">
              Everything modern creators, DTC brands, and digital agencies need to capture leads and turn Instagram engagement into real revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* Card 1: Comment-to-DM Funnel (Signature Periwinkle Pastel) */}
            <SplitCard
              badge="Instant Automation"
              badgeIcon={<ThunderboltFilled className="text-[#0000e9] text-xs" />}
              headerIcon={<AppstoreOutlined />}
              bgColor="#bfbff9"
              borderColor="border-[#9e9efa]"
              title="Automate repetitive tasks to free resources for higher-value results."
              description="Turn viral reel comments into private VIP checkout links in under 2 seconds. Rotate randomized replies to maintain organic algorithmic safety."
              imageSrc="/card-workflow.jpg"
              imageAlt="Person in knit blue sweater holding shopping bags and tapping phone"
              statBadge={{ icon: <ThunderboltFilled className="text-white text-xs" />, text: "< 1.8s Response Latency" }}
              actionText="Comment-to-DM Engine"
              href="/platform/workflow"
            />

            {/* Card 2: AI Conversational Co-Pilot (Signature Rose Pink Pastel - Matching Reference Image!) */}
            <SplitCard
              badge="Measurement & AI"
              badgeIcon={<RobotOutlined className="text-[#e13181] text-xs" />}
              headerIcon={<AppstoreOutlined />}
              bgColor="#f7cbdf"
              borderColor="border-[#ed83b3]"
              title="Answer customer sizing, shipping, and order questions 24/7 without guessing."
              description="Deploy a conversational AI agent with strict guardrails trained on your catalog and store policies in 40+ native languages."
              imageSrc="/card-ai.jpg"
              imageAlt="Entrepreneur happily managing customer chats on mobile"
              statBadge={{ icon: <GlobalOutlined className="text-white text-xs" />, text: "40+ Languages Supported" }}
              actionText="Autonomous AI Co-Pilot"
              href="/platform/ai"
            />

            {/* Card 3: 24h Story Funnels (Signature Peach Coral Pastel) */}
            <SplitCard
              badge="Story Funnels"
              badgeIcon={<FireOutlined className="text-[#e3622b] text-xs" />}
              headerIcon={<AppstoreOutlined />}
              bgColor="#f8d7ca"
              borderColor="border-[#eea07f]"
              title="Convert temporary 24h story reactions into permanent buying relationships."
              description="Capture leads before stories vanish. Intercept emoji fire reactions and poll votes to fire personalized direct message discounts."
              imageSrc="/card-stories.jpg"
              imageAlt="Content creator reviewing Instagram stories at golden hour"
              statBadge={{ icon: <RiseOutlined className="text-white text-xs" />, text: "89.4% Story Open Rate" }}
              actionText="Story Reaction Automation"
              href="/platform/workflow"
            />

            {/* Card 4: Customer UGC Engine (Signature Butter Yellow Pastel) */}
            <SplitCard
              badge="UGC Engine"
              badgeIcon={<GiftOutlined className="text-[#997a00] text-xs" />}
              headerIcon={<AppstoreOutlined />}
              bgColor="#ffefb2"
              borderColor="border-[#ffe006]"
              title="Curate tagged customer unboxings and fire automatic thank-you rewards."
              description="Moderate tagged photos in your moderation inbox, republish to feed with 1 click, and fire automatic thank-you reward codes on autopilot."
              imageSrc="/card-ugc.jpg"
              imageAlt="Customer receiving and unboxing authentic brand order"
              statBadge={{ icon: <GiftOutlined className="text-white text-xs" />, text: "+34% Repeat Purchases" }}
              actionText="UGC Moderation & Rewards"
              href="/solutions"
            />
          </div>
        </div>
      </section>

      {/* ── 7. INTERACTIVE ROI & TIME-SAVED CALCULATOR ────────────────────────── */}
      <section id="calculator" className="py-20 bg-white border-y border-[#e9e9ee] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f7cbdf] border border-[#ed83b3] text-xs font-medium text-[#871d4d]">
              <RiseOutlined /> Interactive ROI Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              How Much Revenue &amp; Time Are You Leaving on the Table?
            </h2>
            <p className="text-sm font-normal text-slate-600 leading-relaxed">
              Drag the slider below to estimate how much manual labor and lost sales Fabroniee recovers for your business every month.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl border border-[#e9e9ee] bg-[#fafaf9] p-6 sm:p-10 shadow-xl space-y-8">
            {/* Slider Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">
                  Monthly Instagram Comments on Your Account:
                </span>
                <span className="text-2xl font-bold text-[#e13181] font-mono">
                  {monthlyComments.toLocaleString()} comments/mo
                </span>
              </div>

              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={monthlyComments}
                onChange={(e) => setMonthlyComments(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#e13181]"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>500 comments</span>
                <span>10,000 comments</span>
                <span>25,000+ comments</span>
              </div>
            </div>

            {/* Calculated Impact Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#e9e9ee]">
              <div className="p-5 rounded-2xl bg-white border border-[#e9e9ee] text-center space-y-1 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Manual Hours Saved</div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono flex items-center justify-center gap-1.5">
                  <ClockCircleOutlined className="text-[#e3622b] text-xl" />
                  <span>~{hoursSaved} hrs</span>
                </div>
                <div className="text-[11px] text-slate-400 font-normal">No copy-pasting DMs by hand</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e9e9ee] text-center space-y-1 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Qualified Leads Captured</div>
                <div className="text-2xl sm:text-3xl font-bold text-[#0000e9] font-mono flex items-center justify-center gap-1.5">
                  <CheckCircleFilled className="text-[#0000e9] text-xl" />
                  <span>{qualifiedLeads.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-normal">Directly into chat inbox</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e9e9ee] text-center space-y-1 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Projected Extra Sales</div>
                <div className="text-2xl sm:text-3xl font-bold text-[#e13181] font-mono">
                  ${estimatedRevenue.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 font-normal">Based on 8% DM conversion lift</div>
              </div>
            </div>

            {/* Bottom CTA within Calculator */}
            <div className="p-4 rounded-2xl bg-[#f7cbdf] border border-[#ed83b3] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-medium text-[#871d4d]">
                Ready to automate your comments and reclaim <strong className="text-[#e13181] font-bold">{hoursSaved} hours</strong> this month?
              </div>
              <Link
                href="/login"
                style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                className="px-6 py-3 rounded-full hover:bg-neutral-800 !text-white font-semibold text-xs shadow-md transition-all shrink-0"
              >
                <span className="!text-white">Start Free Trial &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. OFFICIAL META SECURITY & COMPLIANCE ARCHITECTURE ───────────────── */}
      <section id="security" className="py-20 lg:py-28 relative bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e9e9ee] text-xs font-medium text-[#871d4d] shadow-2xs">
              <SafetyCertificateFilled className="text-[#e13181]" /> Official Security Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Built on Official Meta Graph APIs.
              <br />
              Zero Scrapers. Zero Banning Risk.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Third-party web scrapers that log into your Instagram account with your password put your entire business at risk of permanent deletion. Fabroniee operates strictly through authorized Meta developer endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl border border-[#e9e9ee] bg-white space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#bfbff9] text-[#00008b] flex items-center justify-center text-xl font-bold">
                <LockOutlined />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Direct Meta OAuth 2.0</h4>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                You never give us your Instagram password. Authentication happens on Meta's official login dialog, granting scoped permissions exclusively for page comments and messages.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-[#e9e9ee] bg-white space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#f7cbdf] text-[#871d4d] flex items-center justify-center text-xl font-bold">
                <SafetyCertificateFilled />
              </div>
              <h4 className="text-lg font-bold text-slate-900">AES-256 Encrypted Tokens</h4>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                All long-lived Page access tokens and Instagram credentials are encrypted at rest using military-grade 256-bit AES symmetric keys before entering our PostgreSQL database.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-[#e9e9ee] bg-white space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#ffefb2] text-[#997a00] flex items-center justify-center text-xl font-bold">
                <CheckCircleFilled />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Automated Data Deletion</h4>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Users can permanently delete all associated tokens, automations, and logs at any time from their settings panel or through our live Meta compliance endpoint at <Link href="/data-deletion" className="text-[#e13181] underline font-medium">/data-deletion</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. FREQUENTLY ASKED QUESTIONS (FAQ) ────────────────────────────────── */}
      <section id="faq" className="py-20 bg-white border-t border-[#e9e9ee]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e13181]">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-[#e9e9ee] bg-[#fafaf9] overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#e9e9ee]/40 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-900">{item.q}</span>
                    <span className="text-slate-500 text-xs shrink-0">
                      {isOpen ? <UpOutlined /> : <DownOutlined />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 font-normal leading-relaxed border-t border-[#e9e9ee] pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 10. FINAL HIGH-CONVERSION CTA (Fabulate Soft Radiant Card) ─────────── */}
      <section className="py-20 relative overflow-hidden bg-[#fafaf9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="rounded-3xl border border-[#ed83b3] bg-gradient-to-br from-[#f7cbdf] via-[#ffefb2] to-[#f8d7ca] p-10 sm:p-14 space-y-6 shadow-xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#ed83b3] text-xs font-medium text-[#871d4d] shadow-2xs">
              <StarFilled className="text-amber-400" /> Start Converting Today
            </div>

            <h2 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
              Ready to Put Your Instagram Comments On Autopilot?
            </h2>

            <p className="text-base text-slate-700 max-w-xl mx-auto font-normal">
              Join hundreds of creators and brands turning social engagement into measurable revenue. Connect in under 60 seconds with official Meta Login.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                className="w-full sm:w-auto px-8 py-4 rounded-full hover:bg-neutral-800 !text-white font-semibold text-sm shadow-xl active:scale-[0.99] transition-all"
              >
                <span className="!text-white">Get Started with Meta Login &rarr;</span>
              </Link>

              <Link
                href="/login?demo=1"
                style={{ backgroundColor: "#ffffff", color: "#000000", border: "2px solid #000000" }}
                className="w-full sm:w-auto px-6 py-4 rounded-full hover:bg-slate-50 font-semibold text-sm transition-all shadow-xs"
              >
                Launch Reviewer Demo Mode
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SHARED MARKETING FOOTER ── */}
      <MarketingFooter />
    </div>
  );
}
