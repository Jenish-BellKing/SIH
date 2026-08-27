"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MOCK_VEHICLE_CLASSES } from "@/mock/analytics";

export const VehicleClassChart: React.FC = () => {
  return (
    <div className="p-4 bg-[#0d131f] rounded-lg border border-slate-800 font-mono">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
            Vehicle Taxonomy Breakdown
          </h3>
          <p className="text-[11px] text-slate-400">
            YOLOv8 vehicle classification distribution
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
          5 SUBCLASSES
        </span>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={MOCK_VEHICLE_CLASSES}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="count"
              stroke="#0d131f"
              strokeWidth={2}
            >
              {MOCK_VEHICLE_CLASSES.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
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
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                fontSize: "11px",
                paddingTop: "10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
