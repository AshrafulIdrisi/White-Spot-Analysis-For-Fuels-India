import React from "react";
import { ForecourtConfig, ForecourtFormat, WhiteSpotSite } from "../types";
import { 
  Fuel, 
  Zap, 
  Building2, 
  Maximize2, 
  Utensils, 
  Coffee, 
  Bed, 
  Wifi, 
  Wind, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Layers, 
  Info,
  ShieldAlert,
  Flame
} from "lucide-react";
import { formatINR } from "../utils/formatters";

interface ForecourtConfiguratorProps {
  config: ForecourtConfig;
  setConfig: React.Dispatch<React.SetStateAction<ForecourtConfig>>;
  activeSite: WhiteSpotSite;
}

export const ForecourtConfigurator: React.FC<ForecourtConfiguratorProps> = ({
  config,
  setConfig,
  activeSite,
}) => {
  const formats: { id: ForecourtFormat; title: string; subtitle: string; desc: string; capexTier: string }[] = [
    {
      id: "Highway_Oasis",
      title: "Highway NE-Way Service Oasis",
      subtitle: "Expressway & National Highway Flagship",
      desc: "Comprehensive mega-forecourt featuring Multi-Product Fuel Islands, Dedicated Heavy Truck Lanes, EV Supercharging Plaza, Branded Food Court (Haldiram's/McDonald's), and 24x7 Driver Dormitory.",
      capexTier: "₹6.0 - ₹7.5 Cr",
    },
    {
      id: "COCO",
      title: "COCO (Company Owned Company Operated)",
      subtitle: "High-Volume Direct OMC Asset",
      desc: "Fully owned and operated by OMC with premium customer experience, automated MPD dispensers, automated fuel monitoring (ATG), and company-managed EV Fast Chargers.",
      capexTier: "₹5.0 - ₹6.2 Cr",
    },
    {
      id: "CODO",
      title: "CODO (Company Owned Dealer Operated)",
      subtitle: "OMC Land / Dealer Operating Matrix",
      desc: "Capital infrastructure funded by OMC; day-to-day operations and working capital managed by selected franchisee dealer under structured commission norms.",
      capexTier: "₹4.5 - ₹5.5 Cr",
    },
    {
      id: "DODO",
      title: "DODO (Dealer Owned Dealer Operated)",
      subtitle: "Dealer Capital & Land Model",
      desc: "Franchisee provides agricultural/NA plot and civil works; OMC supplies brand identity, underground tanks, dispensers, and bulk product delivery.",
      capexTier: "₹3.8 - ₹4.8 Cr",
    },
    {
      id: "Urban_Micro",
      title: "Urban Infill / Micro-Forecourt",
      subtitle: "Metro Rings & High-Density Commercial",
      desc: "Compact high-throughput design tailored for 2-wheeler/4-wheeler quick turns, automated UPI payment pumps, and rapid EV top-up hubs in metro areas.",
      capexTier: "₹4.0 - ₹5.0 Cr",
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Forecourt Configuration & Multi-Fuel Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Design pump dispenser islands, CNG cascades, EV DC charging bays, and non-fuel retail for <strong>{activeSite.name}</strong>.
          </p>
        </div>
        <span className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700 self-start sm:self-auto">
          Plot: {config.plotWidthM}m × {config.plotDepthM}m ({config.plotWidthM * config.plotDepthM} sq.m)
        </span>
      </div>

      {/* Format Selector Cards */}
      <div>
        <label className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-3">
          1. Operating Format & Retailing Hierarchy
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {formats.map((fmt) => {
            const isSelected = config.format === fmt.id;
            return (
              <div
                key={fmt.id}
                onClick={() => setConfig((prev) => ({ ...prev, format: fmt.id }))}
                className={`relative cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500"
                    : "border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                      {fmt.id.replace("_", " ")}
                    </span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">{fmt.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">{fmt.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Typical CAPEX:</span>
                  <span className="font-mono font-bold text-slate-200">{fmt.capexTier}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2D Architectural Forecourt Blueprint Layout (SVG Visualizer) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Interactive Forecourt Layout Blueprint (IRC:12 & PESO Safety Compliant)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Scale: 1:200 CAD Representation</span>
        </div>

        {/* Blueprint Visualizer */}
        <div className="relative w-full overflow-x-auto rounded-xl bg-slate-950 p-4 border border-slate-800/80">
          <svg
            viewBox="0 0 900 480"
            className="w-full h-auto min-w-[750px] select-none font-sans"
            style={{ backgroundColor: "#090d16" }}
          >
            {/* Highway Road at the bottom with NHAI markings */}
            <rect x="0" y="420" width="900" height="60" fill="#1e293b" />
            <line x1="0" y1="450" x2="900" y2="450" stroke="#f59e0b" strokeWidth="2" strokeDasharray="16, 12" />
            <text x="450" y="445" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="bold">
              NATIONAL HIGHWAY / EXPRESSWAY MAIN CARRIAGEWAY (IRC:12 DECELERATION & ACCELERATION ACCESS)
            </text>

            {/* Entry Deceleration Lane */}
            <polygon points="50,420 180,380 200,380 70,420" fill="#334155" opacity="0.8" />
            <text x="110" y="405" fill="#38bdf8" fontSize="10" fontWeight="bold">ENTRY TAPER</text>

            {/* Exit Acceleration Lane */}
            <polygon points="700,380 830,420 850,420 720,380" fill="#334155" opacity="0.8" />
            <text x="770" y="405" fill="#38bdf8" fontSize="10" fontWeight="bold">EXIT TAPER</text>

            {/* Plot Boundary */}
            <rect x="150" y="30" width="600" height="350" fill="#0f172a" stroke="#475569" strokeWidth="2" strokeDasharray="6,4" rx="12" />
            <text x="165" y="50" fill="#64748b" fontSize="10" fontWeight="bold">
              PESO LICENSED FORECOURT BOUNDARY ({config.plotWidthM}m × {config.plotDepthM}m)
            </text>

            {/* Main Overhead Canopy */}
            <rect x="230" y="180" width="310" height="150" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" rx="8" />
            <text x="385" y="200" fill="#f59e0b" fontSize="11" textAnchor="middle" fontWeight="bold">
              OMC FUEL DISPENSER CANOPY (HIGH CLEARANCE 5.5M)
            </text>

            {/* MS (Petrol) Fuel Islands */}
            {Array.from({ length: config.msDUs }).map((_, i) => {
              const xOffset = 260 + i * 65;
              if (xOffset > 480) return null;
              return (
                <g key={`ms-${i}`}>
                  <rect x={xOffset} y="225" width="45" height="35" fill="#f97316" rx="4" />
                  <text x={xOffset + 22.5} y="246" fill="#0f172a" fontSize="9" textAnchor="middle" fontWeight="bold">
                    MS #{i + 1}
                  </text>
                  <circle cx={xOffset + 22.5} cy="275" r="5" fill="#38bdf8" />
                </g>
              );
            })}

            {/* HSD (Diesel) Heavy Commercial Vehicle Islands */}
            {Array.from({ length: config.hsdDUs }).map((_, i) => {
              const xOffset = 260 + i * 65;
              if (xOffset > 480) return null;
              return (
                <g key={`hsd-${i}`}>
                  <rect x={xOffset} y="280" width="45" height="35" fill="#3b82f6" rx="4" />
                  <text x={xOffset + 22.5} y="301" fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">
                    HSD #{i + 1}
                  </text>
                </g>
              );
            })}

            {/* EV Fast Charging Oasis (Dual-Gun CCS2 Plazas) */}
            <rect x="560" y="180" width="160" height="150" fill="#082f49" stroke="#06b6d4" strokeWidth="2" rx="8" />
            <text x="640" y="200" fill="#06b6d4" fontSize="10" textAnchor="middle" fontWeight="bold">
              ⚡ EV FAST CHARGING PLAZA
            </text>
            {Array.from({ length: config.evChargersCount }).map((_, i) => {
              const yOffset = 220 + i * 50;
              if (yOffset > 300) return null;
              return (
                <g key={`ev-${i}`}>
                  <rect x="575" y={yOffset} width="130" height="38" fill="#0284c7" rx="6" />
                  <text x="640" y={yOffset + 23} fill="#ffffff" fontSize="9" textAnchor="middle" fontWeight="bold">
                    {config.evChargerKw}kW Dual CCS2 (#{i + 1})
                  </text>
                </g>
              );
            })}

            {/* CNG Booster Compressor Cascade Skid */}
            {config.cngCascades > 0 && (
              <g>
                <rect x="560" y="55" width="160" height="95" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" rx="6" />
                <text x="640" y="75" fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">
                  🔥 CNG / SATAT CBG SKID
                </text>
                <text x="640" y="95" fill="#a7f3d0" fontSize="8" textAnchor="middle">
                  {config.cngCascades} Cascade Booster Compressor
                </text>
                <rect x="580" y="105" width="120" height="28" fill="#059669" rx="4" />
                <text x="640" y="123" fill="#ffffff" fontSize="8" textAnchor="middle" fontWeight="bold">
                  High Flow NGV1/NGV2 Nozzles
                </text>
              </g>
            )}

            {/* Central Commercial Retail Building (Highway Nest QSR, Haldiram's, EV Lounge, Restrooms) */}
            <rect x="230" y="55" width="310" height="95" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" rx="6" />
            <text x="385" y="75" fill="#f8fafc" fontSize="10" textAnchor="middle" fontWeight="bold">
              HIGHWAY NEST RETAIL & FOOD COURT COMPLEX
            </text>
            <rect x="245" y="88" width="85" height="48" fill="#475569" rx="4" />
            <text x="287" y="115" fill="#e2e8f0" fontSize="8" textAnchor="middle">QSR / Haldiram's</text>

            <rect x="340" y="88" width="95" height="48" fill="#475569" rx="4" />
            <text x="387" y="115" fill="#e2e8f0" fontSize="8" textAnchor="middle">Chai Point & Lounge</text>

            <rect x="445" y="88" width="85" height="48" fill="#475569" rx="4" />
            <text x="487" y="115" fill="#e2e8f0" fontSize="8" textAnchor="middle">Clean Restrooms</text>

            {/* Underground Tank Farm (PESO Approved) */}
            <g>
              <rect x="165" y="180" width="50" height="150" fill="#450a0a" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" rx="4" />
              <text x="190" y="200" fill="#fca5a5" fontSize="8" textAnchor="middle" fontWeight="bold" transform="rotate(-90 190 200)">
                PESO UNDERGROUND TANKS (MS 45KL / HSD 70KL)
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Configuration Sliders & Amenity Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Dispenser & Energy Mix Controls */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Fuel className="h-4 w-4 text-amber-400" />
            2. Multi-Fuel Dispensers & EV Infrastructure
          </h3>

          <div className="space-y-4 text-xs">
            {/* MS Dispensers */}
            <div>
              <div className="flex justify-between font-medium text-slate-200 mb-1">
                <span>Motor Spirit / Petrol (MS) MPDs</span>
                <span className="font-mono font-bold text-orange-400">{config.msDUs} Units ({config.msDUs * 2} Nozzles)</span>
              </div>
              <input
                type="range"
                min={2}
                max={8}
                step={1}
                value={config.msDUs}
                onChange={(e) => setConfig((prev) => ({ ...prev, msDUs: Number(e.target.value) }))}
                className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* HSD Dispensers */}
            <div>
              <div className="flex justify-between font-medium text-slate-200 mb-1">
                <span>High-Speed Diesel (HSD) Heavy Commercial MPDs</span>
                <span className="font-mono font-bold text-blue-400">{config.hsdDUs} Units ({config.hsdDUs * 2} Nozzles)</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={config.hsdDUs}
                onChange={(e) => setConfig((prev) => ({ ...prev, hsdDUs: Number(e.target.value) }))}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* CNG Booster Cascades */}
            <div>
              <div className="flex justify-between font-medium text-slate-200 mb-1">
                <span>CNG / CBG Booster Compressor Cascades</span>
                <span className="font-mono font-bold text-emerald-400">{config.cngCascades} Cascades</span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={config.cngCascades}
                onChange={(e) => setConfig((prev) => ({ ...prev, cngCascades: Number(e.target.value) }))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* EV Chargers Count & Power */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">EV Fast Chargers</label>
                <select
                  value={config.evChargersCount}
                  onChange={(e) => setConfig((prev) => ({ ...prev, evChargersCount: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500"
                >
                  <option value={1}>1 Plaza (2 Guns)</option>
                  <option value={2}>2 Plazas (4 Guns)</option>
                  <option value={4}>4 Plazas (8 Guns)</option>
                  <option value={6}>6 Plazas (12 Guns)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Charger Rating</label>
                <select
                  value={config.evChargerKw}
                  onChange={(e) => setConfig((prev) => ({ ...prev, evChargerKw: Number(e.target.value) as any }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-cyan-400 font-bold focus:border-amber-500"
                >
                  <option value={60}>60 kW CCS2</option>
                  <option value={120}>120 kW Dual CCS2</option>
                  <option value={180}>180 kW Superfast</option>
                  <option value={240}>240 kW Ultra Heavy</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Non-Fuel Amenities & QSR Franchises */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Utensils className="h-4 w-4 text-amber-400" />
            3. Non-Fuel Retailing, QSR & Highway Amenities
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={config.amenities.highwayNestQSR}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    amenities: { ...prev.amenities, highwayNestQSR: e.target.checked },
                  }))
                }
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <span className="text-slate-200">Highway Nest (Mini)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={config.amenities.haldiramsExpress}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    amenities: { ...prev.amenities, haldiramsExpress: e.target.checked },
                  }))
                }
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <span className="text-slate-200">Haldiram's Express</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={config.amenities.chaiPointCafe}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    amenities: { ...prev.amenities, chaiPointCafe: e.target.checked },
                  }))
                }
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <span className="text-slate-200">Chai Point Cafe</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={config.amenities.mcdonaldsDriveThru}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    amenities: { ...prev.amenities, mcdonaldsDriveThru: e.target.checked },
                  }))
                }
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <span className="text-slate-200">McDonald's Drive-Thru</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={config.amenities.driverDormitory}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    amenities: { ...prev.amenities, driverDormitory: e.target.checked },
                  }))
                }
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <span className="text-slate-200">Trucker Dormitory (20 Bed)</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={config.amenities.evLoungeWifi}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    amenities: { ...prev.amenities, evLoungeWifi: e.target.checked },
                  }))
                }
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <span className="text-slate-200">EV Passenger Lounge & WiFi</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={config.amenities.cleanWashroomComplex}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    amenities: { ...prev.amenities, cleanWashroomComplex: e.target.checked },
                  }))
                }
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <span className="text-slate-200">Sanitized Restroom Block</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={config.amenities.nitrogenTyreInflator}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    amenities: { ...prev.amenities, nitrogenTyreInflator: e.target.checked },
                  }))
                }
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              <span className="text-slate-200">Nitrogen Tyre Station</span>
            </label>
          </div>

          <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Non-fuel retailing and QSR revenue share enhances project IRR by approximately <strong>+3.2% to +4.5%</strong>.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
