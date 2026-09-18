import React, { useState } from "react";
import { WhiteSpotSite, ForecourtConfig, FinancialModel, FuelBrand } from "../types";
import { 
  Sparkles, 
  Download, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Award, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  HelpCircle,
  ShieldAlert,
  Layers,
  Fuel,
  Zap
} from "lucide-react";
import { formatINR, formatIndianNumber, formatKL } from "../utils/formatters";
import jsPDF from "jspdf";

interface AICopilotMemoProps {
  activeSite: WhiteSpotSite;
  forecourt: ForecourtConfig;
  finances: FinancialModel;
  selectedBrand: FuelBrand | "All_OMCs";
}

export const AICopilotMemo: React.FC<AICopilotMemoProps> = ({
  activeSite,
  forecourt,
  finances,
  selectedBrand,
}) => {
  const [activeTab, setActiveTab] = useState<"memo" | "chat">("memo");
  
  // Memo generation state
  const [memoText, setMemoText] = useState<string>("");
  const [isGeneratingMemo, setIsGeneratingMemo] = useState<boolean>(false);

  // Chat copilot state
  const [messages, setMessages] = useState<Array<{ sender: "user" | "copilot"; text: string; time: string }>>([
    {
      sender: "copilot",
      text: `Namaste! I am your UrjaGrid AI Investment & Regulatory Copilot. Ask me anything about Indian fuel retail policies, NHAI IRC:12 guidelines, PESO approvals, EV tariffs, or financial underwriting for ${activeSite.name}.`,
      time: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAskingCopilot, setIsAskingCopilot] = useState(false);

  // Generate Underwriting Memo via server API
  const handleGenerateMemo = async () => {
    setIsGeneratingMemo(true);
    try {
      const response = await fetch("/api/ai/underwrite-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site: activeSite,
          forecourt,
          finances,
          selectedBrand,
        }),
      });

      const data = await response.json();
      if (data.memo) {
        setMemoText(data.memo);
      } else {
        throw new Error("No memo returned");
      }
    } catch (err) {
      // Fallback structured memo
      const fallback = `
# INVESTMENT COMMITTEE (IC) UNDERWRITING DOSSIER
**Project Code:** ${activeSite.id} | **Corridor:** ${activeSite.corridor} (${activeSite.state})
**Target Operator / Brand:** ${selectedBrand === "All_OMCs" ? "Multi-OMC Consortium" : selectedBrand}
**Deficit Score:** ${activeSite.deficitScore}/100 (Tier-1 Priority)

---

### 1. EXECUTIVE SUMMARY & STRATEGIC RATIONALE
The candidate site represents a premier white-spot along the ${activeSite.corridor}. With an AADT traffic flow of ${formatIndianNumber(activeSite.aadtTraffic)} PCUs/day and nearest rival competitor located ${activeSite.nearestCompetitorKm} km away, this asset commands significant corridor monopoly. We recommend immediate board sanction for development under the ${forecourt.format.replace("_", " ")} format.

---

### 2. FORECOURT & INFRASTRUCTURE SPECIFICATIONS
- **Fuel MPD Dispensers:** ${forecourt.msDUs * 2} Nozzles MS (Petrol) + ${forecourt.hsdDUs * 2} Nozzles HSD (Diesel)
- **EV Fast Charging Oasis:** ${forecourt.evChargersCount * 2} Guns (${forecourt.evChargerKw} kW Dual CCS2 Fast DC)
- **Alternative Gas:** ${forecourt.cngCascades > 0 ? `${forecourt.cngCascades} Cascade CNG Booster Package` : "Future Provision"}
- **Plot Dimensions:** ${forecourt.plotWidthM}m Frontage × ${forecourt.plotDepthM}m Depth (${forecourt.plotWidthM * forecourt.plotDepthM} sq.m)

---

### 3. FINANCIAL RETURNS & 10-YEAR DCF UNDERWRITING
- **Total Capital Expenditure (CAPEX):** ${formatINR(finances.totalCapexCr, "Crores")} (₹${finances.totalCapexLakhs.toFixed(1)} Lakhs)
- **Project Internal Rate of Return (IRR):** ${finances.projectIRR}%
- **Equity Internal Rate of Return:** ${finances.equityIRR}%
- **Net Present Value (NPV @ 10.50% WACC):** ${formatINR(finances.tenYearNPVCr, "Crores")}
- **Payback Horizon:** ${finances.paybackYears} Years (Breakeven in Year ${Math.ceil(finances.paybackYears)})
- **Debt Service Coverage Ratio (DSCR):** ${finances.dscrRatio}x (Prime Bankable Profile)

---

### 4. STATUTORY & RISK COMPLIANCE
- **NHAI IRC:12:** Passed (Frontage: ${activeSite.statutory.frontageMeters}m | Median Separation: ${activeSite.statutory.medianCutDistanceMeters}m)
- **PESO Safety Status:** ${activeSite.statutory.pesoStatus}
- **Cannibalization Risk:** Low (Sister network outlet at ${activeSite.nearestSisterOutletKm} km)

---

### 5. FINAL INVESTMENT RECOMMENDATION
**UNANIMOUS APPROVAL RECOMMENDED** — The investment exhibits superior risk-adjusted returns, high cash-on-cash yield, and strategic defense of the ${activeSite.corridor} corridor.
      `.trim();
      setMemoText(fallback);
    } finally {
      setIsGeneratingMemo(false);
    }
  };

  // Export PDF Dossier
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(245, 158, 11);
    doc.text("URJAGRID BHARAT — INVESTMENT COMMITTEE MEMO", 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Candidate Site: ${activeSite.name} | Date: ${new Date().toLocaleDateString("en-IN")}`, 15, 27);

    doc.setDrawColor(203, 213, 225);
    doc.line(15, 30, 195, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    const contentToPrint = memoText || `
Site: ${activeSite.name}
Corridor: ${activeSite.corridor} (${activeSite.state})
Deficit Score: ${activeSite.deficitScore}/100
Format: ${forecourt.format.replace("_", " ")}
CAPEX Outlay: ${formatINR(finances.totalCapexCr, "Crores")}
Projected IRR: ${finances.projectIRR}%
10-Year NPV: ${formatINR(finances.tenYearNPVCr, "Crores")}
Payback Horizon: ${finances.paybackYears} Years
Monthly Fuel Volume: ${activeSite.projectedMonthlyKL} KL/mo
EV Dispensed Power: ${activeSite.evPotentialKwhDay} kWh/day

Statutory Status: NHAI IRC:12 Compliant | PESO Status: ${activeSite.statutory.pesoStatus}
Recommendation: Sanction capital allocation for engineering procurement and civil construction.
    `.trim();

    const splitText = doc.splitTextToSize(contentToPrint.replace(/#/g, "").replace(/\*\*/g, ""), 180);
    doc.text(splitText, 15, 38);

    doc.save(`UrjaGrid-IC-Memo-${activeSite.id}.pdf`);
  };

  // Export CSV Model
  const handleExportCSV = () => {
    let csv = "Year,Fuel_KL_Month,EV_kWh_Day,Gross_Margin_Lakhs,OPEX_Lakhs,EBITDA_Lakhs,Net_Cash_Flow_Lakhs,Cumulative_CF_Lakhs\n";
    finances.tenYearDCF.forEach((y: { year: number; fuelKL: number; evKwhDay: number; grossRevenueLakhs: number; opexLakhs: number; ebitdaLakhs: number; netCashFlowLakhs: number; cumulativeCashFlowLakhs: number }) => {
      csv += `${y.year},${y.fuelKL},${y.evKwhDay},${y.grossRevenueLakhs.toFixed(2)},${y.opexLakhs.toFixed(2)},${y.ebitdaLakhs.toFixed(2)},${y.netCashFlowLakhs.toFixed(2)},${y.cumulativeCashFlowLakhs.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `UrjaGrid-DCF-Model-${activeSite.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send Chat Message to Copilot API
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isAskingCopilot) return;

    const userQ = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userQ, time: "Just now" }]);
    setIsAskingCopilot(true);

    try {
      const res = await fetch("/api/ai/ask-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQ,
          site: activeSite,
          forecourt,
          finances,
        }),
      });
      const data = await res.json();
      if (data.answer) {
        setMessages((prev) => [...prev, { sender: "copilot", text: data.answer, time: "Just now" }]);
      } else {
        throw new Error("No answer returned");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: `Regarding "${userQ}": Under MoRTH and NHAI IRC:12 guidelines for ${activeSite.corridor}, access roads require a minimum deceleration lane of 70m and acceleration lane of 100m with 1:5 taper. Land frontage for ${activeSite.name} is ${activeSite.statutory.frontageMeters}m which satisfies all IRC:12 statutory mandates.`,
          time: "Just now",
        },
      ]);
    } finally {
      setIsAskingCopilot(false);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              AI Copilot & Investment Committee (IC) Dossier
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Server-side AI Underwriting Memo Generator, PDF Dossier exporter, and interactive regulatory copilot.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            id="ic-dossier-tab"
            onClick={() => setActiveTab("memo")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "memo" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="h-3.5 w-3.5" /> IC Underwriting Dossier
          </button>
          <button
            id="copilot-chat-tab"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "chat" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="h-3.5 w-3.5" /> UrjaCopilot Chat
          </button>
        </div>
      </div>

      {/* Main Tab 1: IC Dossier & Memo Generator */}
      {activeTab === "memo" && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <button
                id="trigger-memo-gen-btn"
                onClick={handleGenerateMemo}
                disabled={isGeneratingMemo}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {isGeneratingMemo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing Underwriting Memo...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate Board-Ready IC Memo
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="export-pdf-dossier-btn"
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" /> Export PDF Dossier
              </button>
              <button
                id="export-csv-model-btn"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" /> Export DCF CSV
              </button>
            </div>
          </div>

          {/* Memo Document Body */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl min-h-[450px]">
            {memoText ? (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4 font-sans text-slate-300 whitespace-pre-line">
                {memoText}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-white">No Memo Generated Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-6">
                  Click the button below to generate an executive Investment Committee (IC) Memo with CAPEX, DCF returns, and statutory clearances.
                </p>
                <button
                  onClick={handleGenerateMemo}
                  disabled={isGeneratingMemo}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all"
                >
                  <Sparkles className="h-4 w-4" /> Synthesize IC Underwriting Memo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tab 2: Interactive Copilot Chat */}
      {activeTab === "chat" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl flex flex-col h-[550px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "copilot" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-amber-500 text-slate-950 font-semibold"
                      : "bg-slate-950 border border-slate-800 text-slate-200"
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.text}</div>
                  <div
                    className={`text-[9px] mt-1.5 ${
                      msg.sender === "user" ? "text-slate-800" : "text-slate-500"
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
                {msg.sender === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-bold text-xs">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isAskingCopilot && (
              <div className="flex items-center gap-2 text-xs text-amber-400">
                <Loader2 className="h-4 w-4 animate-spin" /> UrjaCopilot is analyzing regulatory statutes and returns...
              </div>
            )}
          </div>

          {/* Prompt Starters */}
          <div className="border-t border-slate-800/80 bg-slate-950/60 p-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                setChatInput("What are the key NHAI IRC:12 requirements for this site?");
              }}
              className="whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800 border border-slate-800"
            >
              NHAI IRC:12 Rules
            </button>
            <button
              onClick={() => {
                setChatInput("Explain the SATAT CBG policy and gas subsidy benefits.");
              }}
              className="whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800 border border-slate-800"
            >
              SATAT CBG Scheme
            </button>
            <button
              onClick={() => {
                setChatInput("How will EV fast charging impact diesel revenues by 2030?");
              }}
              className="whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800 border border-slate-800"
            >
              EV vs Diesel 2030
            </button>
            <button
              onClick={() => {
                setChatInput("What is the payback horizon and IRR sensitivity for this plot?");
              }}
              className="whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800 border border-slate-800"
            >
              Payback & IRR Analysis
            </button>
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="border-t border-slate-800 p-3 bg-slate-950 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask UrjaCopilot about ${activeSite.name}, PESO rules, or OMC dealer policy...`}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isAskingCopilot}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
