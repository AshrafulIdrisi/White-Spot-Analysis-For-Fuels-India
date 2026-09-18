import React from "react";
import { WhiteSpotSite, FuelBrand, ForecourtFormat, ActiveTab } from "../types";
import { 
  TrendingUp, 
  MapPin, 
  Fuel, 
  Zap, 
  DollarSign, 
  Percent, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  Award,
  Radar
} from "lucide-react";
import { formatINR, formatIndianNumber, formatKL, BRAND_COLORS } from "../utils/formatters";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from "recharts";

interface ExecutiveOverviewProps {
  sites: WhiteSpotSite[];
  activeSite: WhiteSpotSite;
  setActiveSite: (site: WhiteSpotSite) => void;
  setActiveTab: (tab: ActiveTab) => void;
  selectedBrand: FuelBrand | "All_OMCs";
  totalCapexCr: number;
  projectIRR: number;
  equityIRR: number;
  paybackYears: number;
  npvCr: number;
  monthlyFuelKL: number;
  dailyEVKwh: number;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  sites,
  activeSite,
  setActiveSite,
  setActiveTab,
  selectedBrand,
  totalCapexCr,
  projectIRR,
  equityIRR,
  paybackYears,
  npvCr,
  monthlyFuelKL,
  dailyEVKwh,
}) => {
  // Market share in India
  const omcMarketShare = [
    { name: "IndianOil (IOCL)", share: 42.1, color: "#f97316", outlets: "36,200+" },
    { name: "Bharat Petroleum (BPCL)", share: 24.8, color: "#f59e0b", outlets: "21,400+" },
    { name: "Hindustan Petroleum (HPCL)", share: 22.3, color: "#ef4444", outlets: "20,100+" },
    { name: "Jio-bp (Reliance)", share: 5.2, color: "#10b981", outlets: "1,850+" },
    { name: "Nayara Energy", share: 4.6, color: "#14b8a6", outlets: "6,400+" },
    { name: "Shell India", share: 1.0, color: "#eab308", outlets: "380+" },
  ];

  const totalSitesIdentified = sites.length;
  const highDeficitSites = sites.filter((s) => s.deficitScore >= 88).length;
  const totalPipelineCapex = sites.reduce((acc, s) => acc + s.defaultCapexCr, 0);
  const avgDeficitScore = Math.round(sites.reduce((acc, s) => acc + s.deficitScore, 0) / sites.length);

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto font-sans">
      {/* Strategic Header & Context Banner (Purple & Crisp White) */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-950 via-indigo-950/80 to-[#0b0618] p-6 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-purple-950 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-purple-700" /> India National White-Spot Engine
              </span>
              <span className="rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-semibold text-purple-200 border border-purple-400/40">
                Target: {selectedBrand === "All_OMCs" ? "All National OMCs & CPOs" : selectedBrand}
              </span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Fuel Retail & EV Infrastructure Underwriting Portfolio
            </h2>
            <p className="mt-1 text-sm text-purple-200/90 max-w-3xl">
              Spatial demand analytics, Geoapify & OSM live competitor discovery, NHAI FASTag traffic corridor modeling, and 10-year discounted cash flow underwriting for India's high-growth energy corridors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="view-spatial-map-btn"
              onClick={() => setActiveTab("spatial_map")}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:brightness-110 transition-all border border-purple-300"
            >
              <Radar className="h-4 w-4" />
              Launch Spatial Map & On-Click Analysis
            </button>
            <button
              id="generate-ic-memo-btn"
              onClick={() => setActiveTab("ai_memo")}
              className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-white/10 hover:bg-white hover:text-purple-950 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md"
            >
              <Award className="h-4 w-4 text-purple-300" />
              Generate IC Memo
            </button>
          </div>
        </div>
      </div>

      {/* Top 6 Macro KPI Metric Cards (Purple & Crisp White) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-purple-300 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">White Spots</span>
            <MapPin className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalSitesIdentified}</div>
          <div className="text-[11px] text-purple-300 font-medium mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span> {highDeficitSites} Tier-1 Urgent
          </div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-purple-300 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Deficit Score</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">{avgDeficitScore}/100</div>
          <div className="text-[11px] text-purple-200 font-medium mt-1">High Corridor Deficit</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-purple-300 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Capex Pipeline</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 font-mono">{formatINR(totalPipelineCapex, "Crores")}</div>
          <div className="text-[11px] text-purple-200 font-medium mt-1">12 Candidate Sites</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-purple-300 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Site IRR</span>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono">{projectIRR}%</div>
          <div className="text-[11px] text-emerald-300 font-medium mt-1">Equity IRR: {equityIRR}%</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-purple-300 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Payback Period</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-300 font-mono">{paybackYears} Yrs</div>
          <div className="text-[11px] text-purple-200 font-medium mt-1">NPV: {formatINR(npvCr, "Crores")}</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between text-purple-300 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Site Yield</span>
            <Fuel className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{formatKL(monthlyFuelKL)}</div>
          <div className="text-[11px] text-cyan-300 font-medium mt-1">{formatIndianNumber(dailyEVKwh)} kWh EV/day</div>
        </div>
      </div>

      {/* Main Grid: Active Site Spotlight & Top Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Active Site Underwriting Spotlight */}
        <div className="lg:col-span-7 rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-purple-800/40 pb-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-base font-bold text-white">Active Site Underwriting Profile</h3>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">{activeSite.name}</p>
            </div>
            <span className="rounded-xl bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow-sm border border-purple-400">
              Deficit: {activeSite.deficitScore}/100
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl bg-slate-900/90 border border-purple-900/60 p-3">
              <div className="text-[10px] uppercase font-bold text-purple-300">Format</div>
              <div className="text-sm font-bold text-white mt-0.5">{activeSite.recommendedFormat.replace("_", " ")}</div>
              <div className="text-[10px] text-purple-400 mt-1">Multi-Fuel Oasis</div>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-purple-900/60 p-3">
              <div className="text-[10px] uppercase font-bold text-purple-300">Corridor AADT</div>
              <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">{formatIndianNumber(activeSite.aadtTraffic)}</div>
              <div className="text-[10px] text-purple-200 mt-1">PCU: {formatIndianNumber(activeSite.pcuEquivalent)}</div>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-purple-900/60 p-3">
              <div className="text-[10px] uppercase font-bold text-purple-300">Nearest Rival</div>
              <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">{activeSite.nearestCompetitorKm} km</div>
              <div className="text-[10px] text-purple-200 mt-1">{activeSite.nearestCompetitorBrand} Outlet</div>
            </div>
            <div className="rounded-xl bg-slate-900/90 border border-purple-900/60 p-3">
              <div className="text-[10px] uppercase font-bold text-purple-300">EV Readiness</div>
              <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">{activeSite.evAdoptionScore}/100</div>
              <div className="text-[10px] text-purple-200 mt-1">{activeSite.demographics.gridSubstationKv}kV Substation</div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-purple-800/40">
            <button
              onClick={() => setActiveTab("forecourt_config")}
              className="flex items-center justify-between rounded-xl bg-slate-900/80 hover:bg-purple-600 hover:text-white p-2.5 text-xs text-purple-200 font-medium border border-purple-500/20 transition-all"
            >
              <span className="flex items-center gap-1.5"><Fuel className="h-3.5 w-3.5 text-purple-400" /> Forecourt</span>
              <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
            </button>
            <button
              onClick={() => setActiveTab("traffic_pcu")}
              className="flex items-center justify-between rounded-xl bg-slate-900/80 hover:bg-purple-600 hover:text-white p-2.5 text-xs text-purple-200 font-medium border border-purple-500/20 transition-all"
            >
              <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-cyan-400" /> Diurnal PCU</span>
              <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
            </button>
            <button
              onClick={() => setActiveTab("cannibalization")}
              className="flex items-center justify-between rounded-xl bg-slate-900/80 hover:bg-purple-600 hover:text-white p-2.5 text-xs text-purple-200 font-medium border border-purple-500/20 transition-all"
            >
              <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-rose-400" /> Cannibalization</span>
              <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
            </button>
            <button
              onClick={() => setActiveTab("financial_underwriting")}
              className="flex items-center justify-between rounded-xl bg-slate-900/80 hover:bg-purple-600 hover:text-white p-2.5 text-xs text-purple-200 font-medium border border-purple-500/20 transition-all"
            >
              <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-emerald-400" /> 10-Yr Cash Flow</span>
              <ChevronRight className="h-3.5 w-3.5 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Right 5 Cols: India Fuel OMC & EV Ecosystem Market Share */}
        <div className="lg:col-span-5 rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 shadow-lg flex flex-col justify-between">
          <div className="border-b border-purple-800/40 pb-3 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>OMC & EV CPO Market Share (India)</span>
              <span className="text-[11px] font-normal text-purple-300">PPAC & BEE Data</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={omcMarketShare}
                    dataKey="share"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {omcMarketShare.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value}% Share`, "Market Share"]}
                    contentStyle={{ backgroundColor: "#0b0618", borderColor: "#6b21a8", borderRadius: "12px", fontSize: "11px", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center text-[10px] text-purple-300 font-medium">Fuel Retail Volume Share</div>
            </div>

            <div className="space-y-1.5 text-xs">
              {omcMarketShare.slice(0, 5).map((item) => (
                <div key={item.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-purple-200 truncate">{item.name.split(" ")[0]}</span>
                  </div>
                  <span className="font-bold font-mono text-white">{item.share}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-purple-800/40 text-[11px] text-purple-300 flex items-center justify-between">
            <span>Fast Charging CPO Leader: <strong className="text-cyan-300">Tata Power (38.5%)</strong></span>
            <span className="text-emerald-300 font-medium">Jio-bp pulse (+18%)</span>
          </div>
        </div>
      </div>

      {/* Top White Spot Candidate Opportunities Table */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-purple-800/40 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-400" />
              Ranked White-Spot Highway & Urban Clusters (India Pipeline)
            </h3>
            <p className="text-xs text-purple-200/80">
              Sorted by Deficit Score (Demand minus existing retail pump density). Click any row to underwrite.
            </p>
          </div>
          <span className="text-xs text-purple-300 font-mono">12 Active Opportunities</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-purple-800/60 text-purple-300 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Site Name & Corridor</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Deficit Score</th>
                <th className="py-2.5 px-3">AADT Flow</th>
                <th className="py-2.5 px-3">Rival Gap</th>
                <th className="py-2.5 px-3">Format</th>
                <th className="py-2.5 px-3">Capex Outlay</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/40">
              {sites.map((site) => {
                const isSelected = site.id === activeSite.id;
                return (
                  <tr
                    key={site.id}
                    onClick={() => setActiveSite(site)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? "bg-purple-600/20 font-semibold" : "hover:bg-purple-900/20"
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {isSelected && <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping"></span>}
                        <div>
                          <div className="font-bold text-white">{site.name}</div>
                          <div className="text-[10px] text-purple-300">{site.corridor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-purple-200">{site.state}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-16 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              site.deficitScore >= 90
                                ? "bg-purple-400"
                                : site.deficitScore >= 80
                                ? "bg-indigo-400"
                                : "bg-cyan-400"
                            }`}
                            style={{ width: `${site.deficitScore}%` }}
                          ></div>
                        </div>
                        <span className="font-mono font-bold text-white">{site.deficitScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-purple-200">{formatIndianNumber(site.aadtTraffic)}</td>
                    <td className="py-3 px-3 font-mono text-purple-200">
                      {site.nearestCompetitorKm} km ({site.nearestCompetitorBrand})
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-purple-200 border border-purple-800">
                        {site.recommendedFormat.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {formatINR(site.defaultCapexCr, "Crores")}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSite(site);
                          setActiveTab("financial_underwriting");
                        }}
                        className="rounded-lg bg-purple-600 hover:bg-purple-500 px-2.5 py-1 text-[11px] font-bold text-white transition-all shadow-sm"
                      >
                        Underwrite
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
