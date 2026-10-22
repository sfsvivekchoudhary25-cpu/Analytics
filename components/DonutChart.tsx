"use client";

import React from "react";
import { UnifiedChart, type DonutSegment } from "./UnifiedChart";

export type Segment = DonutSegment;

/**
 * DonutChart Component (Legacy Wrapper)
 * Automatically delegates to the centralized UnifiedChart component.
 */
export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: Segment[];
  centerLabel: string;
  centerValue: string | number;
}) {
  return (
    <UnifiedChart
      type="donut"
      segments={segments}
      centerLabel={centerLabel}
      centerValue={centerValue}
    />
  );
}
