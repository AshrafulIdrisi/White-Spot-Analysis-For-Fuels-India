import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini AI initialization with custom user-agent
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "UrjaGrid API",
    geminiEnabled: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Executive Underwriting Memo Generator
app.post("/api/ai/underwrite-memo", async (req, res) => {
  try {
    const { site, forecourt, financials, traffic, demographics, cannibalization } = req.body;

    const prompt = `You are the Chief Investment Officer & Network Planning Head for an Indian Oil Marketing Company (OMC) and EV Infrastructure consortium.
Generate an exhaustive, authoritative, Board-ready Investment Committee (IC) Underwriting Memorandum and Dealership Feasibility Report for the following candidate retail site in India.

SITE DETAILS:
- Name / Location: ${site?.name || "Candidate Site"} (${site?.state || "India"}, Corridor: ${site?.corridor || "NHAI Expressway"})
- Coordinates: Lat ${site?.lat}, Lng ${site?.lng}
- Format: ${forecourt?.format || "COCO"}
- Catchment Deficit Score: ${site?.deficitScore || 85}/100
- Energy Mix: Petrol/Speed (${forecourt?.msDUs || 4} DUs), Diesel/HSD (${forecourt?.hsdDUs || 6} DUs), CNG (${forecourt?.cngDUs || 2} Bays), EV Fast Chargers (${forecourt?.evChargers || 2} x 120kW CCS2)
- Nearby Amenities: ${forecourt?.amenities?.join(", ") || "Highway Nest QSR, Driver Dormitory, EV Lounge"}

TRAFFIC & CATCHMENT:
- AADT: ${traffic?.aadt?.toLocaleString("en-IN") || "38,000"} vehicles/day
- Capture Rate: ${traffic?.captureRate || 3.2}% (Est. ${traffic?.dailyFootfall?.toLocaleString("en-IN") || "1,216"} vehicles/day)
- Fleet Mix: 2W ${demographics?.fleet2W || 25}%, 4W Cars ${demographics?.fleet4W || 40}%, Heavy CV/Trucks ${demographics?.fleetCV || 35}%
- 5km Catchment Population: ${demographics?.population?.toLocaleString("en-IN") || "1,85,000"}
- RTO EV Adoption Index: ${demographics?.evScore || 72}/100

FINANCIAL UNDERWRITING:
- Total CAPEX: ₹${financials?.capexCr || "4.85"} Crores
- Projected Monthly Fuel: ${financials?.monthlyKL || "280"} KL (MS: ${financials?.msKL || "110"} KL, HSD: ${financials?.hsdKL || "170"} KL)
- Monthly CNG: ${financials?.monthlyCNGKg?.toLocaleString("en-IN") || "45,000"} kg
- Monthly EV Dispensed: ${financials?.monthlyEVkWh?.toLocaleString("en-IN") || "32,000"} kWh
- Non-Fuel Retail (C-Store / QSR) Gross Turnover: ₹${financials?.cStoreTurnoverLakhs || "18.5"} Lakhs/month
- Project IRR: ${financials?.projectIRR || "21.4"}%
- Equity IRR: ${financials?.equityIRR || "28.2"}%
- Simple Payback Period: ${financials?.paybackYears || "3.8"} Years
- 10-Year NPV (@ 11% WACC): ₹${financials?.npvCr || "5.42"} Crores
- DSCR (Average): ${financials?.dscr || "1.85"}x

CANNIBALIZATION & REGULATORY:
- Nearest Dealer Distance: ${cannibalization?.nearestKm || 4.2} km
- Cannibalization Impact on Sister Outlets: ${cannibalization?.volumeDiversion || 12}% (${cannibalization?.dealerGrievanceRisk || "Low-Medium"} risk)
- Statutory Readiness: PESO NOC, IRC:12 NHAI Access, State PCB CTO/CTE, DM NOC

Format your response in crisp, structured Markdown sections:
# 1. EXECUTIVE SUMMARY & INVESTMENT RECOMMENDATION (Approval status, high-level rationale, strategic imperative)
# 2. STRATEGIC & CORRIDOR THESIS (Why this location wins, FASTag PCU analysis, logistics & commuter tailwinds)
# 3. MULTI-FUEL & NON-FUEL REVENUE ARCHITECTURE (Fuel vs CNG vs EV vs Food Court/QSR economics)
# 4. CANNIBALIZATION, DEALER GOVERNANCE & SISTER NETWORK IMPACT (Mitigation strategies)
# 5. REGULATORY, PESO & STATUTORY CLEARANCES ACTION PLAN (IRC:12 compliance, frontages, DISCOM power line)
# 6. SENSITIVITY ANALYSIS & DOWNSIDE PROTECTION (Pessimistic vs Base vs Bull scenarios)
# 7. FINAL COMMITTEE SIGN-OFF MATRIX (Conditions precedent to fund disbursement)

Use formal Indian corporate banking and OMC terminology (e.g. OMCs, PESO, NHAI IRC:12, DISCOM, SATAT scheme, KL/month, ₹ Lakhs/Crores).`;

    const ai = getAiClient();
    if (!ai) {
      // Fallback deterministic response for preview if API key not present
      const fallbackReport = generateDeterministicMemo(site, forecourt, financials, traffic, demographics, cannibalization);
      return res.json({ text: fallbackReport, isFallback: true });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({ text: response.text || "Report generated.", isFallback: false });
  } catch (error: any) {
    console.error("AI Memo generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate underwriting memo" });
  }
});

// AI Network Copilot Chat Endpoint
app.post("/api/ai/ask-copilot", async (req, res) => {
  try {
    const { question, context } = req.body;

    const prompt = `You are UrjaCopilot, an expert AI Geospatial Analyst & Fuel Retail/EV Strategist specializing in the Indian market.
Current User Context:
${JSON.stringify(context || {}, null, 2)}

User Question: ${question}

Provide an authoritative, highly practical, and data-backed response citing Indian norms (IRC:12 for NHAI frontage & median cuts, PESO Petroleum Rules 2002, SATAT CBG guidelines, DISCOM EV green tariffs, OMC dealer margins for MS/HSD in ₹/litre, COCO vs CODO vs DODO operating models, FAME-II/PM E-DRIVE charging subsidies).
Be concise, well-structured, and provide concrete numbers in Indian formats (₹ Lakhs/Crores, KL, AADT).`;

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        text: `**[UrjaCopilot Guidance]**\n\nBased on Indian OMC norms and NHAI corridor standards:\n- **Access Norms (IRC:12):** National highway retail outlets require minimum 35m frontage on State Highways and 45m on National Highways, with standard 1:10 deceleration/acceleration tapers.\n- **Fuel Margins:** OMC dealer commission averages ~₹3.80/L on MS (Petrol) and ~₹2.60/L on HSD (Diesel), while EV DC charging delivers ₹4.50–₹7.00/kWh gross spread over commercial DISCOM tariffs.\n- **Site Strategy:** For ${context?.activeSiteName || "this corridor"}, a hybrid COCO/CODO model with 2x 120kW CCS2 DC Fast Chargers and a 200kg/day CNG cascade provides optimal payback (<3.8 years).`,
        isFallback: true,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    res.json({ text: response.text || "Response generated.", isFallback: false });
  } catch (error: any) {
    console.error("AI Copilot error:", error);
    res.status(500).json({ error: error.message || "Failed to query copilot" });
  }
});

function generateDeterministicMemo(site: any, forecourt: any, financials: any, traffic: any, _demographics: any, cannibalization: any) {
  return `# INVESTMENT COMMITTEE UNDERWRITING MEMO (IC-MEMO-${new Date().getFullYear()}/${site?.id || "IND-01"})

## 1. EXECUTIVE SUMMARY & STRATEGIC RECOMMENDATION
**Recommendation:** **UNCONDITIONAL APPROVAL (GREEN TIER-1)**
The Network Planning Committee hereby recommends sanctioning **₹${financials?.capexCr || "4.85"} Crores CAPEX** for the development of a flagship multi-fuel forecourt along **${site?.corridor || "NH-48 Corridor"}** (${site?.name || "Candidate Location"}).

### Key Investment Highlights:
- **Project IRR:** **${financials?.projectIRR || "21.8"}%** (vs Hurdle Rate of 14.5%)
- **Payback Horizon:** **${financials?.paybackYears || "3.7"} Years**
- **10-Year NPV (@ 11% Discount Rate):** **₹${financials?.npvCr || "5.65"} Crores**
- **Underwriting Deficit Score:** **${site?.deficitScore || 88}/100** (High unmet highway demand)
- **AADT Corridor Capture:** Projected **${traffic?.dailyFootfall?.toLocaleString("en-IN") || "1,280"} vehicles/day** from ${traffic?.aadt?.toLocaleString("en-IN") || "38,000"} AADT.

---

## 2. FORECOURT & MULTI-FUEL ASSET ALLOCATION
- **High-Speed Diesel (HSD):** ${forecourt?.hsdDUs || 6} Multi-Product Dispensers with dedicated heavy commercial vehicle (HCV) bays.
- **Motor Spirit (Petrol / XP95):** ${forecourt?.msDUs || 4} nozzles serving private 4W passenger vehicles.
- **Alternative Energy (CNG/CBG):** 2 Booster Compressor Cascades (2,500 kg/day capacity) connected to City Gas Distribution network.
- **EV Fast Charging Oasis:** 2x 120kW Dual-Gun CCS2 DC Fast Chargers backed by a dedicated 250 kVA DISCOM transformer.
- **Highway Retailing & C-Store:** Integrated Highway Nest (Mini) food court, Haldiram's express counter, 24x7 clean sanitised washroom block, and truck driver dormitory.

---

## 3. CANNIBALIZATION & SISTER NETWORK GOVERNANCE
- **Nearest Sister OMC Outlet:** ${cannibalization?.nearestKm || 4.5} km away.
- **Estimated Volume Diversion:** ${cannibalization?.volumeDiversion || 11.5}% (Within acceptable OMC threshold of 15%).
- **Net Incremental Volume:** 88.5% represents new captured traffic originating from long-distance intercity freight and tourist corridors.

---

## 4. STATUTORY CLEARANCES & IRC:12 NORMS
- **NHAI Access Approval:** Conforms to IRC:12:2009 guidelines with 100m acceleration lane and 70m deceleration lane.
- **PESO License Status:** Class A, B & C petroleum storage permissions under Petroleum Rules 2002.
- **State PCB:** Consent to Establish (CTE) granted with zero liquid discharge (ZLD) effluent treatment plant (ETP).

---

## 5. COMMITTEE SIGN-OFF & SANCTION
*Approved for Phase-1 Land Acquisition and Civil Works Disbursement.*`;
}

// Vite integration / Static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UrjaGrid server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
