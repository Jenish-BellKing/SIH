"use client";

import React from "react";
import { useSurveillance } from "@/context/SurveillanceContext";
import {
  LayoutDashboard,
  Video,
  BellRing,
  BarChart3,
  ListTree,
  MapPin,
  Server,
} from "lucide-react";

export type ActiveTab =
  | "command"
  | "cameras"
  | "alerts"
  | "analytics"
  | "events"
  | "map"
  | "system";

interface NavigationBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { unacknowledgedAlertsCount, cameras, events } = useSurveillance();

  const onlineCamerasCount = cameras.filter((c) => c.status === "online").length;

  const navItems = [
    {
      id: "command" as ActiveTab,
      label: "Command Centre",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "cameras" as ActiveTab,
      label: "Camera Feeds",
      icon: Video,
      badge: `${onlineCamerasCount}/${cameras.length}`,
      badgeColor: "bg-emerald-950 text-emerald-300 border-emerald-700/50",
    },
    {
      id: "alerts" as ActiveTab,
      label: "Threat Alerts",
      icon: BellRing,
      badge:
        unacknowledgedAlertsCount > 0
          ? `${unacknowledgedAlertsCount} ACTIVE`
          : null,
      badgeColor: "bg-red-950 text-red-300 border-red-700/50 animate-pulse",
    },
    {
      id: "analytics" as ActiveTab,
      label: "AI Analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "events" as ActiveTab,
      label: "Event Forensics",
      icon: ListTree,
      badge: `${events.length}`,
      badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
    },
    {
      id: "map" as ActiveTab,
      label: "Tactical GIS Map",
      icon: MapPin,
      badge: "RADAR",
      badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-800/50",
    },
    {
      id: "system" as ActiveTab,
      label: "System Status",
      icon: Server,
      badge: "HEALTH",
      badgeColor: "bg-slate-800 text-emerald-400 border-slate-700",
    },
  ];

  return (
    <nav className="border-b border-slate-800/80 bg-[#0c111c] px-4 overflow-x-auto select-none scrollbar-none">
      <div className="flex items-center gap-1 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono font-medium border-b-2 transition-all cursor-pointer ${
                isActive
                  ? "border-cyan-400 text-cyan-400 bg-cyan-950/30"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-cyan-400" : "text-slate-400"
                }`}
              />
              <span className="tracking-wide uppercase">{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
