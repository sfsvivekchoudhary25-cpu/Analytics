"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ThunderboltFilled,
  RobotOutlined,
  InstagramOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  SafetyCertificateFilled,
  LockOutlined,
  SlidersOutlined,
  FireOutlined,
  MessageOutlined,
  ShareAltOutlined,
  CheckOutlined,
  DownOutlined,
  UpOutlined,
  GlobalOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  StarFilled,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";

// ── TRIGGER KEYWORD DEMO PRESETS ──────────────────────────────────────────────
const DEMO_PRESETS = [
  {
    keyword: "LINK",
    comment: "Where can I get this jacket? Need the link! 🔥",
    reply: "Sent you the VIP checkout link in your DMs! Check your message requests 🚀",
    dmTitle: "VIP Drop Access: Oversized Vintage Jacket",
    dmDesc: "Hey Sarah! 👋 Here is your exclusive direct link with 15% off applied at checkout:",
    dmButton: "Shop Vintage Jacket ($68.00)",
    tag: "E-Commerce",
  },
  {
    keyword: "PRICE",
    comment: "How much is this coaching program? 💬",
    reply: "Just messaged you the full program syllabus and early-bird pricing! ✨",
    dmTitle: "Creator Accelerator 2026 Syllabus",
    dmDesc: "Hey Alex! Early bird pricing is $199 (reg $399). Click below to view the syllabus and book your onboarding call:",
    dmButton: "View Syllabus & Enroll ($199)",
    tag: "Digital Product",
  },
  {
    keyword: "VIP",
    comment: "VIP please! Can't wait for Friday's launch 🎉",
    reply: "You're on the VIP list! Check your DMs for your secret 1-hour early access pass 🔑",
    dmTitle: "Exclusive VIP Early Access Pass",
    dmDesc: "Welcome to the inner circle! You get access 60 minutes before the public release on Friday at 9 AM EST:",
    dmButton: "Activate VIP Pass (#VIP-841)",
    tag: "Event & Launch",
  },
  {
    keyword: "FREEBIE",
    comment: "Would love the free Notion content template! 📚",
    reply: "DM sent with your free Notion template download link! Enjoy! 🎁",
    dmTitle: "Free Notion Content Planner Template",
    dmDesc: "Hey! Tap below to duplicate the template directly into your Notion workspace in 1 click:",
    dmButton: "Download Notion Template (Free)",
    tag: "Lead Magnet",
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

export default function ExplorePage() {
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Simulator state
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [customKeyword, setCustomKeyword] = useState("");
  const [simState, setSimState] = useState<"idle" | "triggered" | "delivered">("delivered");
  const [simStepText, setSimStepText] = useState("Live Simulated Direct Message Ready");

  // ROI Calculator state
  const [monthlyComments, setMonthlyComments] = useState(2500);

  // FAQ state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Current selected preset
  const currentPreset = DEMO_PRESETS[activePresetIdx];

  // Handle preset change
  const handleSelectPreset = (idx: number) => {
    setActivePresetIdx(idx);
    setCustomKeyword("");
    triggerAnimation();
  };

  const handleCustomKeywordChange = (val: string) => {
    setCustomKeyword(val);
    triggerAnimation();
  };

  const triggerAnimation = () => {
    setSimState("triggered");
    setSimStepText("⚡ Webhook Trigger Detected: Generating Response...");
    setTimeout(() => {
      setSimState("delivered");
      setSimStepText("✓ Verified Private DM Delivered in 0.8s");
    }, 700);
  };

  // Dynamic calculations for ROI
  const hoursSaved = Math.round((monthlyComments * 42) / 3600);
  const qualifiedLeads = Math.round(monthlyComments * 0.62);
  const estimatedRevenue = Math.round(qualifiedLeads * 0.08 * 45);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white overflow-x-hidden">
      {/* ── 1. TOP ANNOUNCEMENT RIBBON ────────────────────────────────────────── */}
      <div className="relative z-50 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white text-xs font-medium py-2 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Meta Verified
            </span>
            <span className="truncate">
              Direct Meta Graph API v21.0 Certified &bull; Official Facebook Login for Business Integration
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-[11px] text-white/90">
            <Link
              href="/login?demo=1"
              className="font-semibold underline underline-offset-2 hover:text-white transition-colors"
            >
              Reviewer Demo Sandbox &rarr;
            </Link>
            <span className="inline-flex items-center gap-1 opacity-75">
              <GlobalOutlined /> Global API
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. STICKY MODERN NAVBAR ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/explore" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Fabroniee"
              className="w-9 h-9 object-contain rounded-xl shadow-md border border-slate-700/60 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold tracking-tight text-white leading-none">
                  Fabroniee
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-1.5 py-0.5 rounded-md">
                  Explore
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Instagram DM Automation
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#simulator" className="hover:text-white transition-colors">
              Live Simulator
            </a>
            <a href="#pillars" className="hover:text-white transition-colors">
              Platform Features
            </a>
            <a href="#calculator" className="hover:text-white transition-colors">
              ROI Calculator
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security &amp; Meta Trust
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 !text-white text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              <span className="!text-white">Get Started Free</span>
              <ArrowRightOutlined className="text-[10px] !text-white" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <CloseOutlined className="text-xl" /> : <MenuOutlined className="text-xl" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-slate-950 border-b border-slate-800 px-6 py-6 space-y-4 animate-page-entrance">
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              Live Simulator
            </a>
            <a
              href="#pillars"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              Platform Features
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              ROI Calculator
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              Security &amp; Meta Trust
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-300 hover:text-white"
            >
              FAQ
            </a>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
              <Link
                href="/login"
                className="w-full py-2.5 text-center text-sm font-semibold rounded-xl bg-slate-900 text-white"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="w-full py-2.5 text-center text-sm font-bold rounded-xl bg-blue-600 text-white shadow-md"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 3. HERO SECTION WITH SPLIT INTERACTIVE SIMULATOR ────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[420px] h-[420px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Headline & Value Prop (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Next-Gen Instagram Social Commerce</span>
                <span className="text-slate-600">&bull;</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/meta-logo.png" alt="Meta" className="h-3 w-auto object-contain shrink-0" />
                <span className="text-blue-400 font-bold">Graph API v21.0</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
                Turn Every Instagram Comment Into An{" "}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
                  Instant Sales DM
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Stop letting high-intent reel comments slip away. Automatically dispatch direct checkout links, answer product questions with AI, and convert 24h story viewers into ongoing buyers in under 2 seconds.
              </p>

              {/* CTA Row */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 !text-white font-bold text-sm shadow-xl shadow-blue-600/25 active:scale-[0.99] transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/meta-logo.png" alt="Meta" className="h-3.5 w-auto object-contain shrink-0 brightness-0 invert" />
                  <span className="!text-white">Connect with Facebook Login</span>
                  <ArrowRightOutlined className="text-xs !text-white" />
                </Link>

                <a
                  href="#simulator"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold transition-all"
                >
                  <ThunderboltFilled className="text-amber-400" />
                  <span>Test Live Simulator Below</span>
                </a>
              </div>

              {/* Trust Micro-Row */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircleFilled className="text-emerald-400" />
                  <span>Zero Password Storage</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircleFilled className="text-emerald-400" />
                  <span>AES-256 Encrypted Tokens</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircleFilled className="text-emerald-400" />
                  <span>Anti-Spam Delay Variance</span>
                </div>
              </div>
            </div>

            {/* Right Live Interactive Simulator Card (5 cols) */}
            <div id="simulator" className="lg:col-span-5 relative">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
                {/* Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white tracking-tight uppercase">
                      Interactive Live Simulator
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-blue-400 bg-blue-950/80 border border-blue-900/70 px-2 py-0.5 rounded-full">
                    {simStepText}
                  </span>
                </div>

                {/* Preset Keywords Switcher */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">
                    Click a trigger keyword to simulate instant automation:
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {DEMO_PRESETS.map((p, idx) => (
                      <button
                        key={p.keyword}
                        type="button"
                        onClick={() => handleSelectPreset(idx)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer ${
                          activePresetIdx === idx
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400/50"
                            : "bg-slate-800/90 text-slate-300 hover:bg-slate-700/80 hover:text-white"
                        }`}
                      >
                        {p.keyword}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Simulated Public Instagram Comment */}
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <InstagramOutlined className="text-pink-400" />
                      <span>Public Instagram Reel Comment</span>
                    </span>
                    <span className="text-[10px]">Just now</span>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[1.5px] shrink-0">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                        S
                      </div>
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>@sarah_creator</span>
                        <span className="text-[10px] text-slate-500 font-normal">Fan</span>
                      </div>
                      <p className="text-slate-200 mt-0.5 leading-snug font-medium">
                        {currentPreset.comment}
                      </p>
                    </div>
                  </div>

                  {/* Public Reply Generated */}
                  <div className="ml-9 p-2 rounded-xl bg-blue-950/40 border border-blue-900/40 text-[11px] text-blue-200 flex items-start gap-1.5">
                    <CheckOutlined className="text-blue-400 text-xs shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">@fabroniee:</strong> {currentPreset.reply}
                    </span>
                  </div>
                </div>

                {/* 2. Simulated Instant Private DM Card Delivered */}
                <div
                  className={`p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-800/40 space-y-2.5 transition-all duration-300 ${
                    simState === "delivered" ? "opacity-100 scale-100" : "opacity-60 scale-[0.99]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-indigo-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <MessageOutlined /> Instant Direct Message (DM)
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-800/60 text-emerald-300 text-[10px]">
                      Delivered in 0.8s
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">{currentPreset.dmTitle}</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {currentPreset.dmDesc}
                    </p>

                    {/* Rich Action Button inside DM */}
                    <button
                      type="button"
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-between shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                    >
                      <span>{currentPreset.dmButton}</span>
                      <ArrowRightOutlined className="text-[10px]" />
                    </button>
                  </div>
                </div>

                {/* Conversion Tag */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Targeted Funnel: <strong className="text-slate-200">{currentPreset.tag}</strong></span>
                  <span className="text-emerald-400 font-semibold">+42% Higher Click-Through</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. LIVE METRICS & PERFORMANCE BANNER ──────────────────────────────── */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                &lt; 1.8s
              </div>
              <p className="text-xs font-medium text-slate-400">
                Average DM Delivery Latency
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                89.4%
              </div>
              <p className="text-xs font-medium text-slate-400">
                Average Direct Message Open Rate
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-blue-400 tracking-tight">
                +34.8%
              </div>
              <p className="text-xs font-medium text-slate-400">
                Conversion Lift vs. "Link-in-Bio"
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-purple-400 tracking-tight">
                100%
              </div>
              <p className="text-xs font-medium text-slate-400">
                Official Meta Graph API Compliant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. THE 4 CORE AUTOMATION PILLARS ──────────────────────────────────── */}
      <section id="pillars" className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-xs font-bold text-blue-300">
              <ThunderboltFilled /> The Complete Social Commerce Suite
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Four Engines. Zero Manual Typing.
            </h2>
            <p className="text-base text-slate-400 leading-relaxed">
              Everything modern creators, DTC brands, and digital agencies need to capture leads and turn Instagram engagement into real revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pillar 1: Comment-to-DM Engine */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 space-y-5 hover:border-blue-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl group-hover:scale-110 transition-transform">
                <MessageOutlined />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Instant Comment-to-DM Funnels
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Trigger targeted direct messages the millisecond a follower comments specific keywords (`PRICE`, `LINK`, `VIP`, `RECIPE`). Automatically rotate randomized public replies to keep your engagement organic and safe from algorithmic spam limits.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-blue-400" />
                  <span>Exact, partial, or wildcard keyword matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-blue-400" />
                  <span>Configurable delay timers (0s to 120s)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-blue-400" />
                  <span>Single-use checkout discounts &amp; link tracking</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: AI Autonomous Co-Pilot */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 space-y-5 hover:border-purple-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl group-hover:scale-110 transition-transform">
                <RobotOutlined />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Autonomous AI Conversational Co-Pilot
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Train an intelligent AI that knows your products, sizing, hours, and catalog. When customers ask complex questions in DMs or comments, it responds warmly in their language (English, Spanish, Hindi, French) with strict guardrails against hallucinations.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-purple-400" />
                  <span>Custom business knowledge &amp; strict safety rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-purple-400" />
                  <span>Automatic language &amp; script detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-purple-400" />
                  <span>Seamless human takeover trigger whenever requested</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: 24h Story Reaction Funnels */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 space-y-5 hover:border-pink-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 text-xl group-hover:scale-110 transition-transform">
                <FireOutlined />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  24-Hour Story Reaction Automation
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Instagram Stories expire in 24 hours, but their leads don't have to. Turn emoji fire reactions (`🔥`), quick poll replies, and story question stickers into automated personalized DM conversations with instant download links.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-pink-400" />
                  <span>Detects emoji reactions (`🔥`, `❤️`, `👏`)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-pink-400" />
                  <span>Interactive mobile device simulator in dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-pink-400" />
                  <span>Direct Cloudinary media ingestion &amp; story posting</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4: Customer UGC Engine */}
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 space-y-5 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl group-hover:scale-110 transition-transform">
                <GiftOutlined />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Customer UGC Ingestion &amp; Reward Engine
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  When loyal customers tag your handle in their photos, Fabroniee intercepts the webhook, queues the image in an admin moderation inbox, and with 1 click republishes it to your feed while firing a thank-you discount DM back to the customer.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-emerald-400" />
                  <span>Webhook moderation inbox with 1-click approvals</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-emerald-400" />
                  <span>Automatic thank-you reward DMs to creator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-emerald-400" />
                  <span>Generates endless viral social proof organically</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. INTERACTIVE ROI & TIME-SAVED CALCULATOR ────────────────────────── */}
      <section id="calculator" className="py-20 bg-slate-900/60 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-xs font-bold text-emerald-300">
              <RiseOutlined /> Interactive ROI Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              How Much Revenue &amp; Time Are You Leaving on the Table?
            </h2>
            <p className="text-sm text-slate-400">
              Drag the slider below to estimate how much manual labor and lost sales Fabroniee recovers for your business every month.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-10 shadow-2xl space-y-8">
            {/* Slider Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">
                  Monthly Instagram Comments on Your Account:
                </span>
                <span className="text-2xl font-black text-blue-400 font-mono">
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
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>500 comments</span>
                <span>10,000 comments</span>
                <span>25,000+ comments</span>
              </div>
            </div>

            {/* Calculated Impact Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                <div className="text-xs text-slate-400 font-medium">Manual Hours Saved</div>
                <div className="text-3xl font-black text-white font-mono flex items-center justify-center gap-1">
                  <ClockCircleOutlined className="text-amber-400 text-xl" />
                  <span>~{hoursSaved} hrs</span>
                </div>
                <div className="text-[11px] text-slate-500">No copy-pasting DMs by hand</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                <div className="text-xs text-slate-400 font-medium">Qualified Leads Captured</div>
                <div className="text-3xl font-black text-emerald-400 font-mono flex items-center justify-center gap-1">
                  <CheckCircleFilled className="text-emerald-400 text-xl" />
                  <span>{qualifiedLeads.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-slate-500">Directly into chat inbox</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                <div className="text-xs text-slate-400 font-medium">Projected Extra Sales</div>
                <div className="text-3xl font-black text-blue-400 font-mono">
                  ${estimatedRevenue.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500">Based on 8% DM conversion lift</div>
              </div>
            </div>

            {/* Bottom CTA within Calculator */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-purple-950/60 border border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-300">
                Ready to automate your comments and reclaim <strong className="text-white">{hoursSaved} hours</strong> this month?
              </div>
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
              >
                Start Free Trial &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. OFFICIAL META SECURITY & COMPLIANCE ARCHITECTURE ───────────────── */}
      <section id="security" className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
              <SafetyCertificateFilled className="text-blue-400" /> Official Security Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Built on Official Meta Graph APIs.
              <br />
              Zero Scrapers. Zero Banning Risk.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Third-party web scrapers that log into your Instagram account with your password put your entire business at risk of permanent deletion. Fabroniee operates strictly through authorized Meta developer endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-lg">
                <LockOutlined />
              </div>
              <h4 className="text-base font-bold text-white">Direct Meta OAuth 2.0</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                You never give us your Instagram password. Authentication happens on Meta's official login dialog, granting scoped permissions exclusively for page comments and messages.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center text-lg">
                <SafetyCertificateFilled />
              </div>
              <h4 className="text-base font-bold text-white">AES-256 Encrypted Tokens</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All long-lived Page access tokens and Instagram credentials are encrypted at rest using military-grade 256-bit AES symmetric keys before entering our PostgreSQL database.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-lg">
                <CheckCircleFilled />
              </div>
              <h4 className="text-base font-bold text-white">Automated Data Deletion</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Users can permanently delete all associated tokens, automations, and logs at any time from their settings panel or through our live Meta compliance endpoint at <Link href="/data-deletion" className="text-blue-400 underline">/data-deletion</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. FREQUENTLY ASKED QUESTIONS (FAQ) ────────────────────────────────── */}
      <section id="faq" className="py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/40 transition-colors"
                  >
                    <span className="text-sm font-bold text-white">{item.q}</span>
                    <span className="text-slate-400 text-xs shrink-0">
                      {isOpen ? <UpOutlined /> : <DownOutlined />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-900 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 9. FINAL HIGH-CONVERSION CTA ───────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-indigo-950/30 to-slate-950 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/50 border border-blue-700/60 text-xs font-bold text-blue-300">
            <StarFilled className="text-amber-400" /> Start Converting Today
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Ready to Put Your Instagram Comments On Autopilot?
          </h2>

          <p className="text-base text-slate-300 max-w-xl mx-auto font-normal">
            Join hundreds of creators and brands turning social engagement into measurable revenue. Connect in under 60 seconds with official Meta Login.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 !text-white font-bold text-sm shadow-xl shadow-blue-500/30 active:scale-[0.99] transition-all"
            >
              <span className="!text-white">Get Started with Meta Login &rarr;</span>
            </Link>

            <Link
              href="/login?demo=1"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-all"
            >
              ⚡ Launch Reviewer Demo Mode
            </Link>
          </div>
        </div>
      </section>

      {/* ── 10. COMPREHENSIVE FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-slate-950 py-14 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Fabroniee" className="w-8 h-8 rounded-lg object-contain" />
                <span className="text-lg font-bold text-white tracking-tight">Fabroniee</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Official Instagram comment-to-DM funnels, autonomous AI co-pilot, and social commerce automation built on the Meta Graph API v21.0.
              </p>
              <div className="text-[11px] text-slate-500">
                Support: <a href="mailto:support@fabroniee.store" className="text-blue-400 underline">support@fabroniee.store</a>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Product</div>
              <ul className="space-y-2">
                <li><a href="#simulator" className="hover:text-white transition-colors">Live Simulator</a></li>
                <li><a href="#pillars" className="hover:text-white transition-colors">Comment-to-DM</a></li>
                <li><a href="#pillars" className="hover:text-white transition-colors">AI Co-Pilot</a></li>
                <li><a href="#pillars" className="hover:text-white transition-colors">Story Reactions</a></li>
                <li><a href="#pillars" className="hover:text-white transition-colors">Customer UGC Engine</a></li>
              </ul>
            </div>

            {/* Col 3: Legal & Meta Compliance */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Compliance</div>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/data-deletion" className="hover:text-white transition-colors">Data Deletion Instructions</Link></li>
                <li><Link href="/login?demo=1" className="hover:text-white transition-colors">Reviewer Sandbox</Link></li>
              </ul>
            </div>

            {/* Col 4: Platform */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Access</div>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-white transition-colors">Log In with Facebook</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Log In with Instagram</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">App Dashboard</Link></li>
                <li><Link href="/comments" className="hover:text-white transition-colors">DM Automations</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Fabroniee. All rights reserved. Meta, Instagram, and Facebook are trademarks of Meta Platforms, Inc.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-slate-400">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-400">Terms</Link>
              <Link href="/data-deletion" className="hover:text-slate-400">Data Deletion</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
