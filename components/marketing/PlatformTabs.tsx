"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageOutlined, RobotOutlined, LineChartOutlined } from "@ant-design/icons";

const TABS = [
  {
    label: "Comment-to-DM Engine",
    href: "/platform/workflow",
    icon: <MessageOutlined />,
    badgeBg: "#bfbff9",
  },
  {
    label: "Autonomous AI Co-Pilot",
    href: "/platform/ai",
    icon: <RobotOutlined />,
    badgeBg: "#f8d7ca",
  },
  {
    label: "Verified Meta Analytics",
    href: "/platform/analytics",
    icon: <LineChartOutlined />,
    badgeBg: "#f7cbdf",
  },
];

export default function PlatformTabs() {
  const pathname = usePathname();

  return (
    <div className="sticky top-18 z-30 bg-white/95 backdrop-blur-md border-b border-[#e9e9ee] py-2.5 px-4 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                backgroundColor: isActive ? "#000000" : "transparent",
                color: isActive ? "#ffffff" : "#52525b",
                textDecoration: "none",
              }}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive ? "!text-white shadow-xs" : "hover:bg-slate-100 hover:!text-black"
              }`}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0"
                style={{
                  backgroundColor: isActive ? "rgba(255, 255, 255, 0.2)" : tab.badgeBg,
                  color: isActive ? "#ffffff" : "#000000",
                }}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
