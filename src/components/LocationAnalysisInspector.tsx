import React, { useState } from "react";
import { LocationAnalysisResult, CompetitorOutlet } from "../services/geoIntelligence";
import { formatIndianNumber, formatKL } from "../utils/formatters";
import { 
  MapPin, 
  Fuel, 
  Zap, 
  Users, 
  Activity, 
  TrendingUp, 
  Building2, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  Compass, 
  ChevronRight, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  X, 
  Sliders,
  Check,
  Trash2,
  RotateCcw
} from "lucide-react";
import { WhiteSpotSite, ActiveTab } from "../types";

interface LocationAnalysisInspectorProps {
  analysis: LocationAnalysisResult;
  loading: boolean;
  onClose: () => void;
  onClearAnalysis?: () => void;
  onSetAsActiveCandidate: (candidateSite: WhiteSpotSite) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const LocationAnalysisInspector: React.FC<LocationAnalysisInspectorProps> = ({
  analysis,
  loading,
  onClose,
  onClearAnalysis,
  onSetAsActiveCandidate,
  setActiveTab,
}) => {
  const [activeInspectorTab, setActiveInspectorTab] = useState<"competitors" | "footfall" | "fleet" | "raw_geo">("competitors");
  const [selectedRadiusFilter, setSelectedRadiusFilter] = useState<number>(10);
  const [customCaptureRate, setCustomCaptureRate] = useState<number>(3.2);
  const [isCopied, setIsCopied] = useState(false);

  const loc = analysis.location;
  const traffic = analysis.trafficIntelligence;
  const fleet = analysis.fleetBreakdown;
  const demog = analysis.catchmentDemographics;

  // Recalculate footfall dynamically based on user's slider
  const dynamicDailyFootfall = Math.round((traffic.estimatedAADT * customCaptureRate) / 100);
  const dynamicMonthlyKL = Math.round((dynamicDailyFootfall * (fleet.commercialHCVTrucksPct > 25 ? 12.8 : 9.5) * 30) / 1000);
  const dynamicDailyEV = Math.round(dynamicDailyFootfall * 0.09 * 32.0 + 1200);

  // Filter competitors based on distance
  const filteredCompetitors = analysis.competitors.filter((c) => c.distanceKm <= selectedRadiusFilter);

  // Helper to convert analysis into candidate WhiteSpotSite
  const handlePromoteToCandidate = () => {
    const newSiteId = `WS-GEO-${Date.now().toString().slice(-4)}`;
    const candidateSite: WhiteSpotSite = {
      id: newSiteId,
      name: `${loc.roadName} Hub`,
      corridor: `${loc.roadName} (${loc.roadCategory.replace("_", " ")})`,
      corridorType: loc.roadCategory === "Expressway" ? "Expressway_NE" : loc.roadCategory === "State_Highway" ? "State_Highway" : "National_Highway",
      state: loc.state || "India",
      district: loc.district || loc.city || "Strategic Zone",
      lat: Number(loc.lat.toFixed(4)),
      lng: Number(loc.lng.toFixed(4)),
      deficitScore: analysis.whiteSpotScore,
      priorityTier: analysis.whiteSpotScore >= 80 ? "Tier 1 (Immediate)" : "Tier 2 (High Priority)",
      aadtTraffic: traffic.estimatedAADT,
      pcuEquivalent: traffic.pcuEquivalent,
      evAdoptionScore: fleet.electricVehicleReadinessScore,
      nearestCompetitorKm: analysis.nearestCompetitorKm,
      nearestCompetitorBrand: (["IOCL", "BPCL", "HPCL", "Jio-bp", "Nayara", "Shell", "Tata Power", "Statiq", "ChargeZone", "Zeon"].includes(analysis.nearestCompetitorBrand) ? analysis.nearestCompetitorBrand : "IOCL") as any,
      nearestSisterOutletKm: Number((analysis.nearestCompetitorKm * 1.35).toFixed(1)),
      recommendedFormat: loc.roadCategory === "Expressway" ? "Highway_Oasis" : "COCO",
      defaultCapexCr: loc.roadCategory === "Expressway" ? 6.8 : 4.9,
      projectedMonthlyKL: dynamicMonthlyKL,
      cngPotentialKgDay: traffic.projectedDailyCNGKg,
      evPotentialKwhDay: dynamicDailyEV,
      demographics: {
        catchmentPop3km: demog.estPopulation3km,
        catchmentPop5km: demog.estPopulation5km,
        catchmentPop10km: demog.estPopulation10km,
        secMix: demog.secMix,
        fleetMix: {
          twoWheeler: fleet.twoWheelerPct,
          fourWheeler: fleet.fourWheelerPetrolPct + fleet.fourWheelerDieselPct,
          commercialHCV: fleet.commercialHCVTrucksPct,
        },
        nearbyHubs: demog.nearbyHubs,
        gridSubstationKv: demog.gridSubstationKv,
        transformerHeadroomKva: demog.transformerHeadroomKva,
      },
      statutory: {
        pesoStatus: "In Review",
        nhaiIrc12Compliant: true,
        dmNocStatus: "In Process",
        spcbCteStatus: "Pending Inspection",
        frontageMeters: loc.roadCategory === "Expressway" ? 65 : 50,
        depthMeters: 55,
        medianCutDistanceMeters: 900,
        highTensionLineClearance: true,
      },
    };

    onSetAsActiveCandidate(candidateSite);
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l-2 border-purple-200 text-purple-950 shadow-2xl overflow-hidden font-sans">
      {/* Top Banner Header: Purple Theme */}
      <div className="relative bg-purple-700 p-4 border-b border-purple-800 shadow-md text-white">
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-purple-950 shadow-sm">
                <MapPin className="h-3 w-3 text-purple-700" />
                Live Location Intelligence
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-800/80 text-purple-100 border border-purple-500">
                {loc.roadCategory.replace("_", " ")}
              </span>
              {loading && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-200 font-bold animate-pulse">
                  <Activity className="h-3 w-3 animate-spin" /> Querying OpenStreetMap & Geoapify...
                </span>
              )}
            </div>

            <h3 className="text-base font-extrabold text-white mt-1.5 leading-snug line-clamp-2">
              {loc.roadName || "Highway Corridor Sector"}
            </h3>
            <p className="text-xs text-purple-100 mt-0.5 line-clamp-1 font-medium">
              {loc.formattedAddress}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {onClearAnalysis && (
              <button
                onClick={onClearAnalysis}
                className="rounded-lg px-2 py-1 text-[11px] font-bold text-purple-100 hover:text-white bg-purple-800/80 hover:bg-red-600/90 border border-purple-500 hover:border-red-400 transition-colors flex items-center gap-1 shadow-sm"
                title="Clear Point Analysis"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white hover:bg-purple-800 transition-colors"
              title="Close Panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Coordinate Pill & API Verification */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-purple-600 text-[11px] text-purple-100">
          <div className="flex items-center gap-2 font-mono font-medium">
            <span>{loc.lat.toFixed(4)}°N, {loc.lng.toFixed(4)}°E</span>
            <button
              onClick={handleCopyCoords}
              className="text-white hover:text-purple-200 underline text-[10px] font-bold"
            >
              {isCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping"></span>
              Geoapify + OSM Overpass
            </span>
          </div>
        </div>
      </div>

      {/* High-Level Scorecard (Purple & Crisp White Cards) */}
      <div className="grid grid-cols-4 gap-2 p-3 bg-purple-50/70 border-b border-purple-200">
        <div className="rounded-xl bg-white border-2 border-purple-200 p-2 text-center shadow-xs">
          <div className="text-[10px] uppercase font-bold text-purple-800">White-Spot Score</div>
          <div className="text-base font-black text-purple-950 mt-0.5 font-mono">
            {analysis.whiteSpotScore}<span className="text-[10px] text-purple-600">/100</span>
          </div>
        </div>

        <div className="rounded-xl bg-white border-2 border-purple-200 p-2 text-center shadow-xs">
          <div className="text-[10px] uppercase font-bold text-purple-800">Nearest Rival</div>
          <div className="text-base font-black text-amber-600 mt-0.5 font-mono">
            {analysis.nearestCompetitorKm} <span className="text-[10px] text-purple-900">km</span>
          </div>
        </div>

        <div className="rounded-xl bg-white border-2 border-purple-200 p-2 text-center shadow-xs">
          <div className="text-[10px] uppercase font-bold text-purple-800">Est. AADT</div>
          <div className="text-base font-black text-purple-900 mt-0.5 font-mono">
            {formatIndianNumber(traffic.estimatedAADT)}
          </div>
        </div>

        <div className="rounded-xl bg-white border-2 border-purple-200 p-2 text-center shadow-xs">
          <div className="text-[10px] uppercase font-bold text-purple-800">Est. Fuel KL</div>
          <div className="text-base font-black text-emerald-700 mt-0.5 font-mono">
            {dynamicMonthlyKL} <span className="text-[10px] text-purple-900">KL</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Purple & White Highlight) */}
      <div className="flex border-b border-purple-200 bg-purple-50/50 text-xs px-2 pt-1 gap-1">
        <button
          onClick={() => setActiveInspectorTab("competitors")}
          className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
            activeInspectorTab === "competitors"
              ? "bg-white text-purple-950 shadow-xs font-black border-t-2 border-x-2 border-purple-300"
              : "text-purple-800 hover:text-purple-950 hover:bg-purple-100"
          }`}
        >
          <Fuel className="h-3.5 w-3.5 text-purple-700" />
          Competitors ({analysis.competitors.length})
        </button>

        <button
          onClick={() => setActiveInspectorTab("footfall")}
          className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
            activeInspectorTab === "footfall"
              ? "bg-white text-purple-950 shadow-xs font-black border-t-2 border-x-2 border-purple-300"
              : "text-purple-800 hover:text-purple-950 hover:bg-purple-100"
          }`}
        >
          <Activity className="h-3.5 w-3.5 text-purple-700" />
          Footfall & Traffic
        </button>

        <button
          onClick={() => setActiveInspectorTab("fleet")}
          className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
            activeInspectorTab === "fleet"
              ? "bg-white text-purple-950 shadow-xs font-black border-t-2 border-x-2 border-purple-300"
              : "text-purple-800 hover:text-purple-950 hover:bg-purple-100"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-purple-700" />
          Fleet & Catchment
        </button>

        <button
          onClick={() => setActiveInspectorTab("raw_geo")}
          className={`px-3 py-2 font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${
            activeInspectorTab === "raw_geo"
              ? "bg-white text-purple-950 shadow-xs font-black border-t-2 border-x-2 border-purple-300"
              : "text-purple-800 hover:text-purple-950 hover:bg-purple-100"
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-purple-700" />
          OSM / Geoapify
        </button>
      </div>

      {/* Main Tab Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {/* TAB 1: COMPETITORS & DENSITY */}
        {activeInspectorTab === "competitors" && (
          <div className="space-y-4">
            {/* Spacing & Catchment Buffer Summary */}
            <div className="rounded-2xl bg-white border-2 border-purple-200 p-3 shadow-sm text-purple-950">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-extrabold text-purple-950 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-700" />
                  Corridor Spacing & Density Index
                </span>
                <span className="text-[11px] font-bold text-purple-800">
                  Recommendation: <strong className="text-purple-950 underline">{analysis.priorityRecommendation}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] font-bold text-purple-800">Within 3 km</div>
                  <div className={`font-mono font-black text-sm ${analysis.competitorDensity3km === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                    {analysis.competitorDensity3km} Outlets
                  </div>
                  <div className="text-[9px] font-medium text-purple-600">{analysis.competitorDensity3km === 0 ? "Zero Rival Zone" : "Local Competition"}</div>
                </div>

                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] font-bold text-purple-800">Within 5 km</div>
                  <div className="font-mono font-black text-sm text-purple-900">
                    {analysis.competitorDensity5km} Outlets
                  </div>
                  <div className="text-[9px] font-medium text-purple-600">Medium Buffer</div>
                </div>

                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] font-bold text-purple-800">Within 10 km</div>
                  <div className="font-mono font-black text-sm text-purple-950">
                    {analysis.competitorDensity10km} Outlets
                  </div>
                  <div className="text-[9px] font-medium text-purple-600">Corridor Total</div>
                </div>
              </div>

              {/* Radius Filter Pills */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-purple-200 text-xs">
                <span className="text-[11px] text-purple-900 font-bold">Filter List by Radius:</span>
                <div className="flex gap-1.5">
                  {[3, 5, 10, 15].map((rad) => (
                    <button
                      key={rad}
                      onClick={() => setSelectedRadiusFilter(rad)}
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold transition-all ${
                        selectedRadiusFilter === rad
                          ? "bg-purple-700 text-white shadow-xs"
                          : "bg-purple-100 text-purple-950 hover:bg-purple-200"
                      }`}
                    >
                      {rad} km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Competitors List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-purple-950">
                <span className="font-extrabold">
                  Identified Stations & EV Plazas ({filteredCompetitors.length})
                </span>
                <span className="text-[10px] font-bold text-purple-700">Geoapify + OSM Overpass</span>
              </div>

              {filteredCompetitors.length === 0 ? (
                <div className="rounded-2xl bg-white border-2 border-purple-200 p-6 text-center text-xs text-purple-950 shadow-xs">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                  <div className="font-bold text-sm">No competitors found within {selectedRadiusFilter} km!</div>
                  <p className="text-[11px] text-purple-800 mt-1">This is a high-yield White-Spot territory with zero direct rivals.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCompetitors.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-3 rounded-2xl bg-white border-2 border-purple-200 hover:border-purple-600 transition-all shadow-xs text-purple-950"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs ${
                              comp.category === "EV_Charging"
                                ? "bg-cyan-100 text-cyan-900 border border-cyan-300"
                                : comp.category === "CNG_Station"
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : "bg-purple-100 text-purple-900 border border-purple-300"
                            }`}
                          >
                            {comp.category === "EV_Charging" ? <Zap className="h-4 w-4" /> : <Fuel className="h-4 w-4" />}
                          </span>
                          <div>
                            <div className="text-xs font-black text-purple-950 leading-tight">
                              {comp.name}
                            </div>
                            <div className="text-[10px] text-purple-800 font-semibold">
                              Brand: <strong className="text-purple-950 font-black">{comp.brand}</strong> &bull; {comp.category.replace("_", " ")}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded-lg font-mono font-black text-xs bg-purple-700 text-white shadow-xs">
                            {comp.distanceKm.toFixed(1)} km {comp.bearing}
                          </span>
                        </div>
                      </div>

                      {comp.address && (
                        <p className="text-[10px] text-purple-800 font-medium mt-1.5 line-clamp-1">
                          {comp.address}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-purple-100 text-[10px] text-purple-800">
                        <span className="flex items-center gap-1 font-medium">
                          Source: <strong className="text-purple-950 font-bold">{comp.source}</strong>
                        </span>
                        {comp.amenities && comp.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {comp.amenities.map((am, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-semibold text-[9px] border border-purple-200">
                                {am}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FOOTFALL & TRAFFIC SIMULATION */}
        {activeInspectorTab === "footfall" && (
          <div className="space-y-4">
            {/* Capture Rate Slider Card */}
            <div className="rounded-2xl bg-white border-2 border-purple-200 p-3.5 space-y-2 text-purple-950 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-purple-950 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-purple-700" />
                  Corridor Capture Rate Calibration
                </span>
                <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-purple-700 text-white">
                  {customCaptureRate.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={7.5}
                step={0.1}
                value={customCaptureRate}
                onChange={(e) => setCustomCaptureRate(Number(e.target.value))}
                className="w-full accent-purple-700 h-2 bg-purple-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-purple-800 font-bold font-mono">
                <span>1.5% Conservative</span>
                <span>3.2% NHAI Avg</span>
                <span>6.0% Highway Oasis</span>
              </div>
            </div>

            {/* Dynamic Volume Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-2xl bg-white border-2 border-purple-200 shadow-xs text-purple-950">
                <div className="text-[10px] font-black uppercase text-purple-800">Daily Captive Footfall</div>
                <div className="text-lg font-black text-purple-950 mt-0.5 font-mono">
                  {formatIndianNumber(dynamicDailyFootfall)} <span className="text-xs text-purple-600">veh/day</span>
                </div>
                <div className="text-[10px] text-purple-700 mt-1 font-medium">
                  Peak Hour: ~{formatIndianNumber(Math.round(dynamicDailyFootfall * 0.095))} vehicles
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border-2 border-purple-200 shadow-xs text-purple-950">
                <div className="text-[10px] font-black uppercase text-purple-800">Projected Fuel Throughput</div>
                <div className="text-lg font-black text-emerald-700 mt-0.5 font-mono">
                  {dynamicMonthlyKL} <span className="text-xs text-purple-900">KL/mo</span>
                </div>
                <div className="text-[10px] text-purple-700 mt-1 font-medium">
                  ~{(dynamicMonthlyKL * 33.3).toFixed(0)} KL/day avg
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border-2 border-purple-200 shadow-xs text-purple-950">
                <div className="text-[10px] font-black uppercase text-purple-800">EV Fast Charging Demand</div>
                <div className="text-lg font-black text-cyan-800 mt-0.5 font-mono">
                  {formatIndianNumber(dynamicDailyEV)} <span className="text-xs text-purple-900">kWh/day</span>
                </div>
                <div className="text-[10px] text-purple-700 mt-1 font-medium">
                  Supports 4-6 dual-gun 120kW chargers
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border-2 border-purple-200 shadow-xs text-purple-950">
                <div className="text-[10px] font-black uppercase text-purple-800">CNG / CBG Potential</div>
                <div className="text-lg font-black text-amber-700 mt-0.5 font-mono">
                  {formatIndianNumber(traffic.projectedDailyCNGKg)} <span className="text-xs text-purple-900">kg/day</span>
                </div>
                <div className="text-[10px] text-purple-700 mt-1 font-medium">
                  SATAT pipeline / cascade feeder
                </div>
              </div>
            </div>

            {/* 24-Hour Diurnal Profile Visualizer */}
            <div className="rounded-2xl bg-white border-2 border-purple-200 p-3 space-y-2 text-purple-950 shadow-xs">
              <div className="text-xs font-black text-purple-950 flex items-center justify-between">
                <span>24-Hour Diurnal Traffic Flow Profile</span>
                <span className="text-[10px] font-bold text-purple-800 font-mono">PCU Equiv: {formatIndianNumber(traffic.pcuEquivalent)}</span>
              </div>

              <div className="space-y-1.5 pt-2">
                {traffic.diurnalProfile.map((d) => (
                  <div key={d.hour} className="flex items-center gap-2 text-[10px]">
                    <span className="w-10 font-mono font-bold text-purple-900">{d.hour}</span>
                    <div className="flex-1 h-3 bg-purple-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-purple-700 h-full rounded-full"
                        style={{ width: `${Math.min(100, (d.trafficVolume / (traffic.estimatedAADT * 0.085)) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="w-14 text-right font-mono font-bold text-purple-950">
                      {formatIndianNumber(Math.round((d.footfall * customCaptureRate) / 3.2))} v/h
                    </span>
                    <span className="w-12 text-right font-mono text-amber-700 font-bold text-[9px]">
                      {d.hcvSharePct}% HCV
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FLEET BREAKDOWN & DEMOGRAPHICS */}
        {activeInspectorTab === "fleet" && (
          <div className="space-y-4">
            {/* Fleet Composition Breakdown */}
            <div className="rounded-2xl bg-white border-2 border-purple-200 p-3.5 space-y-3 text-purple-950 shadow-xs">
              <div className="text-xs font-black text-purple-950">Corridor Vehicle Fleet Mix (% of Traffic)</div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-purple-900 font-bold">
                    <span>2-Wheelers (Commuter Bikes / Scooters)</span>
                    <strong className="text-purple-950 font-mono">{fleet.twoWheelerPct}%</strong>
                  </div>
                  <div className="h-2.5 w-full bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: `${fleet.twoWheelerPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-purple-900 font-bold">
                    <span>4-Wheelers (Cars, Taxis & Private SUVs)</span>
                    <strong className="text-purple-950 font-mono">{fleet.fourWheelerPetrolPct + fleet.fourWheelerDieselPct}%</strong>
                  </div>
                  <div className="h-2.5 w-full bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${fleet.fourWheelerPetrolPct + fleet.fourWheelerDieselPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-purple-900 font-bold">
                    <span>Commercial HCV (Multi-Axle Heavy Trucks & Trailers)</span>
                    <strong className="text-purple-950 font-mono">{fleet.commercialHCVTrucksPct}%</strong>
                  </div>
                  <div className="h-2.5 w-full bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${fleet.commercialHCVTrucksPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1 text-purple-900 font-bold">
                    <span>Buses & Light Commercial Vehicles (LCV)</span>
                    <strong className="text-purple-950 font-mono">{fleet.busesAndLCVPct}%</strong>
                  </div>
                  <div className="h-2.5 w-full bg-purple-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${fleet.busesAndLCVPct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Demographics & Power Infrastructure */}
            <div className="rounded-2xl bg-white border-2 border-purple-200 p-3.5 space-y-3 text-purple-950 shadow-xs">
              <div className="text-xs font-black text-purple-950">Catchment Demographics & Grid Substation</div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] font-bold text-purple-800">3 km Pop</div>
                  <div className="font-mono font-black text-purple-950">{formatIndianNumber(demog.estPopulation3km)}</div>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] font-bold text-purple-800">5 km Pop</div>
                  <div className="font-mono font-black text-purple-950">{formatIndianNumber(demog.estPopulation5km)}</div>
                </div>
                <div className="p-2 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-[10px] font-bold text-purple-800">10 km Pop</div>
                  <div className="font-mono font-black text-purple-950">{formatIndianNumber(demog.estPopulation10km)}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1 border-t border-purple-200">
                <div className="flex justify-between text-[11px]">
                  <span className="text-purple-800 font-bold">SEC Mix (Socio-Economic):</span>
                  <span className="text-purple-950 font-extrabold">A: {demog.secMix.secA}% | B: {demog.secMix.secB}% | C: {demog.secMix.secC}%</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-purple-800 font-bold">Power Substation:</span>
                  <span className="text-emerald-700 font-mono font-black">{demog.gridSubstationKv} kV Line</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-purple-800 font-bold">Transformer Headroom:</span>
                  <span className="text-cyan-800 font-mono font-black">{demog.transformerHeadroomKva} kVA (EV Ready)</span>
                </div>
              </div>

              {demog.nearbyHubs && demog.nearbyHubs.length > 0 && (
                <div className="pt-2 border-t border-purple-200">
                  <div className="text-[10px] font-black text-purple-900 uppercase mb-1">Nearby Commercial Logistics Anchors</div>
                  <ul className="text-[11px] text-purple-950 font-medium space-y-1">
                    {demog.nearbyHubs.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-purple-700" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RAW GEOAPIFY & OSM METADATA */}
        {activeInspectorTab === "raw_geo" && (
          <div className="space-y-3 text-xs">
            <div className="rounded-2xl bg-white border-2 border-purple-200 p-3.5 space-y-2 text-purple-950 shadow-xs">
              <div className="font-black text-purple-950 flex items-center justify-between">
                <span>Geoapify API & OSM Response</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold font-mono">Live API Active</span>
              </div>

              <div className="space-y-1 font-mono text-[11px] text-purple-900 font-medium">
                <div><strong>Reverse Geocoded:</strong> {loc.formattedAddress}</div>
                <div><strong>Road Class:</strong> {loc.roadCategory}</div>
                <div><strong>District:</strong> {loc.district}</div>
                <div><strong>State:</strong> {loc.state}</div>
                <div><strong>Country:</strong> {loc.country} ({loc.postcode || "N/A"})</div>
                <div><strong>Confidence:</strong> {(loc.confidence * 100).toFixed(0)}%</div>
                <div><strong>API Query Time:</strong> {analysis.apiStatus.timestamp}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border-2 border-purple-200 p-3.5 text-purple-950 shadow-xs">
              <div className="font-black text-purple-950 mb-1">Overpass Query Schema</div>
              <p className="text-[11px] text-purple-800 font-medium mb-2">
                Real-time geospatial bounding box scanning radius: 18,000 meters for amenities: <code>fuel</code>, <code>charging_station</code>, <code>fuel:cng</code>, <code>fuel:electricity</code>, and road hierarchy.
              </p>
              <div className="rounded-xl bg-purple-900 p-3 font-mono text-[10px] text-purple-100 overflow-x-auto shadow-inner">
                [out:json][timeout:12];<br/>
                node["amenity"="fuel"](around:18000, {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)});<br/>
                node["amenity"="charging_station"](around:18000, {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)});<br/>
                node["fuel:cng"="yes"](around:18000, {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)});<br/>
                out center;
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer: 1-Click Promote & Tab Navigation */}
      <div className="p-3 bg-purple-50/80 border-t-2 border-purple-200 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              handlePromoteToCandidate();
              setActiveTab("market_share");
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-purple-100 text-purple-950 font-bold text-xs border border-purple-300 shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <TrendingUp className="h-3.5 w-3.5 text-purple-700" />
            Market Share Tab
          </button>

          <button
            onClick={() => {
              handlePromoteToCandidate();
              setActiveTab("footfall_fleet");
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-purple-100 text-purple-950 font-bold text-xs border border-purple-300 shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Activity className="h-3.5 w-3.5 text-purple-700" />
            Footfall & Fleet Tab
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePromoteToCandidate}
            className="flex-1 py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Adopt as Active Site Candidate
          </button>

          <button
            onClick={() => {
              handlePromoteToCandidate();
              setActiveTab("ai_memo");
            }}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-purple-100 text-purple-950 font-bold text-xs shadow-xs border border-purple-300 transition-all flex items-center gap-1"
            title="Draft Executive Memo with AI Copilot"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-700" />
            AI Memo
          </button>
        </div>
      </div>
    </div>
  );
};
