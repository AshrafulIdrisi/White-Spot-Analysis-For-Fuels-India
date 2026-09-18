import React, { useState } from "react";
import { WhiteSpotSite, TrafficModelOutputs, ActiveTab } from "../types";
import { LocationAnalysisResult } from "../services/geoIntelligence";
import { formatIndianNumber, formatKL, formatINR } from "../utils/formatters";
import { 
  Activity, 
  Car, 
  Truck, 
  Fuel, 
  Zap, 
  Sliders, 
  Clock, 
  ArrowUpRight, 
  TrendingUp, 
  Users, 
  Compass, 
  ShieldCheck, 
  Layers, 
  CheckCircle2,
  MapPin,
  Trash2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface FootfallFleetIntelligenceProps {
  activeSite: WhiteSpotSite;
  analysis: LocationAnalysisResult | null;
  traffic: TrafficModelOutputs;
  captureRate: number;
  setCaptureRate: (rate: number) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onClearAnalysis?: () => void;
}

export const FootfallFleetIntelligence: React.FC<FootfallFleetIntelligenceProps> = ({
  activeSite,
  analysis,
  traffic,
  captureRate,
  setCaptureRate,
  setActiveTab,
  onClearAnalysis,
}) => {
  // Use analysis data if available for the clicked location, or fallback to activeSite
  const aadt = analysis ? analysis.trafficIntelligence.estimatedAADT : activeSite.aadtTraffic;
  const pcu = analysis ? analysis.trafficIntelligence.pcuEquivalent : activeSite.pcuEquivalent;
  const hcvShare = analysis ? analysis.fleetBreakdown.commercialHCVTrucksPct : activeSite.demographics.fleetMix.commercialHCV;
  const twoWheeler = analysis ? analysis.fleetBreakdown.twoWheelerPct : activeSite.demographics.fleetMix.twoWheeler;
  const fourWheeler = analysis ? (analysis.fleetBreakdown.fourWheelerPetrolPct + analysis.fleetBreakdown.fourWheelerDieselPct) : activeSite.demographics.fleetMix.fourWheeler;
  
  // Calculate dynamic numbers from captureRate
  const dailyFootfall = Math.round((aadt * captureRate) / 100);
  const monthlyFuelKL = Math.round((dailyFootfall * (hcvShare > 25 ? 12.8 : 9.5) * 30) / 1000);
  const dailyEVUnits = Math.round(dailyFootfall * 0.09 * 32.0 + 1200);
  const dailyCNGKg = Math.round(dailyFootfall * 0.14 * 8.5 + 1500);

  const locName = analysis?.location.roadName || activeSite.name;
  const locAddress = analysis?.location.formattedAddress || `${activeSite.corridor}, ${activeSite.district}, ${activeSite.state}`;

  // Diurnal curve
  const diurnalData = analysis ? analysis.trafficIntelligence.diurnalProfile.map((d) => ({
    hour: d.hour,
    volume: d.trafficVolume,
    footfall: Math.round((d.trafficVolume * captureRate) / 100),
    hcvShare: d.hcvSharePct,
  })) : traffic.diurnalCurve.map((d) => ({
    hour: d.hour,
    volume: Math.round(d.pcuVolume),
    footfall: Math.round((d.pcuVolume * captureRate) / 100),
    hcvShare: d.hsdShare,
  }));

  const fleetModalSplit = [
    { name: "2-Wheelers (Commuter/Local)", value: twoWheeler, color: "#7e22ce", icon: "🛵", avgFill: "3.5 L MS" },
    { name: "4-Wheeler Passenger (Cars/SUVs/EVs)", value: fourWheeler, color: "#a855f7", icon: "🚗", avgFill: "24 L MS/EV" },
    { name: "Commercial & Multi-Axle Trucks", value: hcvShare, color: "#6366f1", icon: "🚛", avgFill: "120 L HSD" },
  ];

  const pop3k = analysis?.catchmentDemographics.estPopulation3km || activeSite.demographics.catchmentPop3km;
  const pop5k = analysis?.catchmentDemographics.estPopulation5km || activeSite.demographics.catchmentPop5km;
  const pop10k = analysis?.catchmentDemographics.estPopulation10km || activeSite.demographics.catchmentPop10km;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900 bg-slate-50">
      {/* Live Location Header Banner (Purple & Crisp White) */}
      <div className="relative rounded-2xl bg-purple-700 text-white p-5 shadow-md overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-purple-950 shadow-sm">
                <Activity className="h-3.5 w-3.5 text-purple-700" />
                Live Footfall & Fleet Modeling
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-800 text-purple-100 border border-purple-500">
                {activeSite.corridorType.replace("_", " ")}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping"></span>
                NHAI FASTag & Overpass Calibrated
              </span>
            </div>

            <h2 className="text-xl lg:text-2xl font-extrabold text-white mt-2 leading-tight">
              {locName}
            </h2>
            <p className="text-xs text-purple-100 mt-1 max-w-2xl font-medium">
              {locAddress}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Interactive Capture Rate Slider */}
            <div className="flex items-center gap-3 rounded-2xl border border-purple-500 bg-purple-800/90 p-3.5 shadow-sm text-white">
              <Sliders className="h-5 w-5 text-purple-200 shrink-0" />
              <div>
                <div className="flex items-center justify-between text-xs text-purple-100 font-bold gap-4">
                  <span>Forecourt Capture Rate</span>
                  <span className="font-mono text-base font-extrabold text-white">{captureRate.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={6.5}
                  step={0.1}
                  value={captureRate}
                  onChange={(e) => setCaptureRate(Number(e.target.value))}
                  className="w-44 accent-white h-1.5 bg-purple-950 rounded-lg cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[10px] text-purple-200 font-mono mt-0.5">
                  <span>1.0% Min</span>
                  <span>3.2% Highway Avg</span>
                  <span>6.5% Max</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {analysis && onClearAnalysis && (
                <button
                  onClick={onClearAnalysis}
                  className="rounded-xl bg-purple-800 hover:bg-red-600 text-white font-bold text-xs py-2 px-3 shadow-sm flex items-center gap-1.5 transition-all border border-purple-500 hover:border-red-400"
                  title="Clear Point Analysis"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Point
                </button>
              )}
              <button
                onClick={() => setActiveTab("spatial_map")}
                className="rounded-xl bg-white hover:bg-purple-50 text-purple-950 font-bold text-xs py-2 px-3 shadow-sm flex items-center gap-1.5 border border-purple-200 transition-all"
              >
                <Compass className="h-3.5 w-3.5 text-purple-700" />
                Map View
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Traffic KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-purple-600 text-xs">
          <div className="rounded-xl bg-purple-800/70 border border-purple-600 p-3">
            <div className="text-[10px] uppercase font-bold text-purple-200">Highway AADT Flow</div>
            <div className="text-xl font-extrabold text-white font-mono mt-0.5">{formatIndianNumber(aadt)}</div>
            <div className="text-[10px] text-purple-200">Vehicles/Day Total</div>
          </div>

          <div className="rounded-xl bg-purple-800/70 border border-purple-600 p-3">
            <div className="text-[10px] uppercase font-bold text-purple-200">PCU Equivalent</div>
            <div className="text-xl font-extrabold text-cyan-200 font-mono mt-0.5">{formatIndianNumber(pcu)}</div>
            <div className="text-[10px] text-purple-200">HCV Weighted Flow</div>
          </div>

          <div className="rounded-xl bg-purple-800/70 border border-purple-600 p-3">
            <div className="text-[10px] uppercase font-bold text-purple-200">Liquid Fuel Yield</div>
            <div className="text-xl font-extrabold text-white font-mono mt-0.5">{formatKL(monthlyFuelKL)}</div>
            <div className="text-[10px] text-purple-200">Monthly Forecourt KL</div>
          </div>

          <div className="rounded-xl bg-purple-800/70 border border-purple-600 p-3">
            <div className="text-[10px] uppercase font-bold text-emerald-200">CNG Cascade Yield</div>
            <div className="text-xl font-extrabold text-emerald-300 font-mono mt-0.5">{formatIndianNumber(dailyCNGKg)} <span className="text-xs">kg/day</span></div>
            <div className="text-[10px] text-emerald-200">Cascade / Mother Hub</div>
          </div>

          <div className="rounded-xl bg-purple-800/70 border border-purple-600 p-3">
            <div className="text-[10px] uppercase font-bold text-cyan-200">EV DC Fast Draw</div>
            <div className="text-xl font-extrabold text-cyan-300 font-mono mt-0.5">{formatIndianNumber(dailyEVUnits)} <span className="text-xs">kWh/day</span></div>
            <div className="text-[10px] text-cyan-200">Fast Charging Plazas</div>
          </div>
        </div>
      </div>

      {/* 24-Hour Diurnal Hourly Flow Chart */}
      <div className="rounded-2xl border-2 border-purple-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-purple-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-purple-950 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-700" />
              24-Hour Diurnal Traffic PCU & Captive Arrival Curve
            </h3>
            <p className="text-xs text-purple-800 mt-0.5 font-medium">
              Hourly distribution showing morning commuter peak, evening transit rush, and late-night HCV commercial freight surges.
            </p>
          </div>
          <span className="text-xs text-purple-900 font-mono font-bold bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
            24-Hour Cycle
          </span>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={diurnalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="purpleGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7e22ce" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7e22ce" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="cyanGradLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" opacity={0.6} />
              <XAxis dataKey="hour" stroke="#6b21a8" fontSize={11} tickLine={false} />
              <YAxis stroke="#6b21a8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", borderColor: "#c084fc", borderRadius: "12px", fontSize: "11px", color: "#3b0764", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Area type="monotone" dataKey="volume" stroke="#7e22ce" strokeWidth={2} fillOpacity={1} fill="url(#purpleGradLight)" name="Corridor Hourly Volume (Vehicles)" />
              <Area type="monotone" dataKey="footfall" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#cyanGradLight)" name="Captive Forecourt Footfall" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vehicle Modal Split & Isochrone Population Buffers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Vehicle Modal Split */}
        <div className="lg:col-span-6 rounded-2xl border-2 border-purple-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-purple-950 flex items-center gap-2">
                <Car className="h-4 w-4 text-purple-700" />
                Vehicle Fleet Modal Split
              </h3>
              <span className="text-xs font-mono font-bold text-purple-800">100% Modal Mix</span>
            </div>

            <div className="space-y-4">
              {fleetModalSplit.map((f, i) => (
                <div key={i} className="rounded-xl bg-purple-50 border border-purple-200 p-3.5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-purple-950 flex items-center gap-2">
                      <span className="text-base">{f.icon}</span>
                      {f.name}
                    </span>
                    <span className="font-mono font-bold text-purple-950 text-sm">{f.value}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-purple-200 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-purple-700" style={{ width: `${f.value}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-purple-800 font-medium">
                    <span>Avg Fill Volume: <strong className="text-purple-950 font-bold">{f.avgFill}</strong></span>
                    <span className="text-purple-700 font-bold">Throughput Impact: {(f.value * 0.9).toFixed(1)}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-100 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
              <div className="text-[10px] text-purple-800 font-bold uppercase">FASTag Toll Adoption</div>
              <div className="font-mono font-bold text-purple-950">98.4% Electronic</div>
            </div>
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200">
              <div className="text-[10px] text-purple-800 font-bold uppercase">EV Readiness Score</div>
              <div className="font-mono font-bold text-cyan-800">{analysis?.fleetBreakdown.electricVehicleReadinessScore || activeSite.evAdoptionScore}/100</div>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Isochrone Population Buffers & Grid Headroom */}
        <div className="lg:col-span-6 rounded-2xl border-2 border-purple-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-purple-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-purple-950 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-700" />
                Radial Population Isochrones (3km / 5km / 10km)
              </h3>
              <span className="text-xs text-purple-800 font-bold">Captive Base</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-purple-800">3 km Urban</div>
                <div className="text-lg font-extrabold text-purple-950 font-mono mt-1">{formatIndianNumber(pop3k)}</div>
                <div className="text-[9px] text-purple-700 font-medium mt-0.5">Primary Commuters</div>
              </div>

              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-purple-800">5 km Trade Area</div>
                <div className="text-lg font-extrabold text-purple-950 font-mono mt-1">{formatIndianNumber(pop5k)}</div>
                <div className="text-[9px] text-purple-700 font-medium mt-0.5">Radial Inflow</div>
              </div>

              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-center">
                <div className="text-[10px] uppercase font-bold text-purple-800">10 km Corridor</div>
                <div className="text-lg font-extrabold text-purple-950 font-mono mt-1">{formatIndianNumber(pop10k)}</div>
                <div className="text-[9px] text-purple-700 font-medium mt-0.5">Intercity Freight</div>
              </div>
            </div>

            {/* Socio-Economic Mix */}
            <div className="mt-4 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
              <div className="text-[11px] font-bold text-purple-950 mb-2 flex items-center justify-between">
                <span>Socio-Economic Classification (SEC)</span>
                <span className="text-[10px] text-purple-800 font-mono font-bold">Affluence Ratio</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-1.5 rounded bg-white border border-purple-200 shadow-xs">
                  <div className="text-[10px] text-purple-800 font-bold">SEC A (Affluent)</div>
                  <div className="font-mono font-bold text-purple-950 text-sm">{activeSite.demographics.secMix.secA}%</div>
                </div>
                <div className="p-1.5 rounded bg-white border border-purple-200 shadow-xs">
                  <div className="text-[10px] text-purple-800 font-bold">SEC B (Middle)</div>
                  <div className="font-mono font-bold text-purple-950 text-sm">{activeSite.demographics.secMix.secB}%</div>
                </div>
                <div className="p-1.5 rounded bg-white border border-purple-200 shadow-xs">
                  <div className="text-[10px] text-purple-800 font-bold">SEC C (Transit)</div>
                  <div className="font-mono font-bold text-purple-950 text-sm">{activeSite.demographics.secMix.secC}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* DISCOM Power Feeder Capacity */}
          <div className="mt-4 pt-4 border-t border-purple-100 rounded-xl bg-purple-50 p-3.5 border border-purple-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-950 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-purple-700" />
                DISCOM Substation & Transformer Headroom
              </span>
              <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-900 border border-cyan-300">
                EV Plazas Ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
              <div className="p-2 rounded-lg bg-white border border-purple-200 shadow-xs">
                <div className="text-[10px] text-purple-800 font-bold uppercase">Nearest Line</div>
                <div className="font-mono font-bold text-purple-950 text-sm">{analysis?.catchmentDemographics.gridSubstationKv || activeSite.demographics.gridSubstationKv} kV Substation</div>
              </div>
              <div className="p-2 rounded-lg bg-white border border-purple-200 shadow-xs">
                <div className="text-[10px] text-purple-800 font-bold uppercase">Transformer Capacity</div>
                <div className="font-mono font-bold text-cyan-900 text-sm">{analysis?.catchmentDemographics.transformerHeadroomKva || activeSite.demographics.transformerHeadroomKva} kVA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
