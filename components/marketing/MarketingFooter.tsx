"use client";

import React from "react";
import Link from "next/link";
import { InstagramOutlined } from "@ant-design/icons";

export default function MarketingFooter() {
  return (
    <footer className="bg-[#fafaf9] border-t border-[#e5e5e4] pt-20 sm:pt-28 pb-0 text-slate-800 overflow-hidden relative selection:bg-[#f7cbdf] selection:text-[#871d4d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
        {/* ── 1. TOP EDITORIAL HERO ROW ────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 sm:gap-14">
          {/* Left Large Serif Headline */}
          <div className="max-w-2xl">
            <h2 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal text-slate-900 tracking-tight leading-[1.05]">
              Your Fabroniee awaits.
            </h2>
          </div>

          {/* Right Minimalist Copy & Invite Action Button */}
          <div className="max-w-md space-y-7">
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
              Fabroniee is in private alpha. Tell us what you&apos;d automate with it, and we&apos;ll write back when there&apos;s room.
            </p>
            <div>
              <Link
                href="/login"
                style={{
                  backgroundColor: "#18181b",
                  color: "#ffffff",
                  border: "1px solid #18181b",
                  display: "inline-block",
                }}
                className="px-7 py-3.5 hover:!bg-black !text-white text-[11px] font-mono font-medium tracking-[0.22em] uppercase transition-all shadow-sm active:scale-[0.99]"
              >
                Request An Invite
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. MIDDLE REFINED METADATA & LINKS ROW ───────────────────────── */}
        <div className="pt-12 sm:pt-16 border-t border-[#e5e5e4] grid grid-cols-1 lg:grid-cols-12 gap-8 text-[11px] font-normal leading-relaxed">
          {/* Left Attributions & Compliance Disclaimer */}
          <div className="lg:col-span-7 space-y-2 text-slate-500 max-w-xl">
            <p>
              The work on this page adheres to official Meta Platform Terms &amp; Developer Policies. Built on Meta Graph API v21.0. Instagram, Facebook, and Meta are trademarks of Meta Platforms, Inc. All customer data and tokens are encrypted with AES-256 at rest. Each automation funnel links directly to authenticated Meta endpoints. For custom integrations or dedicated enterprise sandboxes, write to{" "}
              <a
                href="mailto:support@fabroniee.store"
                style={{ color: "#18181b" }}
                className="hover:underline underline-offset-2 transition-colors font-medium"
              >
                support@fabroniee.store
              </a>
              .
            </p>
          </div>

          {/* Right Legal Navigation, Copyright & Social Icons */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 lg:items-end">
            {/* Top Link Row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href="/terms"
                style={{ color: "#52525b" }}
                className="hover:!text-black transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                style={{ color: "#52525b" }}
                className="hover:!text-black transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/data-deletion"
                style={{ color: "#52525b" }}
                className="hover:!text-black transition-colors"
              >
                Data Deletion
              </Link>
              <Link
                href="/platform/workflow"
                style={{ color: "#52525b" }}
                className="hover:!text-black transition-colors"
              >
                Platform
              </Link>
            </div>

            {/* Bottom Copyright & Utility Row */}
            <div className="flex items-center justify-between lg:justify-end gap-6 w-full pt-1">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Fabroniee" className="w-5 h-5 object-contain rounded-md shrink-0" />
                <span className="text-slate-400">
                  &copy; {new Date().getFullYear()} Fabroniee. All rights reserved.
                </span>
              </div>
              <div className="flex items-center gap-3.5 text-slate-500">
                {/* Moon Icon */}
                <button
                  type="button"
                  aria-label="Theme preference"
                  style={{ color: "#71717a" }}
                  className="p-1 hover:!text-black transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
                  </svg>
                </button>

                {/* X (Twitter) Icon */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#71717a" }}
                  className="p-1 hover:!text-black transition-colors"
                  aria-label="X (formerly Twitter)"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Instagram Icon */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#71717a" }}
                  className="p-1 hover:!text-black transition-colors text-sm"
                  aria-label="Instagram"
                >
                  <InstagramOutlined />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. BOTTOM GIGANTIC SCULPTED WATERMARK ("FABRONIEE") ─────────────── */}
      <div className="w-full mt-12 sm:mt-18 select-none pointer-events-none flex justify-center overflow-hidden">
        <svg
          viewBox="0 0 1440 250"
          className="w-full h-auto block max-w-none"
          preserveAspectRatio="xMidYEnd meet"
          aria-hidden="true"
        >
          <defs>
            {/* Subtle stone-carve embossed bevel filter */}
            <filter id="carved-emboss" x="-20%" y="-20%" width="140%" height="140%">
              {/* Highlight from bottom/right */}
              <feDropShadow dx="1.5" dy="2" stdDeviation="0.6" floodColor="#ffffff" floodOpacity="0.95" />
              {/* Soft inner shadow from top/left */}
              <feDropShadow dx="-1" dy="-1.5" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.08" />
            </filter>
          </defs>
          <text
            x="50%"
            y="85%"
            textAnchor="middle"
            fontFamily="'Newsreader', Georgia, 'Times New Roman', serif"
            fontSize="215"
            fontWeight="400"
            letterSpacing="14"
            fill="#ebebe9"
            stroke="#e0e0de"
            strokeWidth="0.75"
            filter="url(#carved-emboss)"
          >
            FABRONIEE
          </text>
        </svg>
      </div>
    </footer>
  );
}
