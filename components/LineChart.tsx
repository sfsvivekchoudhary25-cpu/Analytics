"use client";

import React from "react";
import { UnifiedChart, type Point, computeIntegerTicks } from "./UnifiedChart";

export type { Point };
export { computeIntegerTicks };
export const description = "A bar chart with a label (Centralized via UnifiedChart)";

/**
 * LineChart Component (Legacy Wrapper)
 * Automatically delegates to the centralized UnifiedChart component.
 */
export function LineChart(props: {
  data: Point[];
  label: string;
  color?: string;
  showStats?: boolean;
  ribbonClassName?: string;
  hideFooter?: boolean;
}) {
  return (
    <UnifiedChart
      type="bar"
      data={props.data}
      label={props.label}
      color={props.color}
      showStats={props.showStats}
      hideFooter={props.hideFooter}
    />
  );
}

export function ChartBarLabel(props: { data?: Point[]; label?: string; color?: string }) {
  return <LineChart data={props.data || []} label={props.label || "Count"} color={props.color} />;
}
