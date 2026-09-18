import React, { useState, useMemo } from "react";
import { 
  ActiveTab, 
  WhiteSpotSite, 
  ExistingOutlet, 
  FuelBrand, 
  ForecourtConfig 
} from "./types";
import { 
  WHITE_SPOT_SITES, 
  EXISTING_OUTLETS, 
  DEFAULT_FORECOURT_CONFIG 
} from "./data/mockDatabase";
import { 
  calculateTrafficOutputs, 
  calculateFinancials 
} from "./utils/calculations";
import { LocationAnalysisResult } from "./services/geoIntelligence";

// Sub-components
import { Navbar } from "./components/Navbar";
import { SpatialMapExplorer } from "./components/SpatialMapExplorer";
import { MarketShareAnalytics } from "./components/MarketShareAnalytics";
import { FootfallFleetIntelligence } from "./components/FootfallFleetIntelligence";
import { ExecutiveOverview } from "./components/ExecutiveOverview";
import { ForecourtConfigurator } from "./components/ForecourtConfigurator";
import { CatchmentDemographics } from "./components/CatchmentDemographics";
import { FootfallPCUFlow } from "./components/FootfallPCUFlow";
import { CannibalizationSimulator } from "./components/CannibalizationSimulator";
import { FinancialUnderwriting } from "./components/FinancialUnderwriting";
import { StatutoryRiskMatrix } from "./components/StatutoryRiskMatrix";
import { AICopilotMemo } from "./components/AICopilotMemo";

export const App: React.FC = () => {
  // Navigation state (Default focused on interactive Spatial Map)
  const [activeTab, setActiveTab] = useState<ActiveTab>("spatial_map");
  
  // Sites state (with support for dynamically pinned custom sites)
  const [sites, setSites] = useState<WhiteSpotSite[]>(WHITE_SPOT_SITES);
  const [activeSite, setActiveSite] = useState<WhiteSpotSite>(WHITE_SPOT_SITES[0]);
  const [existingOutlets, setExistingOutlets] = useState<ExistingOutlet[]>(EXISTING_OUTLETS);

  // Live Location Analysis Result (shared across Map, Market Share, and Footfall tabs)
  const [analyzedLocation, setAnalyzedLocation] = useState<LocationAnalysisResult | null>(null);

  // Filters & Configurations
  const [selectedBrand, setSelectedBrand] = useState<FuelBrand | "All_OMCs">("All_OMCs");
  const [captureRate, setCaptureRate] = useState<number>(3.2); // 3.2% default corridor capture
  const [forecourtConfig, setForecourtConfig] = useState<ForecourtConfig>(DEFAULT_FORECOURT_CONFIG);

  // Sync forecourt format default when active site changes
  const handleSelectSite = (site: WhiteSpotSite) => {
    setActiveSite(site);
    setForecourtConfig((prev) => ({
      ...prev,
      format: site.recommendedFormat,
    }));
  };

  // Add custom pinned candidate site
  const handleAddCustomSite = (newSite: WhiteSpotSite) => {
    setSites((prev) => [newSite, ...prev]);
    setActiveSite(newSite);
  };

  // Calculate dynamic Traffic & Footfall outputs
  const trafficOutputs = useMemo(() => {
    return calculateTrafficOutputs(
      activeSite.aadtTraffic,
      activeSite.pcuEquivalent,
      captureRate,
      activeSite.demographics.fleetMix
    );
  }, [activeSite, captureRate]);

  // Calculate dynamic 10-Year Financial Underwriting Model
  const financialModel = useMemo(() => {
    return calculateFinancials(
      activeSite,
      forecourtConfig,
      trafficOutputs.monthlyFuelKL,
      trafficOutputs.dailyCNGKg,
      trafficOutputs.dailyEVKwh,
      forecourtConfig.format
    );
  }, [activeSite, forecourtConfig, trafficOutputs]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-purple-600 selection:text-white flex flex-col">
      {/* Top Navigation & Status Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        sites={sites}
        activeSite={activeSite}
        setActiveSite={handleSelectSite}
        totalCapexCr={financialModel.totalCapexCr}
        projectIRR={financialModel.projectIRR}
        paybackYears={financialModel.paybackYears}
      />

      {/* Main Content Area based on Active Tab */}
      <main className={`flex-1 ${activeTab === "spatial_map" ? "overflow-hidden flex flex-col" : "pb-12"}`}>
        {/* TAB 1: INTERACTIVE SPATIAL MAP & COMPETITOR LOCATOR */}
        {activeTab === "spatial_map" && (
          <SpatialMapExplorer
            sites={sites}
            existingOutlets={existingOutlets}
            activeSite={activeSite}
            setActiveSite={handleSelectSite}
            onAddCustomSite={handleAddCustomSite}
            selectedBrand={selectedBrand}
            setActiveTab={setActiveTab}
            analyzedLocation={analyzedLocation}
            setAnalyzedLocation={setAnalyzedLocation}
          />
        )}

        {/* TAB 2: LIVE MARKET SHARE & COMPETITOR ANALYTICS */}
        {activeTab === "market_share" && (
          <MarketShareAnalytics
            activeSite={activeSite}
            analysis={analyzedLocation}
            selectedBrand={selectedBrand}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TAB 3: FOOTFALL, PCU FLOW & FLEET INTELLIGENCE */}
        {activeTab === "footfall_fleet" && (
          <FootfallFleetIntelligence
            activeSite={activeSite}
            analysis={analyzedLocation}
            traffic={trafficOutputs}
            captureRate={captureRate}
            setCaptureRate={setCaptureRate}
            setActiveTab={setActiveTab}
          />
        )}

        {/* SECONDARY UNDERWRITING & ENGINE VIEWS */}
        {activeTab === "overview" && (
          <ExecutiveOverview
            sites={sites}
            activeSite={activeSite}
            setActiveSite={handleSelectSite}
            setActiveTab={setActiveTab}
            selectedBrand={selectedBrand}
            totalCapexCr={financialModel.totalCapexCr}
            projectIRR={financialModel.projectIRR}
            equityIRR={financialModel.equityIRR}
            paybackYears={financialModel.paybackYears}
            npvCr={financialModel.tenYearNPVCr}
            monthlyFuelKL={trafficOutputs.monthlyFuelKL}
            dailyEVKwh={trafficOutputs.dailyEVKwh}
          />
        )}

        {activeTab === "forecourt_config" && (
          <ForecourtConfigurator
            config={forecourtConfig}
            setConfig={setForecourtConfig}
            activeSite={activeSite}
          />
        )}

        {activeTab === "catchment_engine" && (
          <CatchmentDemographics activeSite={activeSite} />
        )}

        {activeTab === "traffic_pcu" && (
          <FootfallPCUFlow
            activeSite={activeSite}
            traffic={trafficOutputs}
            captureRate={captureRate}
            setCaptureRate={setCaptureRate}
          />
        )}

        {activeTab === "cannibalization" && (
          <CannibalizationSimulator
            activeSite={activeSite}
            existingOutlets={existingOutlets}
            selectedBrand={selectedBrand}
            monthlyFuelKL={trafficOutputs.monthlyFuelKL}
          />
        )}

        {activeTab === "financial_underwriting" && (
          <FinancialUnderwriting
            activeSite={activeSite}
            allSites={sites}
            setActiveSite={handleSelectSite}
            finances={financialModel}
            forecourt={forecourtConfig}
          />
        )}

        {activeTab === "statutory_matrix" && (
          <StatutoryRiskMatrix activeSite={activeSite} />
        )}

        {activeTab === "ai_memo" && (
          <AICopilotMemo
            activeSite={activeSite}
            forecourt={forecourtConfig}
            finances={financialModel}
            selectedBrand={selectedBrand}
          />
        )}
      </main>

      {/* Footer Bar (Purple & Crisp White) */}
      <footer className="border-t border-purple-200 bg-white py-2.5 px-4 text-center text-xs text-purple-900 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse"></span>
          <span className="font-bold text-purple-950">UrjaGrid Bharat Location Intelligence Platform &copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-purple-800 font-mono font-medium">
          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-950 font-bold border border-purple-200">Geoapify Live API</span>
          <span>OpenStreetMap &bull; Overpass</span>
          <span>NHAI FASTag &bull; PESO IRC:12</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
