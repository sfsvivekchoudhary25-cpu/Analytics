"use client";

import React from "react";
import { ConfigProvider, App as AntdApp } from "antd";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2563eb",
          colorInfo: "#2563eb",
          colorSuccess: "#10b981",
          colorWarning: "#f59e0b",
          colorError: "#ef4444",
          borderRadius: 10,
          borderRadiusLG: 14,
          borderRadiusSM: 6,
          fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgContainer: "#ffffff",
          colorBgLayout: "#f8fafc",
          colorTextBase: "#0f172a",
          colorTextSecondary: "#64748b",
          colorBorder: "#e2e8f0",
          colorBorderSecondary: "#f1f5f9",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
          boxShadowSecondary: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        },
        components: {
          Card: {
            headerBg: "transparent",
            headerFontSize: 16,
            headerHeight: 52,
          },
          Button: {
            fontWeight: 500,
            controlHeight: 38,
            borderRadius: 8,
          },
          Table: {
            headerBg: "#f8fafc",
            headerColor: "#475569",
            rowHoverBg: "#f8fafc",
            borderColor: "#f1f5f9",
          },
          Tag: {
            borderRadiusSM: 9999,
          },
          Progress: {
            remainingColor: "#f1f5f9",
          },
        },
      }}
    >
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}
