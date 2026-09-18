/**
 * UrjaGrid - Types and Interfaces for Indian Fuel Retail & EV Network Planning
 */

export type FuelBrand = 
  | "IOCL" // IndianOil
  | "BPCL" // Bharat Petroleum
  | "HPCL" // Hindustan Petroleum
  | "Jio-bp" // Reliance-bp
  | "Nayara" // Nayara Energy (Essar)
  | "Shell" // Shell India
  | "IGL" // Indraprastha Gas Limited (CNG)
  | "MGL" // Mahanagar Gas Limited (CNG)
  | "Adani Total Gas" // Adani Total Gas (CNG)
  | "Torrent Gas" // Torrent Gas (CNG)
  | "GAIL Gas" // GAIL Gas Limited (CNG)
  | "Gujarat Gas" // Gujarat Gas Limited (CNG)
  | "Tata Power" // EV CPO
  | "Statiq" // EV CPO
  | "ChargeZone" // EV CPO
  | "Zeon" // EV CPO
  | "Ather Grid" // EV Fast Charging
  | "Kazam" // EV CPO
  | "WhiteSpot"; // Unmet demand cluster

export type ForecourtFormat = 
  | "COCO" // Company Owned Company Operated
  | "CODO" // Company Owned Dealer Operated
  | "DODO" // Dealer Owned Dealer Operated
  | "Highway_Oasis" // NE-Way Mega Service Plaza with Food Court & Dormitory
  | "Urban_Micro" // High-throughput automated urban infill
  | "CNG_Mother_Station" // High-pressure grid pipeline feeder mother station
  | "CNG_Online_Station" // Direct pipeline connected dispensing station
  | "CNG_Daughter_Booster" // Mobile cascade booster compressor station
  | "EV_Highway_Plaza" // Dedicated 120kW-240kW DC Fast charging plaza
  | "Multi_Fuel_Energy_Hub"; // Integrated MS + HSD + CNG + EV Fast Charging

export type CorridorType = 
  | "Expressway_NE" // National Expressway (e.g. NE-4 Delhi-Mumbai)
  | "National_Highway" // NH (e.g. NH-48, NH-44)
  | "State_Highway" // SH
  | "Urban_Arterial" // Metro Ring Road / Radial Corridor
  | "Industrial_Corridor"; // DMIC / Logistics Belt

export interface WhiteSpotSite {
  id: string;
  name: string;
  corridor: string;
  corridorType: CorridorType;
  state: string;
  district: string;
  lat: number;
  lng: number;
  deficitScore: number; // 0 - 100
  priorityTier: "Tier 1 (Immediate)" | "Tier 2 (High Priority)" | "Tier 3 (Pipeline)";
  aadtTraffic: number; // Annual Average Daily Traffic (Vehicles/day)
  pcuEquivalent: number; // Passenger Car Unit
  evAdoptionScore: number; // 0 - 100 based on RTO & commercial fleet data
  nearestCompetitorKm: number;
  nearestCompetitorBrand: FuelBrand;
  nearestSisterOutletKm: number;
  recommendedFormat: ForecourtFormat;
  defaultCapexCr: number; // in INR Crores
  projectedMonthlyKL: number; // in Kilolitres
  cngPotentialKgDay: number;
  evPotentialKwhDay: number;
  demographics: {
    catchmentPop3km: number;
    catchmentPop5km: number;
    catchmentPop10km: number;
    secMix: { secA: number; secB: number; secC: number }; // %
    fleetMix: { twoWheeler: number; fourWheeler: number; commercialHCV: number }; // %
    nearbyHubs: string[];
    gridSubstationKv: number; // e.g., 11 or 33 kV
    transformerHeadroomKva: number;
  };
  statutory: {
    pesoStatus: "Approved" | "In Review" | "Pending Application" | "NOC Received";
    nhaiIrc12Compliant: boolean;
    dmNocStatus: "Clear" | "In Process" | "Preliminary Review";
    spcbCteStatus: "Obtained" | "Pending Inspection" | "Exempted";
    frontageMeters: number;
    depthMeters: number;
    medianCutDistanceMeters: number;
    highTensionLineClearance: boolean;
  };
}

export interface ExistingOutlet {
  id: string;
  name: string;
  brand: FuelBrand;
  lat: number;
  lng: number;
  corridor: string;
  monthlyKL: number;
  hasCNG: boolean;
  cngCapacityKgDay?: number;
  cngStationType?: "Mother" | "Online" | "Daughter_Booster";
  hasEVFastCharger: boolean;
  evKwCapacity?: number;
  evGunsCount?: number;
  evCpoOperator?: string;
  format: ForecourtFormat;
  state: string;
}

export interface ForecourtConfig {
  format: ForecourtFormat;
  plotWidthM: number;
  plotDepthM: number;
  msDUs: number; // Motor Spirit (Petrol) Dispensing Units (Nozzles = DUs * 2)
  speedPremiumMS: boolean;
  hsdDUs: number; // High-Speed Diesel DUs
  cngCascades: number; // CNG Booster Compressor Bays
  cbgSatatEnabled: boolean; // Compressed Bio-Gas tie in
  evChargersCount: number; // DC Fast Charger Plazas
  evChargerKw: 60 | 120 | 180 | 240; // Dual Gun CCS2
  bharatDc001Count: number; // 15kW/20kW GB/T or Bharat DC
  tankCapacityMS_KL: number;
  tankCapacityHSD_KL: number;
  amenities: {
    highwayNestQSR: boolean;
    haldiramsExpress: boolean;
    chaiPointCafe: boolean;
    mcdonaldsDriveThru: boolean;
    driverDormitory: boolean;
    evLoungeWifi: boolean;
    airWaterTower: boolean;
    cleanWashroomComplex: boolean;
    atmKiosk: boolean;
    lubricantOilBay: boolean;
    nitrogenTyreInflator: boolean;
  };
}

export interface FinancialModelInputs {
  landCostType: "Lease" | "Outright_Purchase";
  landCapexCr: number; // If purchase
  annualLandLeaseLakhs: number; // If lease
  civilWorksCr: number;
  tanksAndCanopyCr: number;
  mpdEquipmentCr: number;
  evChargersAndSubstationCr: number;
  cStoreBuildingCr: number;
  pesoAndNhaiFeesLakhs: number;
  
  // Margins and Tariffs (India Standard)
  msDealerMarginPerLitre: number; // ~ ₹3.85 / L
  hsdDealerMarginPerLitre: number; // ~ ₹2.65 / L
  cngMarginPerKg: number; // ~ ₹4.50 / kg
  evChargeTariffPerKwh: number; // ~ ₹18.00 / kWh billing
  discomPowerCostPerKwh: number; // ~ ₹8.50 / kWh cost
  cStoreMonthlyTurnoverLakhs: number;
  cStoreRentalSharePercent: number; // e.g. 15% revenue share
  
  // OPEX
  staffCount: number;
  averageSalaryMonthly: number;
  electricityMonthlyLakhs: number;
  maintenanceMonthlyLakhs: number;
  marketingAndMiscMonthlyLakhs: number;
  
  // Financing
  debtRatioPercent: number; // e.g. 70%
  debtInterestRatePercent: number; // e.g. 9.5%
  debtTenureYears: number; // e.g. 7 years
  discountRatePercent: number; // e.g. 11.0% WACC
  inflationEscalationPercent: number; // 4.5% annual
}

export interface CashFlowYear {
  year: number;
  fuelVolumeKL: number;
  cngVolumeKg: number;
  evUnitsKwh: number;
  fuelGrossMarginLakhs: number;
  cngGrossMarginLakhs: number;
  evGrossMarginLakhs: number;
  cStoreGrossRevenueLakhs: number;
  totalRevenueLakhs: number;
  opexLakhs: number;
  ebitdaLakhs: number;
  debtServiceLakhs: number;
  taxLakhs: number;
  freeCashFlowLakhs: number;
  cumulativeCashFlowLakhs: number;
  discountedCashFlowLakhs: number;
}

export interface FinancialSummaryMetrics {
  totalCapexCr: number;
  equityInvestmentCr: number;
  debtAmountCr: number;
  annualEbitdaYr1Lakhs: number;
  projectIRR: number; // %
  equityIRR: number; // %
  paybackPeriodYears: number;
  npvCr: number; // ₹ Cr
  averageDSCR: number;
  roiYear3Percent: number;
}

export interface TrafficModelOutputs {
  aadt: number;
  pcu: number;
  captureRate: number; // %
  dailyFootfall: number; // Total vehicles entering forecourt
  daily2WFootfall: number;
  daily4WFootfall: number;
  dailyHCVFootfall: number;
  dailyMSKL: number;
  dailyHSDKL: number;
  dailyCNGKg: number;
  dailyEVKwh: number;
  monthlyFuelKL: number;
  diurnalCurve: { hour: string; trafficPct: number; pcuVolume: number; footfall: number; hsdShare: number }[];
}

export interface CannibalizationResult {
  sisterOutlets: {
    id: string;
    name: string;
    brand: FuelBrand;
    distanceKm: number;
    currentVolumeKL: number;
    diversionPct: number;
    lostVolumeKL: number;
    postVolumeKL: number;
    dealerGrievanceLevel: "Low" | "Medium" | "High" | "Critical";
  }[];
  totalCannibalizedKL: number;
  grossNewVolumeKL: number;
  netIncrementalVolumeKL: number;
  netNewRatioPct: number;
  dealerProtectionAdvice: string;
}

export interface FinancialModel {
  totalCapexCr: number;
  totalCapexLakhs: number;
  equityIRR: number;
  projectIRR: number;
  tenYearNPVCr: number;
  paybackYears: number;
  dscrRatio: number;
  annualOpexLakhs: number;
  capexBreakdown: {
    landDevelopmentAndCivilLakhs: number;
    canopyAndDrivewayPavingLakhs: number;
    dispensersAndAutomationLakhs: number;
    undergroundTanksAndPipingLakhs: number;
    evFastChargersAndHTTransformerLakhs: number;
    cngBoosterPackageLakhs: number;
    commercialBuildingAndQSRLakhs: number;
    statutoryPESOAndContingencyLakhs: number;
  };
  opexBreakdown: {
    electricityAndDemandChargesAnnualLakhs: number;
    staffSalariesAndCrewAnnualLakhs: number;
    maintenanceAndAMCAnnualLakhs: number;
    landLeaseOrRoyaltyAnnualLakhs: number;
    insuranceAndAdminAnnualLakhs: number;
  };
  tenYearDCF: Array<{
    year: number;
    fuelKL: number;
    evKwhDay: number;
    grossRevenueLakhs: number;
    opexLakhs: number;
    ebitdaLakhs: number;
    netCashFlowLakhs: number;
    cumulativeCashFlowLakhs: number;
    discountedCashFlowLakhs: number;
  }>;
}

export type ActiveTab = 
  | "spatial_map"
  | "market_share"
  | "footfall_fleet"
  | "overview"
  | "forecourt_config"
  | "catchment_engine"
  | "traffic_pcu"
  | "cannibalization"
  | "financial_underwriting"
  | "statutory_matrix"
  | "ai_memo";

