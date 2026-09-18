import React, { useState } from "react";
import { WhiteSpotSite, TrafficModelOutputs } from "../types";
import { 
  Activity, 
  Car, 
  Truck, 
  Fuel, 
  Zap, 
  Sliders, 
  Clock, 
  ArrowUpRight, 
  Gauge,
  TrendingUp,
  Info
} from "lucide-react";
import { formatIndianNumber, formatKL, formatINR } from "../utils/formatters";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

interface FootfallPCUFlowProps {
  activeSite: WhiteSpotSite;
  traffic: TrafficModelOutputs;
  captureRate: number;
  setCaptureRate: (rate: number) => void;
}

export const FootfallPCUFlow: React.FC<FootfallPCUFlowProps> = ({
  activeSite,
  traffic,
  captureRate,
  setCaptureRate,
}) => {
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(8); // 08:00 AM by default
  const currentHourData = traffic.diurnalCurve[selectedHourIndex] || traffic.diurnalCurve[0];

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-purple-800/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">
              Footfall, Highway PCU & Diurnal Commuter Flow
            </h2>
          </div>
          <p className="text-xs text-purple-200/90 mt-1">
            NHAI FASTag toll throughput traffic modeling with 24-hour diurnal arrival curves and corridor capture rate sensitivity.
          </p>
        </div>

        {/* Capture Rate Slider Card (Purple & White) */}
        <div className="flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-purple-950/40 p-3 shadow-md">
          <Sliders className="h-4 w-4 text-purple-400" />
          <div>
            <div className="flex items-center justify-between text-xs text-purple-200 font-semibold gap-3">
              <span>Capture Rate</span>
              <span className="font-mono font-bold text-white text-sm">{captureRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={6.5}
              step={0.1}
              value={captureRate}
              onChange={(e) => setCaptureRate(Number(e.target.value))}
              className="w-36 accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer mt-1"
            />
          </div>
        </div>
      </div>

      {/* High-Level Traffic KPI Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-4 shadow-lg">
          <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">AADT Corridor Flow</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatIndianNumber(traffic.aadt)}
          </div>
          <div className="text-[11px] text-purple-200 mt-1">Vehicles/Day (Both Carriageways)</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-4 shadow-lg">
          <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">PCU Equivalent</div>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono mt-1">
            {formatIndianNumber(traffic.pcu)}
          </div>
          <div className="text-[11px] text-purple-200 mt-1">HCV Multi-Axle Weighted Flow</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-4 shadow-lg">
          <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">Captive Daily Footfall</div>
          <div className="text-2xl font-extrabold text-purple-300 font-mono mt-1">
            {formatIndianNumber(traffic.dailyFootfall)}
          </div>
          <div className="text-[11px] text-purple-200 mt-1">Vehicles Entering Forecourt</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-4 shadow-lg">
          <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">Projected Fuel Throughput</div>
          <div className="text-2xl font-extrabold text-emerald-300 font-mono mt-1">
            {formatKL(traffic.monthlyFuelKL)}
          </div>
          <div className="text-[11px] text-emerald-300 mt-1">Monthly Volume Yield</div>
        </div>
      </div>

      {/* 24-Hour Diurnal Arrival Curve Chart */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-purple-800/40 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              24-Hour Diurnal Footfall & Traffic Arrival Pattern
            </h3>
            <p className="text-xs text-purple-200/80">
              Corridor hourly distribution showing AM commuter peak, evening transit rush, and late-night HCV freight surges.
            </p>
          </div>
          <span className="text-xs text-purple-300 font-mono">100% 24-Hr Cycle</span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={traffic.diurnalCurve}>
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" opacity={0.3} />
              <XAxis dataKey="hour" stroke="#c084fc" fontSize={11} />
              <YAxis stroke="#c084fc" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0b0618", borderColor: "#7c3aed", borderRadius: "12px", fontSize: "11px", color: "#fff" }}
              />
              <Area type="monotone" dataKey="pcuVolume" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#purpleGradient)" name="PCU Volume" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
