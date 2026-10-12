"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightOutlined } from "@ant-design/icons";

export interface SplitCardProps {
  badge: string;
  badgeIcon?: React.ReactNode;
  headerIcon?: React.ReactNode;
  title: string;
  description?: string;
  bgColor: string; // e.g. '#bfbff9', '#f7cbdf', '#f8d7ca', '#ffefb2'
  borderColor?: string;
  textColor?: string;
  imageSrc: string;
  imageAlt: string;
  statBadge?: {
    icon?: string;
    text: string;
  };
  actionText: string;
  href: string;
}

export default function SplitCard({
  badge,
  badgeIcon,
  headerIcon,
  title,
  description,
  bgColor,
  borderColor = "border-black/15",
  textColor = "text-slate-950",
  imageSrc,
  imageAlt,
  statBadge,
  actionText,
  href,
}: SplitCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-[32px] overflow-hidden border-2 ${borderColor} hover:border-black bg-white shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col focus:outline-none focus:ring-4 focus:ring-black/10`}
    >
      {/* ── TOP HALF: PASTEL SOLID WITH PILL BADGE + HEADLINE ── */}
      <div
        className="p-7 sm:p-9 flex flex-col justify-between relative transition-colors duration-300 min-h-[210px] sm:min-h-[230px]"
        style={{ backgroundColor: bgColor }}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-slate-950 border border-black/85 text-xs font-bold tracking-tight shadow-2xs group-hover:border-black transition-colors">
            {badgeIcon}
            <span>{badge}</span>
          </span>
          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-slate-900 text-sm group-hover:scale-110 group-hover:bg-white border border-black/10 transition-all">
            {headerIcon}
          </div>
        </div>

        {/* Headline & Description */}
        <div className="pt-6 sm:pt-8 space-y-2">
          <h3 className={`text-xl sm:text-2xl font-black ${textColor} tracking-tight leading-snug group-hover:text-black transition-colors`}>
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm font-semibold text-slate-800/85 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* ── BOTTOM HALF: LIFESTYLE PHOTOGRAPHY + FLOATING METRIC + ACTION BUTTON ── */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
        {/* Background Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Floating Stat Badge (Top Left of Image - Differentiator) */}
        {statBadge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-md">
              {statBadge.icon && <span>{statBadge.icon}</span>}
              <span>{statBadge.text}</span>
            </span>
          </div>
        )}

        {/* Bottom Scrim & Action Bar */}
        <div className="absolute inset-x-0 bottom-0 pt-16 pb-5 px-6 sm:px-7 bg-gradient-to-t from-black/90 via-black/45 to-transparent flex items-end justify-between gap-4 z-10">
          <div className="space-y-0.5">
            <span className="block text-white/75 text-xs font-bold tracking-wide uppercase">
              Find out more
            </span>
            <span className="block text-white font-extrabold text-base sm:text-lg tracking-tight group-hover:translate-x-1 transition-transform drop-shadow-xs">
              {actionText}
            </span>
          </div>

          {/* White Circular Action Button with Black Border & Arrow */}
          <div className="w-12 h-12 rounded-full bg-white text-black border-2 border-black flex items-center justify-center font-black text-lg shadow-md group-hover:bg-black group-hover:text-white group-hover:scale-110 group-hover:rotate-[-45deg] transition-all duration-300 shrink-0">
            <ArrowRightOutlined />
          </div>
        </div>
      </div>
    </Link>
  );
}
