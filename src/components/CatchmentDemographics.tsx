import React from "react";
import { WhiteSpotSite } from "../types";
import { 
  Users, 
  Car, 
  Truck, 
  Zap, 
  Building2, 
  Compass, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";
import { formatIndianNumber } from "../utils/formatters";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

interface CatchmentDemographicsProps {
  activeSite: WhiteSpotSite;
}

export const CatchmentDemographics: React.FC<CatchmentDemographicsProps> = ({ activeSite }) => {
  const { demographics } = activeSite;

  const fleetData = [
    { name: "2-Wheelers", value: demographics.fleetMix.twoWheeler, color: "#a855f7", icon: "🛵", avgFuel: "3.5 L MS" },
    { name: "4-Wheeler Passenger", value: demographics.fleetMix.fourWheeler, color: "#c084fc", icon: "🚗", avgFuel: "24 L MS/EV" },
    { name: "Commercial & Trucks", value: demographics.fleetMix.commercialHCV, color: "#6366f1", icon: "🚛", avgFuel: "115 L HSD" },
  ];

  const secData = [
    { name: "SEC A (Affluent / High Discretionary)", value: demographics.secMix.secA, color: "#a855f7" },
    { name: "SEC B (Middle / Emerging Transit)", value: demographics.secMix.secB, color: "#818cf8" },
    { name: "SEC C (Mass Transit / Local Freight)", value: demographics.secMix.secC, color: "#64748b" },
  ];

  const populationRadii = [
    { radius: "3 km Urban Core", pop: demographics.catchmentPop3km, density: "High Density", tag: "Primary Commuter" },
    { radius: "5 km Trade Catchment", pop: demographics.catchmentPop5km, density: "Medium Density", tag: "Radial Inflow" },
    { radius: "10 km Highway Corridor", pop: demographics.catchmentPop10km, density: "Macro Corridor", tag: "Intercity Freight" },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-purple-800/40 pb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-400" />
          <h2 className="text-xl lg:text-2xl font-extrabold text-white">
            Catchment Demographics & Fleet Profile Engine
          </h2>
        </div>
        <p className="text-xs text-purple-200/90 mt-1">
          Isochrone population buffers, socio-economic profiling (SEC A/B/C), vehicle modal split, and electrical grid feeder feasibility.
        </p>
      </div>

      {/* Population Catchment Isochrone Cards (Purple & Crisp White) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {populationRadii.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 shadow-lg relative overflow-hidden backdrop-blur-sm"
          >
            <div className="absolute top-0 right-0 h-24 w-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-white uppercase tracking-wider">{item.radius}</span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-purple-950 shadow-sm">
                {item.tag}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono mt-2">
              {formatIndianNumber(item.pop)}
            </div>
            <div className="text-xs text-purple-300 mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
              Estimated Captive Population ({item.density})
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Fleet Modal Split & SEC Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Vehicle Fleet Composition */}
        <div className="lg:col-span-6 rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 shadow-lg">
          <div className="border-b border-purple-800/40 pb-3 mb-4">
            <h3 className="text-base font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2"><Car className="h-4 w-4 text-purple-400" /> Vehicle Fleet Split</span>
              <span className="text-xs text-purple-300 font-mono">100% Modal Total</span>
            </h3>
          </div>

          <div className="space-y-4">
            {fleetData.map((f, i) => (
              <div key={i} className="rounded-xl bg-slate-900/90 border border-purple-900/50 p-3.5">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="text-base">{f.icon}</span>
                    {f.name}
                  </span>
                  <span className="font-mono font-bold text-white text-sm">{f.value}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${f.value}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-purple-300">
                  <span>Avg Fill Volume: <strong className="text-white">{f.avgFuel}</strong></span>
                  <span className="text-purple-400">Yield Factor: {(f.value * 0.9).toFixed(1)}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 6 Cols: Socio-Economic Profile (SEC) & Grid Headroom */}
        <div className="lg:col-span-6 rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="border-b border-purple-800/40 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-purple-400" /> Socio-Economic Classification (SEC)</span>
                <span className="text-xs text-purple-300">NFR & EV Affluence</span>
              </h3>
            </div>

            <div className="space-y-3">
              {secData.map((sec, i) => (
                <div key={i} className="rounded-xl bg-slate-900/90 border border-purple-900/50 p-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white">{sec.name}</span>
                    <span className="font-mono font-bold text-purple-300">{sec.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${sec.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Feeder & Transformer Headroom for EV Charging */}
          <div className="mt-4 pt-4 border-t border-purple-800/40 rounded-xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 p-3.5 border border-purple-500/30">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-cyan-300" />
                DISCOM Substation & Transformer Headroom
              </span>
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/40">
                EV Ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-purple-900/60">
                <div className="text-[10px] text-purple-300">Nearest Line</div>
                <div className="font-mono font-bold text-white text-sm">{demographics.gridSubstationKv} kV Substation</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/80 border border-purple-900/60">
                <div className="text-[10px] text-purple-300">Transformer Capacity</div>
                <div className="font-mono font-bold text-cyan-300 text-sm">{demographics.transformerHeadroomKva} kVA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
