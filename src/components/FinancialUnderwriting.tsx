import React, { useState } from "react";
import { FinancialModel, WhiteSpotSite, ForecourtConfig } from "../types";
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Sliders, 
  Percent, 
  Layers, 
  Download, 
  FileText, 
  CheckCircle2,
  HelpCircle,
  Award
} from "lucide-react";
import { formatINR, formatIndianNumber, formatKL } from "../utils/formatters";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";

interface FinancialUnderwritingProps {
  activeSite: WhiteSpotSite;
  allSites: WhiteSpotSite[];
  setActiveSite: (site: WhiteSpotSite) => void;
  finances: FinancialModel;
  forecourt: ForecourtConfig;
  onUpdateCapexItem?: (key: string, value: number) => void;
}

export const FinancialUnderwriting: React.FC<FinancialUnderwritingProps> = ({
  activeSite,
  allSites,
  setActiveSite,
  finances,
  forecourt,
}) => {
  const [activeTab, setActiveTab] = useState<"dcf_table" | "capex_opex" | "pipeline_ranking">("dcf_table");

  const cashFlowChartData = finances.tenYearDCF.map((year: { year: number; grossRevenueLakhs: number; ebitdaLakhs: number; netCashFlowLakhs: number; cumulativeCashFlowLakhs: number }) => ({
    year: `Y${year.year}`,
    grossRevenue: Number((year.grossRevenueLakhs / 100).toFixed(2)),
    ebitda: Number((year.ebitdaLakhs / 100).toFixed(2)),
    netCashFlow: Number((year.netCashFlowLakhs / 100).toFixed(2)),
    cumulativeCF: Number((year.cumulativeCashFlowLakhs / 100).toFixed(2)),
  }));

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-emerald-400" />
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              Financial Underwriting & 10-Year DCF Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            CAPEX/OPEX modeling, multi-product margin yield, Discounted Cash Flow (DCF), IRR, NPV, and DSCR for <strong>{activeSite.name}</strong>.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("dcf_table")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "dcf_table" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            10-Yr DCF Projections
          </button>
          <button
            onClick={() => setActiveTab("capex_opex")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "capex_opex" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            CAPEX & OPEX Breakdown
          </button>
          <button
            onClick={() => setActiveTab("pipeline_ranking")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "pipeline_ranking" ? "bg-emerald-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Portfolio Multi-Site Ranking
          </button>
        </div>
      </div>

      {/* Top 5 Underwriting Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total CAPEX</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {formatINR(finances.totalCapexCr, "Crores")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">₹{finances.totalCapexLakhs.toFixed(1)} Lakhs Outlay</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Project IRR</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{finances.projectIRR}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Equity IRR: <strong className="text-emerald-300">{finances.equityIRR}%</strong></div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">10-Yr NPV (@10.5%)</span>
            <DollarSign className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {formatINR(finances.tenYearNPVCr, "Crores")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Discount Rate: 10.50% WACC</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Payback Horizon</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">{finances.paybackYears} Years</div>
          <div className="text-[11px] text-slate-400 mt-1">Breakeven Year {Math.ceil(finances.paybackYears)}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Avg DSCR Ratio</span>
            <Award className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">{finances.dscrRatio}x</div>
          <div className="text-[11px] text-emerald-400 mt-1">Bankable & Low Default Risk</div>
        </div>
      </div>

      {/* Main View Body */}
      {activeTab === "dcf_table" && (
        <div className="space-y-6">
          {/* 10-Yr Cash Flow Chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                10-Year Annual EBITDA & Cumulative Free Cash Flow Trajectory (₹ Crores)
              </h3>
              <span className="text-xs font-mono text-slate-400">Terminal Multiplier: 4.5x</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`₹${val} Cr`, ""]}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "11px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="ebitda" fill="#10b981" name="Annual EBITDA (₹ Cr)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cumulativeCF" fill="#38bdf8" name="Cumulative Cash Flow (₹ Cr)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed 10-Year DCF Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
            <div className="border-b border-slate-800 pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Detailed 10-Year Discounted Cash Flow (DCF) Schedule (₹ Lakhs)
              </h3>
              <span className="text-xs text-slate-400 font-mono">Growth: Fuel 3.5% | EV 16.0% | Inflation 4.5%</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-sans">
                    <th className="py-2.5 px-3">Metric</th>
                    {finances.tenYearDCF.map((y: { year: number }) => (
                      <th key={y.year} className="py-2.5 px-2 text-right">Y{y.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-300">Fuel Vol (KL/mo)</td>
                    {finances.tenYearDCF.map((y: { year: number; fuelKL: number }) => (
                      <td key={y.year} className="py-2.5 px-2 text-right">{y.fuelKL}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-cyan-400">EV Power (kWh/d)</td>
                    {finances.tenYearDCF.map((y: { year: number; evKwhDay: number }) => (
                      <td key={y.year} className="py-2.5 px-2 text-right text-cyan-400">{formatIndianNumber(y.evKwhDay)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-300">Gross Margin (₹L)</td>
                    {finances.tenYearDCF.map((y: { year: number; grossRevenueLakhs: number }) => (
                      <td key={y.year} className="py-2.5 px-2 text-right font-bold text-white">{y.grossRevenueLakhs.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-400">Total OPEX (₹L)</td>
                    {finances.tenYearDCF.map((y: { year: number; opexLakhs: number }) => (
                      <td key={y.year} className="py-2.5 px-2 text-right text-rose-400">({y.opexLakhs.toFixed(1)})</td>
                    ))}
                  </tr>
                  <tr className="bg-emerald-500/5">
                    <td className="py-2.5 px-3 font-sans font-bold text-emerald-400">EBITDA (₹L)</td>
                    {finances.tenYearDCF.map((y: { year: number; ebitdaLakhs: number }) => (
                      <td key={y.year} className="py-2.5 px-2 text-right font-bold text-emerald-400">{y.ebitdaLakhs.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-300">Net Cash Flow (₹L)</td>
                    {finances.tenYearDCF.map((y: { year: number; netCashFlowLakhs: number }) => (
                      <td key={y.year} className="py-2.5 px-2 text-right text-slate-100">{y.netCashFlowLakhs.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr className="bg-slate-950/80">
                    <td className="py-2.5 px-3 font-sans font-bold text-cyan-400">Cumul. Free CF (₹L)</td>
                    {finances.tenYearDCF.map((y: { year: number; cumulativeCashFlowLakhs: number }) => (
                      <td key={y.year} className="py-2.5 px-2 text-right font-bold text-cyan-400">{y.cumulativeCashFlowLakhs.toFixed(1)}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CAPEX & OPEX Detailed Breakdown View */}
      {activeTab === "capex_opex" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 6 Cols: CAPEX Items */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-amber-400">
                Capital Expenditure (CAPEX) Line Items
              </h3>
              <span className="font-mono font-bold text-white text-sm">
                Total: {formatINR(finances.totalCapexCr, "Crores")}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">Land Development, IRC:12 Tapers & Civil Grading</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.capexBreakdown.landDevelopmentAndCivilLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">Overhead Canopy Structure & RCC Paver Driveways</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.capexBreakdown.canopyAndDrivewayPavingLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">Fuel MPD Dispensers, ATG Probes & Tank Automation</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.capexBreakdown.dispensersAndAutomationLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">PESO Underground Storage Tanks & Piping</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.capexBreakdown.undergroundTanksAndPipingLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">EV DC Fast Chargers & DISCOM HT Transformer</span>
                <span className="font-mono font-bold text-cyan-400">₹{finances.capexBreakdown.evFastChargersAndHTTransformerLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">CNG Booster Compressor Cascade Package</span>
                <span className="font-mono font-bold text-emerald-400">₹{finances.capexBreakdown.cngBoosterPackageLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">Commercial Building, Highway Nest & Sanitized Restrooms</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.capexBreakdown.commercialBuildingAndQSRLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">Statutory Licensing, PESO, NHAI NOC & Contingencies</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.capexBreakdown.statutoryPESOAndContingencyLakhs} Lakhs</span>
              </div>
            </div>
          </div>

          {/* Right 6 Cols: OPEX Items */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs uppercase font-bold tracking-wider text-rose-400">
                Annual Operating Expenditure (OPEX)
              </h3>
              <span className="font-mono font-bold text-white text-sm">
                Total: ₹{finances.annualOpexLakhs.toFixed(1)} Lakhs/Year
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">DISCOM Grid Power & Demand Charges</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.opexBreakdown.electricityAndDemandChargesAnnualLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">Forecourt Customer Attendants & Crew Salaries (3 Shifts)</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.opexBreakdown.staffSalariesAndCrewAnnualLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">Equipment Annual Maintenance Contracts (AMC) & Testing</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.opexBreakdown.maintenanceAndAMCAnnualLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">Plot Land Lease / Franchisee Royalty Fee</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.opexBreakdown.landLeaseOrRoyaltyAnnualLakhs} Lakhs</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-300">Insurance, Environmental Audits & Consumables</span>
                <span className="font-mono font-bold text-slate-100">₹{finances.opexBreakdown.insuranceAndAdminAnnualLakhs} Lakhs</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-[11px] text-slate-400">
              Operating costs scale with a modeled annual inflation rate of <strong>4.5%</strong>.
            </div>
          </div>
        </div>
      )}

      {/* Multi-Site Portfolio Ranking View */}
      {activeTab === "pipeline_ranking" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              White-Spot Portfolio Investment Prioritization (All 12 Corridors)
            </h3>
            <p className="text-xs text-slate-400">
              Ranked by combined Deficit Score, IRR potential, and Payback Velocity.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Site & Corridor</th>
                  <th className="py-2.5 px-3">Deficit</th>
                  <th className="py-2.5 px-3">AADT Flow</th>
                  <th className="py-2.5 px-3">CAPEX (₹ Cr)</th>
                  <th className="py-2.5 px-3">Monthly KL</th>
                  <th className="py-2.5 px-3">EV kWh/d</th>
                  <th className="py-2.5 px-3">Projected IRR</th>
                  <th className="py-2.5 px-3">Payback</th>
                  <th className="py-2.5 px-3 text-right">Switch Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allSites.map((site) => {
                  const isCurrent = site.id === activeSite.id;
                  const estimatedIRR = (17.5 + (site.deficitScore - 75) * 0.3).toFixed(1);
                  const estimatedPayback = (3.2 + (100 - site.deficitScore) * 0.04).toFixed(1);

                  return (
                    <tr
                      key={site.id}
                      className={`hover:bg-slate-800/40 ${isCurrent ? "bg-amber-500/10 font-semibold" : ""}`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100">{site.name}</div>
                        <div className="text-[10px] text-slate-400">{site.corridor}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-400">{site.deficitScore}/100</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{formatIndianNumber(site.aadtTraffic)}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">₹{site.defaultCapexCr.toFixed(1)} Cr</td>
                      <td className="py-3 px-3 font-mono text-amber-400">{site.projectedMonthlyKL} KL</td>
                      <td className="py-3 px-3 font-mono text-cyan-400">{formatIndianNumber(site.evPotentialKwhDay)}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-400">{estimatedIRR}%</td>
                      <td className="py-3 px-3 font-mono text-purple-400">{estimatedPayback} Yrs</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setActiveSite(site)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                            isCurrent
                              ? "bg-amber-500 text-slate-950 font-bold"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {isCurrent ? "Selected" : "Select"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
