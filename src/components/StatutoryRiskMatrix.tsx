import React from "react";
import { WhiteSpotSite } from "../types";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Building2, 
  MapPin, 
  Zap, 
  Scale,
  Flame,
  Info
} from "lucide-react";

interface StatutoryRiskMatrixProps {
  activeSite: WhiteSpotSite;
}

export const StatutoryRiskMatrix: React.FC<StatutoryRiskMatrixProps> = ({ activeSite }) => {
  const { statutory } = activeSite;

  const clearances = [
    {
      name: "PESO Layout Approval & Tank Safety License",
      authority: "Petroleum & Explosives Safety Organisation (Nagpur / Regional Circles)",
      status: statutory.pesoStatus,
      isOk: statutory.pesoStatus === "Approved" || statutory.pesoStatus === "NOC Received",
      riskLevel: "Critical Safety",
      details: "Requires 3m boundary distance for Class A/B petroleum storage, flameproof wiring, and emergency shut-off valves.",
    },
    {
      name: "NHAI IRC:12 Access & Taper Approval",
      authority: "National Highways Authority of India (MoRTH)",
      status: statutory.nhaiIrc12Compliant ? "Fully Compliant" : "Variance Review Required",
      isOk: statutory.nhaiIrc12Compliant,
      riskLevel: "High Highway Risk",
      details: `Frontage: ${statutory.frontageMeters}m (Req: ≥45m) | Depth: ${statutory.depthMeters}m | Median Opening: ${statutory.medianCutDistanceMeters}m`,
    },
    {
      name: "District Magistrate (DM) / Collector NOC",
      authority: "District Revenue & Police Administration",
      status: statutory.dmNocStatus,
      isOk: statutory.dmNocStatus === "Clear",
      riskLevel: "Administrative",
      details: "Land use conversion (NA/Non-Agricultural), police traffic clearance, and local public hearing compliance.",
    },
    {
      name: "State Pollution Control Board (SPCB) CTE/CTO",
      authority: "State PCB Environmental Directorate",
      status: statutory.spcbCteStatus,
      isOk: statutory.spcbCteStatus === "Obtained" || statutory.spcbCteStatus === "Exempted",
      riskLevel: "Environmental",

      details: "Stage-II Vapor Recovery System (VRS) installed, oil-water separator (OWS) pit, and DG set acoustic enclosure.",
    },
    {
      name: "Overhead HT Power Line Clearance",
      authority: "State Electricity Transmission Corp (TRANSCO)",
      status: statutory.highTensionLineClearance ? "Cleared (>15m corridor)" : "Under Line (Encroachment)",
      isOk: statutory.highTensionLineClearance,
      riskLevel: "Structural Hazard",
      details: "No retail canopy or underground petroleum storage permitted under active 66kV/132kV overhead transmission towers.",
    },
  ];

  const okCount = clearances.filter((c) => c.isOk).length;
  const statutoryFrictionScore = Math.round(((clearances.length - okCount) / clearances.length) * 100);

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              PESO, NHAI IRC:12 & Statutory Risk Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Statutory underwriting tracking regulatory hurdles, environmental consent, and corridor access norms for <strong>{activeSite.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-1.5 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Statutory Friction</div>
            <div className={`text-base font-bold font-mono ${statutoryFrictionScore <= 20 ? "text-emerald-400" : "text-amber-400"}`}>
              {statutoryFrictionScore}% Friction Score
            </div>
          </div>
        </div>
      </div>

      {/* IRC:12 Highway Geometric Checklist Cards */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-4 flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-400" />
          NHAI IRC:12 Geometric Norms Audit
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Plot Frontage (IRC:12)</div>
            <div className="text-xl font-bold text-white font-mono mt-1">{statutory.frontageMeters} Meters</div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Min 45m Required (Passed)
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Plot Depth</div>
            <div className="text-xl font-bold text-white font-mono mt-1">{statutory.depthMeters} Meters</div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Min 35m Required (Passed)
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Median Cut Separation</div>
            <div className="text-xl font-bold text-cyan-400 font-mono mt-1">{statutory.medianCutDistanceMeters} Meters</div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> &gt;300m Safe Distance (Passed)
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">HT Transmission Line</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">Clear</div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> No Overhead Cable Line
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Clearances Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-4">
          Statutory Regulatory Pipeline & Agency Approvals
        </h3>

        <div className="space-y-3">
          {clearances.map((c, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-950/70 p-4 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${c.isOk ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`}></span>
                  <h4 className="text-sm font-bold text-white">{c.name}</h4>
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700">
                    {c.riskLevel}
                  </span>
                </div>
                <div className="text-xs text-slate-400">{c.authority}</div>
                <div className="text-[11px] text-slate-500">{c.details}</div>
              </div>

              <div className="self-start md:self-auto shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold font-mono border ${
                    c.isOk
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {c.isOk ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  {c.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Info className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>Average statutory clearance cycle for Expressway Highway Oasis projects across NHAI corridors is approximately <strong>90 to 120 days</strong>.</span>
        </div>
      </div>
    </div>
  );
};
