"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MockFrame } from "react-mockframe";
import "react-mockframe/styles/mockframe.css";
import {
  WifiOutlined,
  ReloadOutlined,
  ExportOutlined,
  AppleOutlined,
  AndroidOutlined,
  TabletOutlined,
} from "@ant-design/icons";

export type SupportedDevice =
  | "iPhone 17"
  | "Pixel 10"
  | "Galaxy S25"
  | "iPad Pro"
  | "iPhone X";

export interface MobilePreviewProps {
  /** Optional URL to preview inside an iframe */
  src?: string;
  /** Custom children to render inside the phone display canvas */
  children?: React.ReactNode;
  /** Target width in pixels for scaling the phone frame (default: 340) */
  width?: number;
  /** Height in pixels (defaults based on device aspect ratio) */
  height?: number;
  /** Initial device theme: 'dark' (default) or 'light' */
  theme?: "dark" | "light";
  /** Selected device from react-mockframe */
  device?: SupportedDevice;
  /** Optional device model label for backward compatibility */
  deviceModel?: "iphone-16-pro" | "iphone-15" | "minimal" | SupportedDevice;
  /** Device color variant (optional override) */
  color?: string;
  /** Title shown in the header/toolbar */
  title?: string;
  /** Whether to show the top toolbar with reload/rotate/open actions */
  showToolbar?: boolean;
  /** Whether to hide the notch or dynamic island */
  hideNotch?: boolean;
  /** Whether children should fill the entire canvas edge-to-edge behind the status bar & home bar */
  fullBleed?: boolean;
  /** Initial zoom/scale factor */
  zoom?: number;
  /** Additional container classes */
  className?: string;
  /** Time displayed in the status bar (defaults to current time or 9:41) */
  statusBarTime?: string;
}

interface DeviceSpec {
  name: string;
  shortLabel: string;
  brand: "apple" | "android" | "tablet";
  unscaledW: number;
  unscaledH: number;
  hasNotch: boolean;
  defaultColor: string;
}

const DEVICE_CONFIGS: Record<SupportedDevice, DeviceSpec> = {
  "iPhone 17": {
    name: "iPhone 17",
    shortLabel: "iPhone",
    brand: "apple",
    unscaledW: 399,
    unscaledH: 836,
    hasNotch: true,
    defaultColor: "black",
  },
  "Pixel 10": {
    name: "Pixel 10",
    shortLabel: "Pixel",
    brand: "android",
    unscaledW: 436,
    unscaledH: 939,
    hasNotch: true,
    defaultColor: "obsidian",
  },
  "Galaxy S25": {
    name: "Galaxy S25",
    shortLabel: "Galaxy",
    brand: "android",
    unscaledW: 432,
    unscaledH: 912,
    hasNotch: true,
    defaultColor: "phantom-black",
  },
  "iPad Pro": {
    name: "iPad Pro",
    shortLabel: "iPad",
    brand: "tablet",
    unscaledW: 548,
    unscaledH: 719,
    hasNotch: false,
    defaultColor: "space-gray",
  },
  "iPhone X": {
    name: "iPhone X",
    shortLabel: "iPhone X",
    brand: "apple",
    unscaledW: 427,
    unscaledH: 864,
    hasNotch: true,
    defaultColor: "",
  },
};

const SELECTABLE_DEVICES: SupportedDevice[] = [
  "iPhone 17",
  "Pixel 10",
  "Galaxy S25",
  "iPad Pro",
];

export function MobilePreview({
  src,
  children,
  width = 340,
  height,
  theme = "light",
  device = "iPhone 17",
  deviceModel,
  color,
  title = "Mobile Preview",
  showToolbar = true,
  hideNotch = false,
  fullBleed = false,
  zoom,
  className = "",
  statusBarTime,
}: MobilePreviewProps) {
  // Normalize legacy deviceModel if passed
  const initialDevice: SupportedDevice = useMemo(() => {
    if (deviceModel === "iphone-16-pro" || deviceModel === "iphone-15") return "iPhone 17";
    if (deviceModel === "minimal") return "iPhone 17";
    if (deviceModel && deviceModel in DEVICE_CONFIGS) return deviceModel as SupportedDevice;
    return device;
  }, [deviceModel, device]);

  const [activeDevice, setActiveDevice] = useState<SupportedDevice>(initialDevice);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isNotchHidden, setIsNotchHidden] = useState(
    hideNotch || deviceModel === "minimal"
  );

  // Dynamic Auto-Scale Calculator: Computes optimal scale so device fits container bounds
  const calculateAutoFitScale = useCallback(
    (dev: SupportedDevice, landscape: boolean): number => {
      const cfg = DEVICE_CONFIGS[dev] || DEVICE_CONFIGS["iPhone 17"];
      const nativeW = landscape ? cfg.unscaledH : cfg.unscaledW;
      const nativeH = landscape ? cfg.unscaledW : cfg.unscaledH;

      // Available bounding dimensions in typical modal preview
      const targetW = landscape ? Math.min(width * 1.45, 520) : width;
      const targetH = landscape ? 420 : (height || 590);

      const scaleW = targetW / nativeW;
      const scaleH = targetH / nativeH;

      // Restrict scale to the most constrained axis so it never overflows
      const optimal = Math.min(scaleW, scaleH, 1.0);
      return Number(Math.max(0.35, optimal).toFixed(2));
    },
    [width, height]
  );

  // Current active scale
  const [scale, setScale] = useState<number>(() => {
    if (typeof zoom === "number") return zoom;
    return calculateAutoFitScale(initialDevice, false);
  });

  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(Boolean(src));
  const [currentTime, setCurrentTime] = useState(statusBarTime || "9:41");

  // Keep status bar time updated dynamically
  useEffect(() => {
    if (statusBarTime) return;
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, [statusBarTime]);

  // Sync activeDevice when device prop changes from parent
  useEffect(() => {
    setActiveDevice(initialDevice);
    setScale(calculateAutoFitScale(initialDevice, isLandscape));
  }, [initialDevice, calculateAutoFitScale, isLandscape]);

  // Dynamically update scale when active device or orientation changes
  const handleDeviceChange = (newDevice: SupportedDevice) => {
    setActiveDevice(newDevice);
    // Dynamically auto-fit new device into available bounds
    const newScale = calculateAutoFitScale(newDevice, isLandscape);
    setScale(newScale);
  };

  const handleReload = () => {
    if (src) {
      setLoading(true);
      setIframeKey((prev) => prev + 1);
    }
  };

  const handleOpenExternal = () => {
    if (src) {
      window.open(src, "_blank", "noopener,noreferrer");
    }
  };

  // Dimensions of native frame and scaled bounding box
  const deviceConfig = DEVICE_CONFIGS[activeDevice];
  const nativeW = isLandscape ? deviceConfig.unscaledH : deviceConfig.unscaledW;
  const nativeH = isLandscape ? deviceConfig.unscaledW : deviceConfig.unscaledH;
  const containerW = Math.round(nativeW * scale);
  const containerH = Math.round(nativeH * scale);

  // Internal screen content (status bar, main canvas, home bar)
  const isDark = theme === "dark";
  const screenContent = (
    <div
      className={`w-full h-full relative overflow-hidden select-text ${
        isDark ? "bg-slate-950 text-white" : "bg-white text-slate-900"
      }`}
    >
      {/* ── Main Canvas Viewport ── */}
      <div
        className={`w-full h-full overflow-hidden ${
          fullBleed
            ? "absolute inset-0 z-0"
            : `flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                isDark ? "bg-slate-950" : "bg-white"
              }`
        }`}
      >
        {src ? (
          <>
            {loading && (
              <div
                className={`absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-xs gap-2 ${
                  isDark ? "bg-black/90 text-white/60" : "bg-slate-50/90 text-slate-400"
                }`}
              >
                <ReloadOutlined className="animate-spin text-xl text-blue-500" />
                <span className="text-xs font-medium">Loading live preview...</span>
              </div>
            )}
            <iframe
              key={iframeKey}
              src={src}
              title="Live Device Preview"
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
            />
          </>
        ) : (
          children
        )}
      </div>

      {/* ── Status Bar (iOS / Android) ── */}
      {!isNotchHidden && (
        <div
          className={`flex items-center justify-between text-[11px] font-semibold select-none shrink-0 pointer-events-none relative z-20 ${
            isDark ? "text-white/90 drop-shadow-xs" : "text-slate-800"
          } ${
            activeDevice === "iPhone 17"
              ? "h-12 pt-3 px-7"
              : activeDevice === "iPad Pro"
              ? "h-10 pt-2 px-6"
              : "h-9 pt-1.5 px-6"
          }`}
        >
          <span className="font-bold tracking-tight">{currentTime}</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold">5G</span>
            <WifiOutlined className="text-xs" />
            {/* Battery Indicator */}
            <div
              className={`w-5 h-2.5 rounded-[3px] border p-0.5 flex items-center ${
                isDark ? "border-white/70" : "border-slate-800/80"
              }`}
            >
              <div
                className={`w-full h-full rounded-[1px] ${
                  isDark ? "bg-white/90" : "bg-slate-800"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Home Indicator Bar ── */}
      <div
        className={`h-4.5 flex items-center justify-center bg-transparent pointer-events-none shrink-0 pb-1.5 pt-0.5 relative z-20 ${
          fullBleed ? "absolute bottom-0 inset-x-0" : ""
        }`}
      >
        <div
          className={`w-28 h-1 rounded-full transition-colors ${
            isDark ? "bg-white/40" : "bg-slate-300 hover:bg-slate-400"
          }`}
        />
      </div>
    </div>
  );

    // Render the type-safe MockFrame component with default dark finish
  const renderMockFrame = () => {
    const frameStyle: React.CSSProperties = {
      transformOrigin: "top center",
      margin: 0,
    };

    switch (activeDevice) {
      case "iPhone 17":
        return (
          <MockFrame
            device="iPhone 17"
            color={(color as any) || deviceConfig.defaultColor}
            landscape={isLandscape}
            hideNotch={isNotchHidden}
            style={frameStyle}
          >
            {screenContent}
          </MockFrame>
        );
      case "Pixel 10":
        return (
          <MockFrame
            device="Pixel 10"
            color={(color as any) || deviceConfig.defaultColor}
            landscape={isLandscape}
            hideNotch={isNotchHidden}
            style={frameStyle}
          >
            {screenContent}
          </MockFrame>
        );
      case "Galaxy S25":
        return (
          <MockFrame
            device="Galaxy S25"
            color={(color as any) || deviceConfig.defaultColor}
            landscape={isLandscape}
            hideNotch={isNotchHidden}
            style={frameStyle}
          >
            {screenContent}
          </MockFrame>
        );
      case "iPad Pro":
        return (
          <MockFrame
            device="iPad Pro"
            color={(color as any) || deviceConfig.defaultColor}
            landscape={isLandscape}
            style={frameStyle}
          >
            {screenContent}
          </MockFrame>
        );
      case "iPhone X":
        return (
          <MockFrame
            device="iPhone X"
            landscape={isLandscape}
            hideNotch={isNotchHidden}
            style={frameStyle}
          >
            {screenContent}
          </MockFrame>
        );
      default:
        return (
          <MockFrame
            device="iPhone 17"
            color="black"
            landscape={isLandscape}
            hideNotch={isNotchHidden}
            style={frameStyle}
          >
            {screenContent}
          </MockFrame>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center w-full select-none ${className}`}>
      {/* ── Scaled Hardware Canvas Wrapper (Centered) ────────────────── */}
      <div
        style={{
          width: containerW,
          height: containerH,
        }}
        className="relative mx-auto transition-all duration-300 ease-out"
      >
        <div
          style={{
            width: nativeW,
            height: nativeH,
            transform: `translateX(-50%) scale(${scale})`,
            transformOrigin: "top center",
            position: "absolute",
            top: 0,
            left: "50%",
          }}
          className="transition-transform duration-300 ease-out shrink-0"
        >
          {renderMockFrame()}
        </div>
      </div>

      {/* ── Vertical Floating Tool Rail at Bottom Right Corner ────────────────── */}
      {showToolbar && (
        <aside
          aria-label="Device controls"
          className="absolute bottom-2 right-1 sm:bottom-4 sm:right-3 shrink-0 flex flex-col items-center p-1 rounded-2xl bg-white/95 border border-slate-200/90 text-xs shadow-lg shadow-slate-900/10 backdrop-blur-md gap-0.5 z-20"
        >
          {SELECTABLE_DEVICES.map((d) => {
            const spec = DEVICE_CONFIGS[d];
            const isSelected = activeDevice === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleDeviceChange(d)}
                title={`${spec.name} (${spec.shortLabel})`}
                className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {spec.brand === "apple" ? (
                  <AppleOutlined className="text-sm" />
                ) : spec.brand === "android" ? (
                  <AndroidOutlined className="text-sm" />
                ) : (
                  <TabletOutlined className="text-sm" />
                )}
              </button>
            );
          })}

          {/* Iframe Action Controls (if applicable) */}
          {src && (
            <>
              <div className="w-5 h-px bg-slate-200/80 my-0.5" />
              <button
                type="button"
                onClick={handleReload}
                title="Reload preview"
                className="w-8.5 h-8.5 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-slate-500"
              >
                <ReloadOutlined className="text-xs" />
              </button>
              <button
                type="button"
                onClick={handleOpenExternal}
                title="Open in new window"
                className="w-8.5 h-8.5 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-slate-500"
              >
                <ExportOutlined className="text-xs" />
              </button>
            </>
          )}
        </aside>
      )}
    </div>
  );
}

export default MobilePreview;
