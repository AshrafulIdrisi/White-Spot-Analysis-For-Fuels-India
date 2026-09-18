import React from "react";
import { ActiveTab, WhiteSpotSite, FuelBrand } from "../types";
import { 
  Flame, 
  MapPin, 
  LayoutDashboard, 
  Fuel, 
  Users, 
  Activity, 
  TrendingDown, 
  Calculator, 
  ShieldCheck, 
  Sparkles,
  Zap,
  ChevronDown,
  Radar
} from "lucide-react";
import { formatINR } from "../utils/formatters";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedBrand: FuelBrand | "All_OMCs";
  setSelectedBrand: (brand: FuelBrand | "All_OMCs") => void;
  sites: WhiteSpotSite[];
  activeSite: WhiteSpotSite;
  setActiveSite: (site: WhiteSpotSite) => void;
  totalCapexCr: number;
  projectIRR: number;
  paybackYears: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedBrand,
  setSelectedBrand,
  sites,
  activeSite,
  setActiveSite,
  totalCapexCr,
  projectIRR,
  paybackYears,
}) => {
  const tabs = [
    { id: "spatial_map", label: "1. Spatial Map & Competitors", icon: MapPin, primary: true },
    { id: "market_share", label: "2. Market Share Analytics", icon: TrendingDown, primary: true },
    { id: "footfall_fleet", label: "3. Footfall & Fleet Intelligence", icon: Activity, primary: true },
    { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
    { id: "forecourt_config", label: "Forecourt Matrix", icon: Fuel },
    { id: "financial_underwriting", label: "Financial Underwriting", icon: Calculator },
    { id: "statutory_matrix", label: "PESO & NHAI Compliance", icon: ShieldCheck },
    { id: "ai_memo", label: "AI Copilot Memo", icon: Sparkles, highlight: true },
  ];

  const brands: { id: FuelBrand | "All_OMCs"; label: string; tag: string }[] = [
    { id: "All_OMCs", label: "All OMCs & CPOs", tag: "Consortium" },
    { id: "IOCL", label: "IndianOil (IOCL)", tag: "PSU OMC" },
    { id: "BPCL", label: "Bharat Petroleum", tag: "PSU OMC" },
    { id: "HPCL", label: "Hindustan Petroleum", tag: "PSU OMC" },
    { id: "Jio-bp", label: "Jio-bp (Reliance)", tag: "Private JV" },
    { id: "Nayara", label: "Nayara Energy", tag: "Private" },
    { id: "Shell", label: "Shell India", tag: "MNC" },
    { id: "Tata Power", label: "Tata Power EZ", tag: "EV CPO" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-purple-200 bg-white font-sans text-purple-950 shadow-md">
      {/* Top Corporate Ticker & Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 px-4 py-2.5 lg:px-6 bg-white">
        {/* Brand Logo & Platform Title (Purple & Crisp White) */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-700 shadow-md shadow-purple-600/30 border-2 border-purple-200 text-white">
            <Flame className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-purple-950 flex items-center gap-1.5">
                UrjaGrid <span className="text-xs font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-300">Bharat Fuel & EV</span>
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-900 px-2.5 py-0.5 text-[10px] font-extrabold border border-purple-200">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse"></span> OpenStreetMap &bull; Geoapify &bull; Overpass
              </span>
            </div>
            <p className="text-[11px] text-purple-700 font-medium">
              Location Intelligence, Competitor Analysis & White-Spot Underwriting
            </p>
          </div>
        </div>

        {/* Global Selectors: Active Site & Brand Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Active Site Selector */}
          <div className="relative">
            <label className="text-[10px] uppercase font-bold tracking-wider text-purple-800 block mb-0.5">
              Active Candidate Site
            </label>
            <div className="relative">
              <select
                id="active-site-select"
                value={activeSite.id}
                onChange={(e) => {
                  const s = sites.find((x) => x.id === e.target.value);
                  if (s) setActiveSite(s);
                }}
                className="w-64 appearance-none rounded-xl border-2 border-purple-200 bg-purple-50/70 hover:bg-white px-3 py-1.5 pr-8 text-xs font-bold text-purple-950 shadow-sm focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-300/40 truncate transition-colors"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white text-purple-950 py-1 font-semibold">
                    {s.name} ({s.state} - Deficit: {s.deficitScore}/100)
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-700 font-bold" />
            </div>
          </div>

          {/* Brand Focus Filter */}
          <div className="relative">
            <label className="text-[10px] uppercase font-bold tracking-wider text-purple-800 block mb-0.5">
              Target OMC / Operator
            </label>
            <div className="relative">
              <select
                id="brand-filter-select"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value as any)}
                className="w-48 appearance-none rounded-xl border-2 border-purple-200 bg-purple-50/70 hover:bg-white px-3 py-1.5 pr-8 text-xs font-bold text-purple-950 shadow-sm focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-300/40 transition-colors"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id} className="bg-white text-purple-950 py-1 font-semibold">
                    {b.label} ({b.tag})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-700 font-bold" />
            </div>
          </div>

          {/* Underwriting Snapshot Badges (Purple & Crisp White) */}
          <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-purple-200">
            <div className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-1 text-right shadow-xs">
              <div className="text-[9px] text-purple-700 font-bold uppercase">CAPEX Outlay</div>
              <div className="text-xs font-black text-purple-950 font-mono">{formatINR(totalCapexCr, "Crores")}</div>
            </div>
            <div className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-1 text-right shadow-xs">
              <div className="text-[9px] text-purple-700 font-bold uppercase">Projected IRR</div>
              <div className="text-xs font-black text-emerald-700 font-mono">{projectIRR}%</div>
            </div>
            <div className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-1 text-right shadow-xs">
              <div className="text-[9px] text-purple-700 font-bold uppercase">Payback</div>
              <div className="text-xs font-black text-purple-900 font-mono">{paybackYears} Yrs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center overflow-x-auto no-scrollbar px-4 lg:px-6 bg-purple-50/60 border-b border-purple-200">
        <div className="flex space-x-1.5 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-purple-700 text-white font-black shadow-md border-2 border-purple-800 scale-102"
                    : tab.primary
                    ? "bg-white text-purple-950 hover:bg-purple-100 hover:text-purple-900 border border-purple-300 shadow-xs"
                    : tab.highlight
                    ? "bg-purple-100 text-purple-900 hover:bg-purple-200 border border-purple-300"
                    : "text-purple-800 hover:bg-white hover:text-purple-950 border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-purple-700"}`} />
                {tab.label}
                {tab.highlight && !isActive && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-purple-600 animate-ping"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
