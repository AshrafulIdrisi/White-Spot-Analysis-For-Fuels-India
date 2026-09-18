import React, { useState } from "react";
import { WhiteSpotSite, ExistingOutlet, FuelBrand } from "../types";
import { 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Percent, 
  Sliders, 
  Info,
  Layers,
  ArrowRight
} from "lucide-react";
import { calculateCannibalization } from "../utils/calculations";
import { formatKL, formatINR } from "../utils/formatters";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

interface CannibalizationSimulatorProps {
  activeSite: WhiteSpotSite;
  existingOutlets: ExistingOutlet[];
  selectedBrand: FuelBrand | "All_OMCs";
  monthlyFuelKL: number;
}

export const CannibalizationSimulator: React.FC<CannibalizationSimulatorProps> = ({
  activeSite,
  existingOutlets,
  selectedBrand,
  monthlyFuelKL,
}) => {
  const [sisterDistanceKm, setSisterDistanceKm] = useState<number>(
    activeSite.nearestSisterOutletKm || 4.2
  );

  const brandToUse = selectedBrand === "All_OMCs" ? "IOCL" : selectedBrand;
  const cannibalization = calculateCannibalization(monthlyFuelKL, sisterDistanceKm, brandToUse);

  const pieData = [
    { name: "Net Incremental Volume", value: cannibalization.netIncrementalVolumeKL, color: "#10b981" },
    { name: "Sister Pump Diversion", value: cannibalization.cannibalizedVolumeKL, color: "#ef4444" },
  ];

  // Nearby Sister Dealers
  const nearbySisterDealers = existingOutlets
    .filter((o) => (selectedBrand === "All_OMCs" ? true : o.brand === selectedBrand) && o.monthlyKL > 0)
    .slice(0, 4);

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-rose-400" />
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Cannibalization & Sister Dealer Grievance Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Spatial distance-decay diversion model evaluating trade area overlap and dealer territorial integrity.
          </p>
        </div>

        {/* Distance Slider */}
        <div className="rounded-xl bg-slate-900 border border-slate-700 p-3 self-start sm:self-auto min-w-[280px]">
          <div className="flex justify-between items-center text-xs text-slate-200 font-semibold mb-1">
            <span className="flex items-center gap-1.5"><Sliders className="h-3.5 w-3.5 text-amber-400" /> Sister Dealer Distance:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{sisterDistanceKm.toFixed(1)} km</span>
          </div>
          <input
            id="sister-distance-slider"
            type="range"
            min={0.8}
            max={12.0}
            step={0.1}
            value={sisterDistanceKm}
            onChange={(e) => setSisterDistanceKm(Number(e.target.value))}
            className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>0.8km High Clash</span>
            <span>4.5km Moderate</span>
            <span>12km Isolated</span>
          </div>
        </div>
      </div>

      {/* Top 3 Result Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="text-[11px] uppercase font-semibold text-slate-400">Total Projected Forecourt Yield</div>
          <div className="text-3xl font-extrabold text-white font-mono mt-1">{formatKL(monthlyFuelKL)}</div>
          <div className="text-xs text-slate-400 mt-1">Candidate site baseline sales</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="text-[11px] uppercase font-semibold text-rose-400">Sister Outlet Diversion</div>
          <div className="text-3xl font-extrabold text-rose-400 font-mono mt-1">
            {formatKL(cannibalization.cannibalizedVolumeKL)}
          </div>
          <div className="text-xs text-rose-400/80 mt-1 font-medium">
            {cannibalization.cannibalizationPercent}% cannibalization rate
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="text-[11px] uppercase font-semibold text-emerald-400">Net Incremental Company Gain</div>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
            {formatKL(cannibalization.netIncrementalVolumeKL)}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1 font-medium">
            {100 - cannibalization.cannibalizationPercent}% Net New Portfolio Volume
          </div>
        </div>
      </div>

      {/* Grievance Risk Assessment Badge Banner */}
      <div
        className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${
          cannibalization.dealerGrievanceRisk === "Low"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : cannibalization.dealerGrievanceRisk === "Moderate"
            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : "border-rose-500/30 bg-rose-500/10 text-rose-300"
        }`}
      >
        <div className="flex items-center gap-3">
          {cannibalization.dealerGrievanceRisk === "Low" ? (
            <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
          )}
          <div>
            <h4 className="text-sm font-bold">
              Dealer Territorial Grievance Risk: {cannibalization.dealerGrievanceRisk}
            </h4>
            <p className="text-xs opacity-90 mt-0.5">{cannibalization.territoryImpactSummary}</p>
          </div>
        </div>
        <span className="self-start sm:self-auto rounded-xl px-3 py-1 bg-slate-950/80 text-xs font-mono font-bold border border-slate-700">
          Radius Buffer: {sisterDistanceKm.toFixed(1)} km
        </span>
      </div>

      {/* Visualizer: Pie Split & Sister Outlets List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Incremental Volume Pie */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-4">
            Volume Trade-Off Breakdown
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} KL/month`, "Volume"]}
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="flex items-center gap-2 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Net Incremental Volume
              </span>
              <span className="font-mono font-bold text-white">{cannibalization.netIncrementalVolumeKL} KL</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="flex items-center gap-2 text-rose-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-rose-400"></span> Cannibalized Volume
              </span>
              <span className="font-mono font-bold text-white">{cannibalization.cannibalizedVolumeKL} KL</span>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Sister Dealers Simulation Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3">
            Nearby Network Outlets & Projected Impact
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Sister Outlet</th>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Pre-Launch KL</th>
                  <th className="py-2.5 px-3">Diverted KL</th>
                  <th className="py-2.5 px-3">Post-Launch KL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {nearbySisterDealers.map((dealer, idx) => {
                  const diverted = Math.round(dealer.monthlyKL * (cannibalization.cannibalizationPercent / 100) * 0.4);
                  const postKL = dealer.monthlyKL - diverted;
                  return (
                    <tr key={dealer.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-slate-200">{dealer.name}</td>
                      <td className="py-3 px-3 text-slate-300">{dealer.brand}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{dealer.monthlyKL} KL</td>
                      <td className="py-3 px-3 font-mono text-rose-400 font-bold">-{diverted} KL</td>
                      <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{postKL} KL</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Under OMC dealer policy guidelines, sister stations beyond 3.0 km on 4-lane divided highways with medians maintain safe throughput with negligible legal dispute risk.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
