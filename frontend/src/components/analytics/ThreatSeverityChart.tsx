"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MOCK_THREAT_DISTRIBUTION } from "@/mock/analytics";

export const ThreatSeverityChart: React.FC = () => {
  return (
    <div className="p-4 bg-[#0d131f] rounded-lg border border-slate-800 font-mono">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
            Threat Tier Severity Distribution
          </h3>
          <p className="text-[11px] text-slate-400">
            Hourly alert breakdown by criticality tier
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/50">
          SECURITY METRICS
        </span>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={MOCK_THREAT_DISTRIBUTION}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
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

            <Bar dataKey="low" name="Low (Info)" fill="#3B82F6" stackId="a" />
            <Bar dataKey="medium" name="Medium" fill="#F59E0B" stackId="a" />
            <Bar dataKey="high" name="High Risk" fill="#F97316" stackId="a" />
            <Bar dataKey="critical" name="Critical" fill="#EF4444" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
