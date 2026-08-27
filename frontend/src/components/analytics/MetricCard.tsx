"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  color?: "cyan" | "emerald" | "amber" | "red" | "blue" | "purple";
  isSimulated?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  color = "cyan",
  isSimulated = false,
}) => {
  const getColorStyles = () => {
    switch (color) {
      case "emerald":
        return {
          border: "border-emerald-500/30 hover:border-emerald-500/50",
          iconBg: "bg-emerald-950/80 text-emerald-400 border-emerald-700/50",
          valueColor: "text-emerald-300",
          glow: "shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        };
      case "amber":
        return {
          border: "border-amber-500/30 hover:border-amber-500/50",
          iconBg: "bg-amber-950/80 text-amber-400 border-amber-700/50",
          valueColor: "text-amber-300",
          glow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]",
        };
      case "red":
        return {
          border: "border-red-500/40 hover:border-red-500/60",
          iconBg: "bg-red-950/80 text-red-400 border-red-700/50",
          valueColor: "text-red-300",
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
        };
      case "blue":
        return {
          border: "border-blue-500/30 hover:border-blue-500/50",
          iconBg: "bg-blue-950/80 text-blue-400 border-blue-700/50",
          valueColor: "text-blue-300",
          glow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]",
        };
      case "purple":
        return {
          border: "border-purple-500/30 hover:border-purple-500/50",
          iconBg: "bg-purple-950/80 text-purple-400 border-purple-700/50",
          valueColor: "text-purple-300",
          glow: "shadow-[0_0_15px_rgba(168,85,247,0.1)]",
        };
      case "cyan":
      default:
        return {
          border: "border-cyan-500/30 hover:border-cyan-500/50",
          iconBg: "bg-cyan-950/80 text-cyan-400 border-cyan-700/50",
          valueColor: "text-cyan-300",
          glow: "shadow-[0_0_15px_rgba(6,182,212,0.1)]",
        };
    }
  };

  const styles = getColorStyles();

  return (
    <div
      className={`relative p-4 rounded-lg bg-[#0d131f] border ${styles.border} ${styles.glow} transition-all font-mono select-none`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          {title}
        </span>
        <div
          className={`p-2 rounded-lg border ${styles.iconBg} flex items-center justify-center`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className={`text-2xl sm:text-3xl font-extrabold ${styles.valueColor}`}>
          {value}
        </div>

        {trend && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
              trendPositive
                ? "bg-emerald-950/70 text-emerald-400 border-emerald-800/50"
                : "bg-red-950/70 text-red-400 border-red-800/50"
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{subtitle}</span>
          {isSimulated && (
            <span className="text-[9px] text-amber-500 bg-amber-950/50 px-1 rounded border border-amber-800/40">
              SIMULATED
            </span>
          )}
        </div>
      )}
    </div>
  );
};
