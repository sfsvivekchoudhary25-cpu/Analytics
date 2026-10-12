"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightOutlined,
  GlobalOutlined,
  MenuOutlined,
  CloseOutlined,
  DownOutlined,
  MessageOutlined,
  RobotOutlined,
  LineChartOutlined,
  ThunderboltFilled,
} from "@ant-design/icons";
import { auth } from "@/lib/api";

export default function MarketingNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoggedIn(Boolean(auth.get()));
    }
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* ── 1. TOP ANNOUNCEMENT RIBBON (Fabulate Signature Raspberry & Soft Pink) ── */}
      <div className="relative z-50 bg-[#e13181] text-white text-xs font-semibold py-2.5 px-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-semibold text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Official Meta Verified
            </span>
            <span className="truncate font-normal">
              Direct Meta Graph API v21.0 Certified &bull; Official Facebook Login for Business Integration
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <Link
              href="/login?demo=1"
              style={{ backgroundColor: "#f7cbdf", color: "#871d4d" }}
              className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full font-semibold hover:bg-white transition-colors shadow-2xs"
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
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Fabroniee"
              className="w-9 h-9 object-contain rounded-xl shadow-xs border border-[#e9e9ee] group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                  Fabroniee
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#871d4d] bg-[#f7cbdf] border border-[#ed83b3] px-2 py-0.5 rounded-full">
                  OS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">
                Instagram Social Commerce
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
            {/* Platform Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPlatformDropdownOpen(true)}
              onMouseLeave={() => setPlatformDropdownOpen(false)}
            >
              <button
                type="button"
                className={`inline-flex items-center gap-1.5 py-2 hover:text-black transition-colors cursor-pointer ${
                  pathname.startsWith("/platform") ? "text-[#e13181] font-semibold" : ""
                }`}
              >
                <span>Platform</span>
                <DownOutlined className="text-[10px] text-slate-400" />
              </button>

              {platformDropdownOpen && (
                <div className="absolute top-full left-0 w-80 p-3 bg-white border border-[#e9e9ee] rounded-2xl shadow-xl space-y-1 animate-page-entrance">
                  <Link
                    href="/platform/workflow"
                    onClick={() => setPlatformDropdownOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#e0f2fe]/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#bfbff9] text-[#00008b] flex items-center justify-center text-sm shrink-0">
                      <MessageOutlined />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-[#00008b]">Comment-to-DM Engine</div>
                      <div className="text-[11px] text-slate-500 font-normal leading-snug">Instant keyword triggers and automated private replies.</div>
                    </div>
                  </Link>

                  <Link
                    href="/platform/ai"
                    onClick={() => setPlatformDropdownOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#fff2e8]/60 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#f8d7ca] text-[#883a19] flex items-center justify-center text-sm shrink-0">
                      <RobotOutlined />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-[#883a19]">Autonomous AI Co-Pilot</div>
                      <div className="text-[11px] text-slate-500 font-normal leading-snug">24/7 multilingual product & sizing assistant.</div>
                    </div>
                  </Link>

                  <Link
                    href="/platform/analytics"
                    onClick={() => setPlatformDropdownOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#f7cbdf]/40 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#f7cbdf] text-[#871d4d] flex items-center justify-center text-sm shrink-0">
                      <LineChartOutlined />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-[#871d4d]">Verified Meta Analytics</div>
                      <div className="text-[11px] text-slate-500 font-normal leading-snug">Authenticated open rates, link CTR, and conversion lift.</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/solutions"
              className={`hover:text-black transition-colors ${isActive("/solutions") ? "text-[#e13181] font-semibold" : ""}`}
            >
              Solutions
            </Link>

            <Link
              href="/pricing"
              className={`hover:text-black transition-colors ${isActive("/pricing") ? "text-[#e13181] font-semibold" : ""}`}
            >
              Pricing
            </Link>

            <Link
              href="/case-studies"
              className={`hover:text-black transition-colors ${isActive("/case-studies") ? "text-[#e13181] font-semibold" : ""}`}
            >
              Case Studies
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full hover:bg-neutral-800 !text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all"
              >
                <ThunderboltFilled className="text-[#e13181]" />
                <span className="!text-white">Go to Dashboard</span>
                <ArrowRightOutlined className="text-[10px] !text-white" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-slate-700 hover:text-black px-4 py-2.5 rounded-full hover:bg-[#e9e9ee]/60 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full hover:bg-neutral-800 !text-white text-xs font-semibold shadow-xs active:scale-[0.98] transition-all"
                >
                  <span className="!text-white">Get Started Free</span>
                  <ArrowRightOutlined className="text-[10px] !text-white" />
                </Link>
              </>
            )}
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
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold text-slate-700 hover:text-black"
            >
              Home Showcase
            </Link>
            <div className="space-y-2 pl-3 border-l-2 border-[#f7cbdf]">
              <span className="text-[10px] font-semibold uppercase text-slate-400">Platform Features</span>
              <Link
                href="/platform/workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 hover:text-[#00008b]"
              >
                &bull; Comment-to-DM Engine
              </Link>
              <Link
                href="/platform/ai"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 hover:text-[#883a19]"
              >
                &bull; Autonomous AI Co-Pilot
              </Link>
              <Link
                href="/platform/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-medium text-slate-800 hover:text-[#871d4d]"
              >
                &bull; Verified Meta Analytics
              </Link>
            </div>
            <Link
              href="/solutions"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-black"
            >
              Solutions
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-black"
            >
              Pricing
            </Link>
            <Link
              href="/case-studies"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 hover:text-black"
            >
              Case Studies
            </Link>
            <div className="pt-4 border-t border-[#e9e9ee] flex flex-col gap-2.5">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  style={{ backgroundColor: "#000000", color: "#ffffff", border: "2px solid #000000" }}
                  className="w-full py-2.5 text-center text-sm font-semibold rounded-full !text-white shadow-md"
                >
                  Go to Dashboard &rarr;
                </Link>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
