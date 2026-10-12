"use client";

import React from "react";
import Link from "next/link";

export default function MarketingFooter() {
  return (
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
              Support: <a href="mailto:support@fabroniee.store" className="text-[#e13181] underline font-bold">support@fabroniee.store</a>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Platform</div>
            <ul className="space-y-2">
              <li><Link href="/platform/workflow" className="hover:text-black transition-colors font-medium">Comment-to-DM Engine</Link></li>
              <li><Link href="/platform/ai" className="hover:text-black transition-colors font-medium">Autonomous AI Co-Pilot</Link></li>
              <li><Link href="/platform/analytics" className="hover:text-black transition-colors font-medium">Verified Meta Analytics</Link></li>
              <li><Link href="/#simulator" className="hover:text-black transition-colors font-medium">Interactive Simulator</Link></li>
              <li><Link href="/solutions" className="hover:text-black transition-colors font-medium">Industry Solutions</Link></li>
            </ul>
          </div>

          {/* Col 3: Company & Pricing */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Company</div>
            <ul className="space-y-2">
              <li><Link href="/pricing" className="hover:text-black transition-colors font-medium">Plans &amp; Pricing</Link></li>
              <li><Link href="/case-studies" className="hover:text-black transition-colors font-medium">Customer Case Studies</Link></li>
              <li><Link href="/login?demo=1" className="hover:text-black transition-colors font-medium">Reviewer Sandbox</Link></li>
              <li><Link href="/dashboard" className="hover:text-black transition-colors font-medium">App Dashboard</Link></li>
            </ul>
          </div>

          {/* Col 4: Legal & Meta Compliance */}
          <div className="space-y-3">
            <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Compliance</div>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="hover:text-black transition-colors font-medium">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-black transition-colors font-medium">Terms of Service</Link></li>
              <li><Link href="/data-deletion" className="hover:text-black transition-colors font-medium">Data Deletion Instructions</Link></li>
              <li><a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors font-medium">Meta Platform Terms</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#e9e9ee] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} Fabroniee. All rights reserved. Meta, Instagram, and Facebook are trademarks of Meta Platforms, Inc.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-700">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-700">Terms</Link>
            <Link href="/data-deletion" className="hover:text-slate-700">Data Deletion</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
