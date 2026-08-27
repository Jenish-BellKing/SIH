import type { Metadata } from "next";
import "./globals.css";
import { SurveillanceProvider } from "@/context/SurveillanceContext";

export const metadata: Metadata = {
  title: "IBVAP — Intelligent Border Video Analytics Platform",
  description:
    "Mission-critical Command Centre Dashboard for live border surveillance, real-time AI perception, ByteTrack object tracking, ANPR plate recognition, and tactical alert telemetry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080B11] text-slate-100 min-h-screen antialiased selection:bg-cyan-500 selection:text-black">
        <SurveillanceProvider>{children}</SurveillanceProvider>
      </body>
    </html>
  );
}
