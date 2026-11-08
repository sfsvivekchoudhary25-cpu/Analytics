"use client";

import React from "react";
import { UnifiedChart, type Series } from "./UnifiedChart";

export type { Series };
export const description = "A stacked bar chart with a legend (Centralized via UnifiedChart)";

/**
 * MultiLineChart Component (Legacy Wrapper)
 * Automatically delegates to the centralized UnifiedChart component.
 */
export function MultiLineChart(props: {
  dates?: string[];
  series?: Series[];
  hideLegend?: boolean;
  hideFooter?: boolean;
}) {
  return (
    <UnifiedChart
      type="stacked-bar"
      dates={props.dates}
      series={props.series}
      hideLegend={props.hideLegend}
      hideFooter={props.hideFooter}
    />
  );
}
