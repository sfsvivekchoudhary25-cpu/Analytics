"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [simState, setSimState] = useState<"idle" | "triggered" | "delivered">("delivered");
  const [simStepText, setSimStepText] = useState("Delivered in 0.8s");
  const [monthlyComments, setMonthlyComments] = useState(2500);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const currentPreset = DEMO_PRESETS[activePresetIdx];

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
      {/* ── 1. TOP ANNOUNCEMENT RIBBON (Fabulate Signature Raspberry & Soft Pink) ── */}
      <div className="relative z-50 bg-[#e13181] text-white text-xs font-medium py-2.5 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-bold text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Official Meta Verified
            </span>
            <span className="truncate">
              Direct Meta Graph API v21.0 Certified &bull; Official Facebook Login for Business Integration
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <Link
              href="/login?demo=1"
              style={{ backgroundColor: "#f7cbdf", color: "#871d4d" }}
              className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full font-bold hover:bg-white transition-colors shadow-2xs"
            >
              Reviewer Sandbox &rarr;
            </Link>
            <span className="inline-flex items-center gap-1 text-white/90">
              <GlobalOutlined /> Global API
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. STICKY CLEAN NAVBAR ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/95 border-b border-[#e9e9ee] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/explore" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Fabroniee"
              className="w-9 h-9 object-contain rounded-xl shadow-xs border border-[#e9e9ee] group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-950 leading-none">
                  Fabroniee
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#871d4d] bg-[#f7cbdf] border border-[#ed83b3] px-2.5 py-0.5 rounded-full">
                  Explore
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Instagram Comment-to-DM Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-slate-700">
            <a href="#simulator" className="hover:text-black transition-colors">
              Live Simulator
            </a>
            <a href="#pillars" className="hover:text-black transition-colors">
              Platform Features
            </a>
            <a href="#calculator" className="hover:text-black transition-colors">
              ROI Calculator
            </a>
            <a href="#security" className="hover:text-black transition-colors">
              Security &amp; Meta Trust
            </a>
            <a href="#faq" className="hover:text-black transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-800 hover:text-black px-4 py-2.5 rounded-full hover:bg-[#e9e9ee]/60 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full hover:bg-neutral-800 !text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
            >
              <span className="!text-white">Get Started Free</span>
              <ArrowRightOutlined className="text-[10px] !text-white" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-700 hover:text-black focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <CloseOutlined className="text-xl" /> : <MenuOutlined className="text-xl" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-[#e9e9ee] px-6 py-6 space-y-4 animate-page-entrance shadow-xl">
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-black"
            >
              Live Simulator
            </a>
            <a
              href="#pillars"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-black"
            >
              Platform Features
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-black"
            >
              ROI Calculator
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-black"
            >
              Security &amp; Meta Trust
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-black"
            >
              FAQ
            </a>
            <div className="pt-4 border-t border-[#e9e9ee] flex flex-col gap-2.5">
              <Link
                href="/login"
                className="w-full py-2.5 text-center text-sm font-bold rounded-full bg-[#e9e9ee] text-slate-900"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                className="w-full py-2.5 text-center text-sm font-bold rounded-full !text-white shadow-md"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f7cbdf] border-2 border-[#ed83b3] text-xs font-black text-[#871d4d] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#e13181] animate-pulse" />
                <span>The Operating System for Instagram Commerce</span>
                <span className="text-[#ed83b3]">&bull;</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/meta-logo.png" alt="Meta" className="h-3.5 w-auto object-contain shrink-0" />
                <span className="font-extrabold">v21.0</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]">
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full hover:bg-neutral-900 !text-white font-bold text-sm shadow-xl active:scale-[0.99] transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/meta-logo.png" alt="Meta" className="h-4 w-auto object-contain shrink-0 brightness-0 invert" />
                  <span className="!text-white">Connect with Facebook Login</span>
                  <ArrowRightOutlined className="text-xs !text-white" />
                </Link>

                <a
                  href="#simulator"
                  style={{ backgroundColor: "#f7cbdf", color: "#871d4d", border: "2px solid #ed83b3" }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full hover:bg-white text-sm font-bold transition-all shadow-2xs"
                >
                  <ThunderboltFilled className="text-[#e13181]" />
                  <span>Test Live Simulator Below</span>
                </a>
              </div>

              {/* Trust Micro-Row */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-600">
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
              <div className="rounded-3xl border-2 border-[#e9e9ee] bg-white p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
                {/* Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-[#e9e9ee]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e13181] animate-pulse" />
                    <span className="text-xs font-extrabold text-slate-900 tracking-tight uppercase">
                      Interactive Live Simulator
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#871d4d] bg-[#f7cbdf] border border-[#ed83b3] px-2.5 py-0.5 rounded-full">
                    {simStepText}
                  </span>
                </div>

                {/* Preset Keywords Switcher */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 mb-2">
                    Click a trigger keyword to simulate instant automation:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {DEMO_PRESETS.map((p, idx) => (
                      <button
                        key={p.keyword}
                        type="button"
                        onClick={() => handleSelectPreset(idx)}
                        className={`px-2 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all cursor-pointer ${
                          activePresetIdx === idx
                            ? "bg-[#e13181] text-white shadow-md shadow-[#e13181]/30 ring-2 ring-[#e13181]"
                            : "bg-[#e9e9ee] text-slate-800 hover:bg-[#f7cbdf] hover:text-[#871d4d]"
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
                    <span className="flex items-center gap-1.5 font-bold text-slate-800">
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
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>@sarah_creator</span>
                        <span className="text-[10px] text-slate-400 font-normal">Fan</span>
                      </div>
                      <p className="text-slate-700 mt-0.5 leading-snug font-medium">
                        {currentPreset.comment}
                      </p>
                    </div>
                  </div>

                  {/* Public Reply Generated */}
                  <div className="ml-9 p-2.5 rounded-xl bg-white border border-[#e9e9ee] text-[11px] text-slate-700 flex items-start gap-2 shadow-2xs">
                    <CheckOutlined className="text-[#e13181] text-xs shrink-0 mt-0.5 font-bold" />
                    <span>
                      <strong className="text-slate-900">@fabroniee:</strong> {currentPreset.reply}
                    </span>
                  </div>
                </div>

                {/* 2. Simulated Instant Private DM Card Delivered (Fabulate Soft Pink Accent) */}
                <div
                  className={`p-4 rounded-2xl bg-[#f7cbdf] border-2 border-[#ed83b3] space-y-2.5 transition-all duration-300 ${
                    simState === "delivered" ? "opacity-100 scale-100" : "opacity-60 scale-[0.99]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-[#871d4d] font-bold">
                    <span className="flex items-center gap-1.5">
                      <MessageOutlined /> Instant Direct Message (DM)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-[#ed83b3] text-[#e13181] text-[10px] font-bold shadow-2xs">
                      Delivered in 0.8s
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#f7cbdf] space-y-2 shadow-xs">
                    <div className="text-xs font-bold text-slate-900">{currentPreset.dmTitle}</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {currentPreset.dmDesc}
                    </p>

                    {/* Rich Action Button inside DM */}
                    <button
                      type="button"
                      style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                      className="w-full py-2.5 px-3 rounded-full hover:bg-neutral-900 text-white text-xs font-bold flex items-center justify-between shadow-md transition-all cursor-pointer"
                    >
                      <span className="text-white">{currentPreset.dmButton}</span>
                      <ArrowRightOutlined className="text-[10px] text-white" />
                    </button>
                  </div>
                </div>

                {/* Conversion Tag */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Targeted Funnel: <strong className="text-slate-900">{currentPreset.tag}</strong></span>
                  <span className="text-emerald-600 font-bold">+42% Higher Click-Through</span>
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
              <div className="text-3xl sm:text-5xl font-black text-black tracking-tight font-mono">
                &lt; 1.8s
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Average DM Delivery Latency
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-black text-[#e13181] tracking-tight font-mono">
                89.4%
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Average Direct Message Open Rate
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-black text-[#0000e9] tracking-tight font-mono">
                +34.8%
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Conversion Lift vs. "Link-in-Bio"
              </p>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-5xl font-black text-[#e3622b] tracking-tight font-mono">
                100%
              </div>
              <p className="text-xs font-semibold text-slate-500">
                Official Meta Graph API Compliant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. DYNAMIC PILL TICKER (Fabulate 'We help brands win at:') ────────── */}
      <section className="py-8 bg-[#fafaf9] border-b border-[#e9e9ee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            We help modern brands &amp; creators win at:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="px-5 py-2.5 rounded-full bg-[#bfbff9] border-2 border-[#6666f1] text-[#00008b] font-extrabold text-xs shadow-2xs hover:scale-105 transition-transform cursor-default">
              ⚡ Instant Comment-to-DM
            </span>
            <span className="px-5 py-2.5 rounded-full bg-[#f8d7ca] border-2 border-[#eea07f] text-[#883a19] font-extrabold text-xs shadow-2xs hover:scale-105 transition-transform cursor-default">
              🤖 Autonomous AI Co-Pilot
            </span>
            <span className="px-5 py-2.5 rounded-full bg-[#f7cbdf] border-2 border-[#ed83b3] text-[#871d4d] font-extrabold text-xs shadow-2xs hover:scale-105 transition-transform cursor-default">
              🔥 24h Story Reaction Funnels
            </span>
            <span className="px-5 py-2.5 rounded-full bg-[#ffefb2] border-2 border-[#ffe006] text-[#997a00] font-extrabold text-xs shadow-2xs hover:scale-105 transition-transform cursor-default">
              🎁 Customer UGC Ingestion
            </span>
          </div>
        </div>
      </section>

      {/* ── 6. THE 4 CORE PLATFORM PILLARS (Fabulate's Signature 4 Color Cards) ── */}
      <section id="pillars" className="py-20 lg:py-28 relative bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f7cbdf] border border-[#ed83b3] text-xs font-bold text-[#871d4d]">
              <ThunderboltFilled className="text-[#e13181]" /> The Complete Social Commerce Suite
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Four Engines. Zero Manual Typing.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Everything modern creators, DTC brands, and digital agencies need to capture leads and turn Instagram engagement into real revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pillar 1: Comment-to-DM Engine (Fabulate Site-Blue #bfbff9) */}
            <div className="rounded-3xl border-2 border-[#6666f1] bg-[#bfbff9] p-8 sm:p-10 space-y-5 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#0000e9] flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                  <MessageOutlined />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white bg-[#6666f1] px-3.5 py-1 rounded-full">
                  Workflow
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#00008b] tracking-tight">
                  Instant Comment-to-DM Funnels
                </h3>
                <p className="text-sm text-[#082f49] leading-relaxed font-medium">
                  Trigger targeted direct messages the millisecond a follower comments specific keywords (`PRICE`, `LINK`, `VIP`, `RECIPE`). Automatically rotate randomized public replies to keep your engagement organic and safe from algorithmic spam limits.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-[#082f49] font-bold pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#0000e9]" />
                  <span>Exact, partial, or wildcard keyword matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#0000e9]" />
                  <span>Configurable delay timers (0s to 120s)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#0000e9]" />
                  <span>Single-use checkout discounts &amp; link tracking</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: AI Autonomous Co-Pilot (Fabulate Site-Orange #f8d7ca) */}
            <div className="rounded-3xl border-2 border-[#eea07f] bg-[#f8d7ca] p-8 sm:p-10 space-y-5 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#e3622b] flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                  <RobotOutlined />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white bg-[#e3622b] px-3.5 py-1 rounded-full">
                  AI Agent
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#883a19] tracking-tight">
                  Autonomous AI Conversational Co-Pilot
                </h3>
                <p className="text-sm text-[#883a19]/90 leading-relaxed font-medium">
                  Train an intelligent AI that knows your products, sizing, hours, and catalog. When customers ask complex questions in DMs or comments, it responds warmly in their language (English, Spanish, Hindi, French) with strict guardrails against hallucinations.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-[#883a19] font-bold pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#e3622b]" />
                  <span>Custom business knowledge &amp; strict safety rules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#e3622b]" />
                  <span>Automatic language &amp; script detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#e3622b]" />
                  <span>Seamless human takeover trigger whenever requested</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: 24h Story Reaction Funnels (Fabulate Site-Pink #f7cbdf) */}
            <div className="rounded-3xl border-2 border-[#ed83b3] bg-[#f7cbdf] p-8 sm:p-10 space-y-5 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#e13181] flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                  <FireOutlined />
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white bg-[#e13181] px-3.5 py-1 rounded-full">
                  Stories
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#871d4d] tracking-tight">
                  24-Hour Story Reaction Automation
                </h3>
                <p className="text-sm text-[#871d4d]/90 leading-relaxed font-medium">
                  Instagram Stories expire in 24 hours, but their leads don't have to. Turn emoji fire reactions (`🔥`), quick poll replies, and story question stickers into automated personalized DM conversations with instant download links.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-[#871d4d] font-bold pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#e13181]" />
                  <span>Detects emoji reactions (`🔥`, `❤️`, `👏`)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#e13181]" />
                  <span>Interactive mobile device simulator in dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#e13181]" />
                  <span>Direct Cloudinary media ingestion &amp; story posting</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4: Customer UGC Engine (Fabulate Site-Yellow #ffefb2) */}
            <div className="rounded-3xl border-2 border-[#ffe006] bg-[#ffefb2] p-8 sm:p-10 space-y-5 hover:shadow-xl transition-all group">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white text-[#997a00] flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                  <GiftOutlined />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-black bg-[#ffcc00] px-3.5 py-1 rounded-full">
                  UGC Engine
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#451a03] tracking-tight">
                  Customer UGC Ingestion &amp; Reward Engine
                </h3>
                <p className="text-sm text-[#451a03]/90 leading-relaxed font-medium">
                  When loyal customers tag your handle in their photos, Fabroniee intercepts the webhook, queues the image in an admin moderation inbox, and with 1 click republishes it to your feed while firing a thank-you discount DM back to the customer.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-[#451a03] font-bold pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#997a00]" />
                  <span>Webhook moderation inbox with 1-click approvals</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#997a00]" />
                  <span>Automatic thank-you reward DMs to creator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleFilled className="text-[#997a00]" />
                  <span>Generates endless viral social proof organically</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. INTERACTIVE ROI & TIME-SAVED CALCULATOR ────────────────────────── */}
      <section id="calculator" className="py-20 bg-white border-y border-[#e9e9ee] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f7cbdf] border border-[#ed83b3] text-xs font-bold text-[#871d4d]">
              <RiseOutlined /> Interactive ROI Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              How Much Revenue &amp; Time Are You Leaving on the Table?
            </h2>
            <p className="text-sm text-slate-600">
              Drag the slider below to estimate how much manual labor and lost sales Fabroniee recovers for your business every month.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl border-2 border-[#e9e9ee] bg-[#fafaf9] p-6 sm:p-10 shadow-xl space-y-8">
            {/* Slider Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">
                  Monthly Instagram Comments on Your Account:
                </span>
                <span className="text-2xl font-black text-[#e13181] font-mono">
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
                <div className="text-xs text-slate-500 font-semibold">Manual Hours Saved</div>
                <div className="text-3xl font-black text-slate-950 font-mono flex items-center justify-center gap-1.5">
                  <ClockCircleOutlined className="text-[#e3622b] text-xl" />
                  <span>~{hoursSaved} hrs</span>
                </div>
                <div className="text-[11px] text-slate-400">No copy-pasting DMs by hand</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e9e9ee] text-center space-y-1 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">Qualified Leads Captured</div>
                <div className="text-3xl font-black text-[#0000e9] font-mono flex items-center justify-center gap-1.5">
                  <CheckCircleFilled className="text-[#0000e9] text-xl" />
                  <span>{qualifiedLeads.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-slate-400">Directly into chat inbox</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#e9e9ee] text-center space-y-1 shadow-xs">
                <div className="text-xs text-slate-500 font-semibold">Projected Extra Sales</div>
                <div className="text-3xl font-black text-[#e13181] font-mono">
                  ${estimatedRevenue.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">Based on 8% DM conversion lift</div>
              </div>
            </div>

            {/* Bottom CTA within Calculator */}
            <div className="p-4 rounded-2xl bg-[#f7cbdf] border-2 border-[#ed83b3] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-semibold text-[#871d4d]">
                Ready to automate your comments and reclaim <strong className="text-[#e13181]">{hoursSaved} hours</strong> this month?
              </div>
              <Link
                href="/login"
                style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                className="px-6 py-3 rounded-full hover:bg-neutral-900 !text-white font-bold text-xs shadow-md transition-all shrink-0"
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#e9e9ee] text-xs font-bold text-[#871d4d] shadow-2xs">
              <SafetyCertificateFilled className="text-[#e13181]" /> Official Security Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-950 tracking-tight">
              Built on Official Meta Graph APIs.
              <br />
              Zero Scrapers. Zero Banning Risk.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Third-party web scrapers that log into your Instagram account with your password put your entire business at risk of permanent deletion. Fabroniee operates strictly through authorized Meta developer endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl border border-[#e9e9ee] bg-white space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#bfbff9] text-[#00008b] flex items-center justify-center text-xl font-bold">
                <LockOutlined />
              </div>
              <h4 className="text-lg font-bold text-slate-950">Direct Meta OAuth 2.0</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                You never give us your Instagram password. Authentication happens on Meta's official login dialog, granting scoped permissions exclusively for page comments and messages.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-[#e9e9ee] bg-white space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#f7cbdf] text-[#871d4d] flex items-center justify-center text-xl font-bold">
                <SafetyCertificateFilled />
              </div>
              <h4 className="text-lg font-bold text-slate-950">AES-256 Encrypted Tokens</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                All long-lived Page access tokens and Instagram credentials are encrypted at rest using military-grade 256-bit AES symmetric keys before entering our PostgreSQL database.
              </p>
            </div>

            <div className="p-7 rounded-2xl border border-[#e9e9ee] bg-white space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#ffefb2] text-[#997a00] flex items-center justify-center text-xl font-bold">
                <CheckCircleFilled />
              </div>
              <h4 className="text-lg font-bold text-slate-950">Automated Data Deletion</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Users can permanently delete all associated tokens, automations, and logs at any time from their settings panel or through our live Meta compliance endpoint at <Link href="/data-deletion" className="text-[#e13181] underline font-semibold">/data-deletion</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. FREQUENTLY ASKED QUESTIONS (FAQ) ────────────────────────────────── */}
      <section id="faq" className="py-20 bg-white border-t border-[#e9e9ee]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e13181]">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
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
                    <span className="text-sm font-bold text-slate-900">{item.q}</span>
                    <span className="text-slate-500 text-xs shrink-0">
                      {isOpen ? <UpOutlined /> : <DownOutlined />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-[#e9e9ee] pt-3">
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
          <div className="rounded-3xl border-2 border-[#ed83b3] bg-gradient-to-br from-[#f7cbdf] via-[#ffefb2] to-[#f8d7ca] p-10 sm:p-14 space-y-6 shadow-xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-[#ed83b3] text-xs font-bold text-[#871d4d] shadow-2xs">
              <StarFilled className="text-amber-400" /> Start Converting Today
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
              Ready to Put Your Instagram Comments On Autopilot?
            </h2>

            <p className="text-base text-slate-700 max-w-xl mx-auto font-normal">
              Join hundreds of creators and brands turning social engagement into measurable revenue. Connect in under 60 seconds with official Meta Login.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                className="w-full sm:w-auto px-8 py-4 rounded-full hover:bg-neutral-900 !text-white font-bold text-sm shadow-xl active:scale-[0.99] transition-all"
              >
                <span className="!text-white">Get Started with Meta Login &rarr;</span>
              </Link>

              <Link
                href="/login?demo=1"
                style={{ backgroundColor: "#ffffff", color: "#000000", border: "2px solid #000000" }}
                className="w-full sm:w-auto px-6 py-4 rounded-full hover:bg-slate-50 font-bold text-sm transition-all shadow-xs"
              >
                ⚡ Launch Reviewer Demo Mode
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. COMPREHENSIVE FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-[#e9e9ee] bg-white py-14 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Fabroniee" className="w-8 h-8 rounded-lg object-contain shadow-2xs" />
                <span className="text-lg font-black text-slate-950 tracking-tight">Fabroniee</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Official Instagram comment-to-DM funnels, autonomous AI co-pilot, and social commerce automation built on the Meta Graph API v21.0.
              </p>
              <div className="text-[11px] text-slate-500">
                Support: <a href="mailto:support@fabroniee.store" className="text-[#e13181] underline font-semibold">support@fabroniee.store</a>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">Product</div>
              <ul className="space-y-2">
                <li><a href="#simulator" className="hover:text-black transition-colors">Live Simulator</a></li>
                <li><a href="#pillars" className="hover:text-black transition-colors">Comment-to-DM</a></li>
                <li><a href="#pillars" className="hover:text-black transition-colors">AI Co-Pilot</a></li>
                <li><a href="#pillars" className="hover:text-black transition-colors">Story Reactions</a></li>
                <li><a href="#pillars" className="hover:text-black transition-colors">Customer UGC Engine</a></li>
              </ul>
            </div>

            {/* Col 3: Legal & Meta Compliance */}
            <div className="space-y-3">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">Compliance</div>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link></li>
                <li><Link href="/data-deletion" className="hover:text-black transition-colors">Data Deletion Instructions</Link></li>
                <li><Link href="/login?demo=1" className="hover:text-black transition-colors">Reviewer Sandbox</Link></li>
              </ul>
            </div>

            {/* Col 4: Platform */}
            <div className="space-y-3">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">Access</div>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-black transition-colors">Log In with Facebook</Link></li>
                <li><Link href="/login" className="hover:text-black transition-colors">Log In with Instagram</Link></li>
                <li><Link href="/dashboard" className="hover:text-black transition-colors">App Dashboard</Link></li>
                <li><Link href="/comments" className="hover:text-black transition-colors">DM Automations</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#e9e9ee] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} Fabroniee. All rights reserved. Meta, Instagram, and Facebook are trademarks of Meta Platforms, Inc.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-600">Terms</Link>
              <Link href="/data-deletion" className="hover:text-slate-600">Data Deletion</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
