"use client";

import { useState } from "react";
import type { Insight } from "@/lib/insights-engine";

const TYPE_STYLES: Record<string, { border: string; bg: string; badge: string; icon: string }> = {
  critical: { border: "border-rose-500/20", bg: "bg-rose-500/[0.04]", badge: "bg-rose-500/15 text-rose-400", icon: "!" },
  warning: { border: "border-amber-500/20", bg: "bg-amber-500/[0.03]", badge: "bg-amber-500/15 text-amber-400", icon: "!" },
  opportunity: { border: "border-emerald-500/20", bg: "bg-emerald-500/[0.03]", badge: "bg-emerald-500/15 text-emerald-400", icon: "+" },
  info: { border: "border-blue-500/15", bg: "bg-blue-500/[0.02]", badge: "bg-blue-500/15 text-blue-400", icon: "i" },
};

interface Props {
  insights: Insight[];
  title?: string;
}

export function AIInsightsCard({ insights, title = "AI Insights" }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (insights.length === 0) return null;

  const criticalCount = insights.filter((i) => i.type === "critical" || i.type === "warning").length;

  return (
    <div className="bg-[#12131a] border border-[var(--border-card)] rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.01] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <span className="text-indigo-400 text-[0.7rem] font-bold">AI</span>
          </div>
          <h3 className="text-[0.85rem] font-semibold text-[var(--text-heading)] tracking-[-0.01em]">{title}</h3>
          <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-[var(--bg-card-hover)] text-[var(--text-secondary)] font-medium">
            {insights.length}
          </span>
          {criticalCount > 0 && (
            <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 font-medium">
              {criticalCount} action needed
            </span>
          )}
        </div>
        <span className="text-[var(--text-muted)] text-[0.7rem]">{expanded ? "▴" : "▾"}</span>
      </button>

      {/* Insights list */}
      {expanded && (
        <div className="px-5 pb-4 space-y-2">
          {insights.map((insight) => {
            const style = TYPE_STYLES[insight.type];
            return (
              <div key={insight.id} className={`flex items-start gap-3 p-3 rounded-xl border ${style.border} ${style.bg}`}>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[0.6rem] font-bold ${style.badge}`}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.75rem] font-semibold text-[var(--text-primary)]">{insight.title}</p>
                    {insight.metric && (
                      <span className="text-[0.6rem] font-mono font-semibold text-[var(--text-secondary)] shrink-0">{insight.metric}</span>
                    )}
                  </div>
                  <p className="text-[0.68rem] text-[var(--text-secondary)] leading-relaxed mt-0.5">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
