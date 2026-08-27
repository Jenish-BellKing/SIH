"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MOCK_HOURLY_DETECTIONS } from "@/mock/analytics";

export const DetectionTrendChart: React.FC = () => {
  return (
    <div className="p-4 bg-[#0d131f] rounded-lg border border-slate-800 font-mono">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
            24-Hour Perception Inferences & Detections
          </h3>
          <p className="text-[11px] text-slate-400">
            Temporal distribution of human vs vehicle tracks across active sectors
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
          REAL-TIME AI TIMELINE
        </span>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={MOCK_HOURLY_DETECTIONS}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorHumans" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorANPR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d131f",
                borderColor: "#334155",
                borderRadius: "6px",
                fontSize: "12px",
                color: "#e2e8f0",
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "12px",
                fontSize: "11px",
              }}
            />

            <Area
              type="monotone"
              dataKey="humans"
              name="Humans Detected"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorHumans)"
            />
            <Area
              type="monotone"
              dataKey="vehicles"
              name="Vehicles Tracked"
              stroke="#06B6D4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVehicles)"
            />
            <Area
              type="monotone"
              dataKey="anpr"
              name="ANPR Plates"
              stroke="#F59E0B"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorANPR)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
