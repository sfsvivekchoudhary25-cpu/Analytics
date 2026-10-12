"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  RobotOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  ThunderboltFilled,
  GlobalOutlined,
  SafetyCertificateFilled,
  MessageOutlined,
} from "@ant-design/icons";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import PlatformTabs from "@/components/marketing/PlatformTabs";

const AI_PRESETS = [
  {
    question: "Do you ship internationally to Canada, and how much is shipping?",
    reply: "Yes! 🇨🇦 We offer tracked international shipping to Canada for $9.95 (free on orders over $75). Orders typically arrive within 4-7 business days!",
  },
  {
    question: "Is this jacket oversized or should I size up?",
    reply: "This jacket has a relaxed, vintage oversized cut! We recommend staying true to your normal size for a comfortable streetwear fit, or sizing down if you prefer a slim look.",
  },
  {
    question: "¿Tienen envíos a México y aceptan pagos con tarjeta?",
    reply: "¡Hola! Sí, enviamos a todo México 🇲🇽 con entrega en 3 a 5 días hábiles. Aceptamos tarjetas de crédito, débito y PayPal directamente en nuestro checkout seguro.",
  },
];

export default function AiPlatformPage() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-slate-900 font-sans antialiased selection:bg-[#f8d7ca] selection:text-[#883a19] overflow-x-hidden">
      <MarketingNav />
      <PlatformTabs />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-white border-b border-[#e9e9ee]">
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#f8d7ca] rounded-full blur-[140px] pointer-events-none opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#ffefb2] rounded-full blur-[140px] pointer-events-none opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f8d7ca] border border-[#eea07f] text-xs font-semibold text-[#883a19]">
            <RobotOutlined /> Autonomous AI Conversational Co-Pilot
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            The Social AI Agent That <span className="text-[#e3622b]">Actually Knows Your Business</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Traditional bots break the second a customer asks a real question. Fabroniee's AI understands product specs, sizing, return windows, and hours — replying warmly in 40+ languages without hallucinations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <Link
              href="/login"
              style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full hover:bg-neutral-900 !text-white font-semibold text-sm shadow-xl transition-all"
            >
              <span>Deploy Your AI Agent Free</span>
              <ArrowRightOutlined className="text-xs !text-white" />
            </Link>

            <Link
              href="/pricing"
              style={{ backgroundColor: "#f8d7ca", color: "#883a19", border: "2px solid #eea07f" }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full hover:bg-white text-sm font-semibold transition-all shadow-2xs !text-[#883a19]"
            >
              <span>Explore Plans &amp; Pricing &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONVERSATIONAL AI REASONING SHOWCASE ───────────────────────────── */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e3622b]">
              Live Assistant Demonstration
            </span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              See How Fabroniee Resolves Complex Questions in Real Time
            </h2>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#e9e9ee] space-y-6 shadow-md">
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">Select a Sample Customer Inquiry:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {["Sizing & Fit", "International Shipping", "Spanish Language"].map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`p-3 rounded-2xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeIdx === idx
                        ? "bg-[#e3622b] text-white shadow-md ring-2 ring-[#e3622b]"
                        : "bg-slate-100 text-slate-800 hover:bg-[#f8d7ca] hover:text-[#883a19]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat preview */}
            <div className="p-5 rounded-2xl bg-[#fafafa] border border-slate-200 space-y-4">
              {/* Customer message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-semibold text-xs shrink-0">
                  U
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs font-normal text-slate-800 max-w-lg shadow-2xs leading-relaxed">
                  {AI_PRESETS[activeIdx].question}
                </div>
              </div>

              {/* AI Agent message */}
              <div className="flex items-start gap-3 justify-end">
                <div className="p-3.5 rounded-2xl bg-[#f8d7ca] border border-[#eea07f] text-xs font-medium text-[#883a19] max-w-lg shadow-2xs leading-relaxed">
                  <div className="flex items-center gap-1.5 pb-1 text-[10px] uppercase font-semibold text-[#e3622b]">
                    <RobotOutlined /> Fabroniee AI Co-Pilot &bull; 0.6s
                  </div>
                  {AI_PRESETS[activeIdx].reply}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#e3622b] text-white flex items-center justify-center font-semibold text-xs shrink-0">
                  <RobotOutlined />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 PILLARS OF SAFE SOCIAL AI ───────────────────────────────────────── */}
      <section className="py-20 bg-white border-y border-[#e9e9ee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e3622b]">
              Enterprise Guardrails
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              AI Built to Protect Your Brand Reputation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#fafaf9] border-2 border-[#e9e9ee] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#f8d7ca] text-[#883a19] flex items-center justify-center text-lg font-bold">
                <SafetyCertificateFilled />
              </div>
              <h4 className="text-base font-semibold text-slate-900">Zero Hallucinations</h4>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Operates strictly within your uploaded knowledge base. If an unknown fact is requested, it seamlessly passes to your human team.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#fafaf9] border-2 border-[#e9e9ee] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#bfbff9] text-[#00008b] flex items-center justify-center text-lg font-bold">
                <GlobalOutlined />
              </div>
              <h4 className="text-base font-semibold text-slate-900">40+ Languages</h4>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Automatically detects the customer's language and replies natively with matching cultural nuance and localized numbers.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#fafaf9] border-2 border-[#e9e9ee] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#f7cbdf] text-[#871d4d] flex items-center justify-center text-lg font-bold">
                <ThunderboltFilled />
              </div>
              <h4 className="text-base font-semibold text-slate-900">Human Handoff</h4>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                When a customer asks for a manager or complex refund, the AI flags the chat in your conversations inbox with 1-click takeover.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#fafaf9] border-2 border-[#e9e9ee] space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#ffefb2] text-[#997a00] flex items-center justify-center text-lg font-bold">
                <MessageOutlined />
              </div>
              <h4 className="text-base font-semibold text-slate-900">Brand Voice Control</h4>
              <p className="text-xs text-slate-600 font-normal leading-relaxed">
                Choose your brand's personality: playful & energetic, luxury & understated, or consultative & professional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#fafaf9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-[#f8d7ca] via-[#ffefb2] to-[#f7cbdf] border-2 border-[#eea07f] space-y-5 shadow-xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Train Your First AI Assistant in 5 Minutes
            </h2>
            <p className="text-sm text-slate-700 max-w-lg mx-auto font-normal leading-relaxed">
              Simply input your store FAQ or website URL. Fabroniee indexes your knowledge and deploys on Instagram with official Meta OAuth.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                className="inline-flex px-8 py-4 rounded-full font-semibold text-sm hover:bg-neutral-900 !text-white shadow-xl transition-all"
              >
                <span className="!text-white">Get Started with Meta Login &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
