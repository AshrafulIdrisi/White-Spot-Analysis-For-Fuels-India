import {
  WhiteSpotSite,
  ForecourtConfig,
  FinancialModelInputs,
  FinancialSummaryMetrics,
  CashFlowYear,
  TrafficModelOutputs,
  CannibalizationResult,
  ExistingOutlet,
} from "../types";

/**
 * Calculates Diurnal 24-Hour Commuter & Freight Traffic Flow
 */
export function calculateTrafficAndThroughput(
  site: WhiteSpotSite,
  _forecourt: ForecourtConfig,
  captureRatePct: number = 3.2
): TrafficModelOutputs {
  const aadt = site.aadtTraffic;
  const pcu = site.pcuEquivalent;
  const captureRate = Math.max(0.5, Math.min(15, captureRatePct));

  // Daily vehicles captured
  const dailyFootfall = Math.round((aadt * captureRate) / 100);

  const f2w = site.demographics.fleetMix.twoWheeler / 100;
  const f4w = site.demographics.fleetMix.fourWheeler / 100;
  const fHcv = site.demographics.fleetMix.commercialHCV / 100;

  const daily2W = Math.round(dailyFootfall * f2w);
  const daily4W = Math.round(dailyFootfall * f4w);
  const dailyHCV = Math.round(dailyFootfall * fHcv);

  // Fuel volumetric calculation:
  // 2W: ~3.5 L avg fill (100% MS)
  // 4W: ~22 L avg fill (60% MS, 25% HSD, 10% CNG, 5% EV)
  // HCV: ~110 L avg fill (95% HSD, 5% CNG/CBG)
  const msLitresFrom2W = daily2W * 3.5;
  const msLitresFrom4W = daily4W * 0.60 * 24.0;
  const totalDailyMSLitres = msLitresFrom2W + msLitresFrom4W;
  const dailyMSKL = totalDailyMSLitres / 1000;

  const hsdLitresFrom4W = daily4W * 0.25 * 32.0;
  const hsdLitresFromHCV = dailyHCV * 0.95 * 115.0;
  const totalDailyHSDLitres = hsdLitresFrom4W + hsdLitresFromHCV;
  const dailyHSDKL = totalDailyHSDLitres / 1000;

  // CNG: 4W (~7 kg) + HCV/LCV (~25 kg)
  const cngFrom4W = daily4W * 0.12 * 7.5;
  const cngFromHCV = dailyHCV * 0.05 * 28.0;
  const dailyCNGKg = Math.round(cngFrom4W + cngFromHCV + (site.cngPotentialKgDay * (captureRate / 3.2)));

  // EV: 4W (~22 kWh) + 2W/Commercial (~12 kWh)
  const evFrom4W = daily4W * 0.08 * 28.0;
  const evFromOther = daily2W * 0.05 * 4.0;
  const dailyEVKwh = Math.round(evFrom4W + evFromOther + (site.evPotentialKwhDay * (captureRate / 3.2)));

  const monthlyFuelKL = Math.round((dailyMSKL + dailyHSDKL) * 30);

  // 24-Hour Diurnal Curve distribution
  // AM rush (07:00-10:00), Midday freight (12:00-15:00), PM surge (17:00-21:00), Late-night HCV surge (23:00-04:00)
  const hourlyProfile = [
    { hour: "00:00", pct: 3.2, hsdShare: 75 },
    { hour: "01:00", pct: 2.8, hsdShare: 80 },
    { hour: "02:00", pct: 2.5, hsdShare: 85 },
    { hour: "03:00", pct: 2.4, hsdShare: 82 },
    { hour: "04:00", pct: 2.8, hsdShare: 78 },
    { hour: "05:00", pct: 3.5, hsdShare: 65 },
    { hour: "06:00", pct: 4.2, hsdShare: 50 },
    { hour: "07:00", pct: 5.8, hsdShare: 35 },
    { hour: "08:00", pct: 7.2, hsdShare: 28 },
    { hour: "09:00", pct: 6.8, hsdShare: 30 },
    { hour: "10:00", pct: 5.4, hsdShare: 38 },
    { hour: "11:00", pct: 4.8, hsdShare: 45 },
    { hour: "12:00", pct: 4.6, hsdShare: 52 },
    { hour: "13:00", pct: 4.5, hsdShare: 55 },
    { hour: "14:00", pct: 4.4, hsdShare: 54 },
    { hour: "15:00", pct: 4.8, hsdShare: 48 },
    { hour: "16:00", pct: 5.2, hsdShare: 42 },
    { hour: "17:00", pct: 6.9, hsdShare: 32 },
    { hour: "18:00", pct: 7.6, hsdShare: 28 },
    { hour: "19:00", pct: 7.1, hsdShare: 32 },
    { hour: "20:00", pct: 5.6, hsdShare: 42 },
    { hour: "21:00", pct: 4.5, hsdShare: 52 },
    { hour: "22:00", pct: 3.9, hsdShare: 64 },
    { hour: "23:00", pct: 3.5, hsdShare: 72 },
  ];

  const diurnalCurve = hourlyProfile.map((item) => {
    const hourlyPcu = Math.round((pcu * item.pct) / 100);
    const hourlyFootfall = Math.round((dailyFootfall * item.pct) / 100);
    return {
      hour: item.hour,
      trafficPct: item.pct,
      pcuVolume: hourlyPcu,
      footfall: hourlyFootfall,
      hsdShare: item.hsdShare,
    };
  });

  return {
    aadt,
    pcu,
    captureRate,
    dailyFootfall,
    daily2WFootfall: daily2W,
    daily4WFootfall: daily4W,
    dailyHCVFootfall: dailyHCV,
    dailyMSKL,
    dailyHSDKL,
    dailyCNGKg,
    dailyEVKwh,
    monthlyFuelKL,
    diurnalCurve,
  };
}

/**
 * Calculates 10-Year Discounted Cash Flow and Financial Underwriting Metrics
 */
export function calculateFinancialModel(
  site: WhiteSpotSite,
  forecourt: ForecourtConfig,
  traffic: TrafficModelOutputs,
  inputs: FinancialModelInputs
): { cashFlows: CashFlowYear[]; metrics: FinancialSummaryMetrics } {
  // CAPEX Calculation in INR Crores
  const landCapex = inputs.landCostType === "Outright_Purchase" ? inputs.landCapexCr : 0.25; // Stamp duty / advance
  const civilWorks = inputs.civilWorksCr;
  const tanksAndCanopy = inputs.tanksAndCanopyCr;
  const mpdEquipment = inputs.mpdEquipmentCr;
  const evSubstation = inputs.evChargersAndSubstationCr;
  const cStoreBuilding = inputs.cStoreBuildingCr;
  const pesoNhaiLakhs = inputs.pesoAndNhaiFeesLakhs / 100;

  const totalCapexCr = Number((landCapex + civilWorks + tanksAndCanopy + mpdEquipment + evSubstation + cStoreBuilding + pesoNhaiLakhs).toFixed(3));
  const debtAmountCr = Number(((totalCapexCr * inputs.debtRatioPercent) / 100).toFixed(3));
  const equityInvestmentCr = Number((totalCapexCr - debtAmountCr).toFixed(3));

  // Base Year Monthly Volumes
  const baseMonthlyFuelKL = traffic.monthlyFuelKL;
  const baseMonthlyCNGKg = traffic.dailyCNGKg * 30;
  const baseMonthlyEVKwh = traffic.dailyEVKwh * 30;

  const msShare = traffic.dailyMSKL / (traffic.dailyMSKL + traffic.dailyHSDKL || 1);
  const hsdShare = 1 - msShare;

  // Monthly Loan EMI calculation for debt service
  const annualInterestRate = inputs.debtInterestRatePercent / 100;
  const monthlyRate = annualInterestRate / 12;
  const totalMonths = inputs.debtTenureYears * 12;
  const principalRupees = debtAmountCr * 10000000;
  
  let monthlyEmiRupees = 0;
  if (debtAmountCr > 0 && monthlyRate > 0) {
    monthlyEmiRupees = (principalRupees * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  }
  const annualDebtServiceLakhs = (monthlyEmiRupees * 12) / 100000;

  const cashFlows: CashFlowYear[] = [];
  let cumulativeCashFlowLakhs = -equityInvestmentCr * 100; // In Lakhs
  let paybackPeriodYears = 10;
  let paybackFound = false;

  const discountRate = inputs.discountRatePercent / 100;
  let npvLakhs = -totalCapexCr * 100;

  const totalDebtServiceOverTenure: number[] = [];
  const totalEbitdaOverTenure: number[] = [];

  for (let year = 1; year <= 10; year++) {
    // Growth factors: Fuel 3.5% yr, CNG 5.0% yr, EV 18.0% yr (India EV ramp-up)
    const fuelGrowth = Math.pow(1 + 0.035, year - 1);
    const cngGrowth = Math.pow(1 + 0.05, year - 1);
    const evGrowth = Math.pow(1 + 0.16, year - 1);
    const inflation = Math.pow(1 + inputs.inflationEscalationPercent / 100, year - 1);

    const yrFuelKL = baseMonthlyFuelKL * 12 * fuelGrowth;
    const yrCNGKg = baseMonthlyCNGKg * 12 * cngGrowth;
    const yrEVKwh = baseMonthlyEVKwh * 12 * evGrowth;

    // Fuel Margins in INR Lakhs
    const yrMSLitres = yrFuelKL * msShare * 1000;
    const yrHSDLitres = yrFuelKL * hsdShare * 1000;
    const msMarginLakhs = (yrMSLitres * inputs.msDealerMarginPerLitre) / 100000;
    const hsdMarginLakhs = (yrHSDLitres * inputs.hsdDealerMarginPerLitre) / 100000;
    const fuelGrossMarginLakhs = msMarginLakhs + hsdMarginLakhs;

    // CNG Margin in INR Lakhs
    const cngGrossMarginLakhs = (yrCNGKg * inputs.cngMarginPerKg) / 100000;

    // EV Gross Margin (Spread between tariff and DISCOM power cost)
    const evSpreadPerKwh = Math.max(1, inputs.evChargeTariffPerKwh - inputs.discomPowerCostPerKwh);
    const evGrossMarginLakhs = (yrEVKwh * evSpreadPerKwh) / 100000;

    // C-Store / QSR Non-fuel retail revenue
    const cStoreAnnualTurnover = inputs.cStoreMonthlyTurnoverLakhs * 12 * inflation;
    const cStoreGrossRevenueLakhs = (cStoreAnnualTurnover * inputs.cStoreRentalSharePercent) / 100;

    const totalRevenueLakhs = fuelGrossMarginLakhs + cngGrossMarginLakhs + evGrossMarginLakhs + cStoreGrossRevenueLakhs;

    // OPEX Breakdown in Lakhs
    const staffCostAnnual = (inputs.staffCount * inputs.averageSalaryMonthly * 12) / 100000 * inflation;
    const electricityAnnual = inputs.electricityMonthlyLakhs * 12 * inflation;
    const maintenanceAnnual = inputs.maintenanceMonthlyLakhs * 12 * inflation;
    const marketingMiscAnnual = inputs.marketingAndMiscMonthlyLakhs * 12 * inflation;
    const landLeaseAnnual = inputs.landCostType === "Lease" ? inputs.annualLandLeaseLakhs * inflation : 0;

    const opexLakhs = staffCostAnnual + electricityAnnual + maintenanceAnnual + marketingMiscAnnual + landLeaseAnnual;

    const ebitdaLakhs = totalRevenueLakhs - opexLakhs;
    const debtServiceLakhs = year <= inputs.debtTenureYears ? annualDebtServiceLakhs : 0;

    // Depreciation (~10% straight line on equipment)
    const depreciationLakhs = (civilWorks + tanksAndCanopy + mpdEquipment + evSubstation + cStoreBuilding) * 10;
    const pbtLakhs = Math.max(0, ebitdaLakhs - depreciationLakhs - (debtServiceLakhs * 0.4)); // Tax shelter for interest
    const taxLakhs = pbtLakhs * 0.25; // 25% Indian corporate tax

    const freeCashFlowLakhs = ebitdaLakhs - debtServiceLakhs - taxLakhs;
    cumulativeCashFlowLakhs += freeCashFlowLakhs;

    if (!paybackFound && cumulativeCashFlowLakhs >= 0) {
      paybackPeriodYears = Number((year - 1 + (Math.abs(cumulativeCashFlowLakhs - freeCashFlowLakhs) / freeCashFlowLakhs)).toFixed(1));
      paybackFound = true;
    }

    const discountedFactor = Math.pow(1 + discountRate, year);
    const discountedCashFlowLakhs = freeCashFlowLakhs / discountedFactor;
    npvLakhs += discountedCashFlowLakhs;

    if (debtServiceLakhs > 0) {
      totalDebtServiceOverTenure.push(debtServiceLakhs);
      totalEbitdaOverTenure.push(ebitdaLakhs);
    }

    cashFlows.push({
      year,
      fuelVolumeKL: Math.round(yrFuelKL),
      cngVolumeKg: Math.round(yrCNGKg),
      evUnitsKwh: Math.round(yrEVKwh),
      fuelGrossMarginLakhs: Number(fuelGrossMarginLakhs.toFixed(2)),
      cngGrossMarginLakhs: Number(cngGrossMarginLakhs.toFixed(2)),
      evGrossMarginLakhs: Number(evGrossMarginLakhs.toFixed(2)),
      cStoreGrossRevenueLakhs: Number(cStoreGrossRevenueLakhs.toFixed(2)),
      totalRevenueLakhs: Number(totalRevenueLakhs.toFixed(2)),
      opexLakhs: Number(opexLakhs.toFixed(2)),
      ebitdaLakhs: Number(ebitdaLakhs.toFixed(2)),
      debtServiceLakhs: Number(debtServiceLakhs.toFixed(2)),
      taxLakhs: Number(taxLakhs.toFixed(2)),
      freeCashFlowLakhs: Number(freeCashFlowLakhs.toFixed(2)),
      cumulativeCashFlowLakhs: Number(cumulativeCashFlowLakhs.toFixed(2)),
      discountedCashFlowLakhs: Number(discountedCashFlowLakhs.toFixed(2)),
    });
  }

  // Calculate Project IRR via Newton-Raphson approximation
  const projectCashStreams = [-totalCapexCr * 100, ...cashFlows.map((c) => c.ebitdaLakhs - c.taxLakhs)];
  const projectIRR = calculateIRR(projectCashStreams);

  // Calculate Equity IRR
  const equityCashStreams = [-equityInvestmentCr * 100, ...cashFlows.map((c) => c.freeCashFlowLakhs)];
  const equityIRR = calculateIRR(equityCashStreams);

  // Average DSCR
  const avgDscr = totalDebtServiceOverTenure.length > 0
    ? totalEbitdaOverTenure.reduce((a, b) => a + b, 0) / totalDebtServiceOverTenure.reduce((a, b) => a + b, 0)
    : 2.5;

  const yr1Ebitda = cashFlows[0]?.ebitdaLakhs || 0;
  const roiYr3 = ((cashFlows[2]?.freeCashFlowLakhs || 0) / (totalCapexCr * 100)) * 100;

  const metrics: FinancialSummaryMetrics = {
    totalCapexCr,
    equityInvestmentCr,
    debtAmountCr,
    annualEbitdaYr1Lakhs: Number(yr1Ebitda.toFixed(2)),
    projectIRR: Number((projectIRR * 100).toFixed(1)),
    equityIRR: Number((equityIRR * 100).toFixed(1)),
    paybackPeriodYears: Number(paybackPeriodYears.toFixed(1)),
    npvCr: Number((npvLakhs / 100).toFixed(2)),
    averageDSCR: Number(avgDscr.toFixed(2)),
    roiYear3Percent: Number(roiYr3.toFixed(1)),
  };

  return { cashFlows, metrics };
}

/**
 * Newton-Raphson Internal Rate of Return (IRR) Calculator
 */
function calculateIRR(cashFlows: number[], guess: number = 0.15): number {
  let rate = guess;
  const maxIterations = 100;
  const tolerance = 0.00001;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const denom = Math.pow(1 + rate, t);
      npv += cashFlows[t] / denom;
      if (t > 0) {
        dNpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    if (dNpv === 0) break;
    const newRate = rate - npv / dNpv;
    if (isNaN(newRate) || !isFinite(newRate)) break;
    rate = newRate;
  }

  return Math.max(0.05, Math.min(0.65, rate));
}

/**
 * Calculates Distance-Decay Cannibalization on Sister Outlets
 */
export function calculateCannibalizationImpact(
  candidateSite: WhiteSpotSite,
  existingOutlets: ExistingOutlet[],
  selectedBrand: string = "IOCL",
  radiusKm: number = 10
): CannibalizationResult {
  const grossNewVolume = candidateSite.projectedMonthlyKL;

  // Filter sister outlets of same brand or OMC network within radius
  const nearbySisterOutlets = existingOutlets
    .filter((o) => {
      // Calculate haversine distance
      const dist = calculateHaversineDistance(candidateSite.lat, candidateSite.lng, o.lat, o.lng);
      return dist <= radiusKm;
    })
    .map((outlet) => {
      const distanceKm = calculateHaversineDistance(candidateSite.lat, candidateSite.lng, outlet.lat, outlet.lng);
      
      // Distance decay diversion formula:
      // Within 2km: 22% diversion
      // 2km - 5km: 12% diversion
      // 5km - 10km: 4% diversion
      let diversionPct = 0;
      if (distanceKm <= 2) {
        diversionPct = 22 * (1 - distanceKm / 4);
      } else if (distanceKm <= 5) {
        diversionPct = 14 * (1 - (distanceKm - 2) / 5);
      } else {
        diversionPct = 6 * (1 - (distanceKm - 5) / 5);
      }

      // If sister brand, diversion factor increases
      if (outlet.brand === selectedBrand) {
        diversionPct *= 1.25;
      }

      diversionPct = Math.max(1.5, Math.min(28, Number(diversionPct.toFixed(1))));
      const lostVolumeKL = Math.round((outlet.monthlyKL * diversionPct) / 100);
      const postVolumeKL = Math.max(50, outlet.monthlyKL - lostVolumeKL);

      let dealerGrievanceLevel: "Low" | "Medium" | "High" | "Critical" = "Low";
      if (diversionPct > 18) dealerGrievanceLevel = "Critical";
      else if (diversionPct > 12) dealerGrievanceLevel = "High";
      else if (diversionPct > 7) dealerGrievanceLevel = "Medium";

      return {
        id: outlet.id,
        name: outlet.name,
        brand: outlet.brand,
        distanceKm: Number(distanceKm.toFixed(1)),
        currentVolumeKL: outlet.monthlyKL,
        diversionPct,
        lostVolumeKL,
        postVolumeKL,
        dealerGrievanceLevel,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const totalCannibalizedKL = nearbySisterOutlets.reduce((acc, curr) => acc + curr.lostVolumeKL, 0);
  const netIncrementalVolumeKL = Math.max(100, grossNewVolume - totalCannibalizedKL * 0.65);
  const netNewRatioPct = Number(((netIncrementalVolumeKL / grossNewVolume) * 100).toFixed(1));

  let dealerProtectionAdvice = "Territory is well-isolated. Minimal risk of dealer litigation or grievance committee petition.";
  if (nearbySisterOutlets.some((o) => o.dealerGrievanceLevel === "Critical")) {
    dealerProtectionAdvice = "High risk of protected territorial dispute with dealer within 3km. Recommend COCO format or dealer equity participation.";
  } else if (nearbySisterOutlets.some((o) => o.dealerGrievanceLevel === "High")) {
    dealerProtectionAdvice = "Moderate dealer overlap. Ensure Highway service differentiation (EV supercharger & branded QSR) to capture through-traffic.";
  }

  return {
    sisterOutlets: nearbySisterOutlets,
    totalCannibalizedKL,
    grossNewVolumeKL: grossNewVolume,
    netIncrementalVolumeKL: Math.round(netIncrementalVolumeKL),
    netNewRatioPct,
    dealerProtectionAdvice,
  };
}

/**
 * Great-circle distance between two coordinates in Kilometers
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Universal calculation wrapper for Traffic Outputs
 */
export function calculateTrafficOutputs(
  aadt: number,
  pcu: number,
  captureRate: number,
  fleetMix: { twoWheeler: number; fourWheeler: number; commercialHCV: number }
): TrafficModelOutputs {
  const dailyFootfall = Math.round((aadt * captureRate) / 100);
  const f2w = fleetMix.twoWheeler / 100;
  const f4w = fleetMix.fourWheeler / 100;
  const fHcv = fleetMix.commercialHCV / 100;

  const daily2W = Math.round(dailyFootfall * f2w);
  const daily4W = Math.round(dailyFootfall * f4w);
  const dailyHCV = Math.round(dailyFootfall * fHcv);

  const msLitresFrom2W = daily2W * 3.5;
  const msLitresFrom4W = daily4W * 0.6 * 24.0;
  const totalDailyMSLitres = msLitresFrom2W + msLitresFrom4W;
  const dailyMSKL = Number((totalDailyMSLitres / 1000).toFixed(2));

  const hsdLitresFrom4W = daily4W * 0.25 * 32.0;
  const hsdLitresFromHCV = dailyHCV * 0.95 * 115.0;
  const totalDailyHSDLitres = hsdLitresFrom4W + hsdLitresFromHCV;
  const dailyHSDKL = Number((totalDailyHSDLitres / 1000).toFixed(2));

  const dailyCNGKg = Math.round(daily4W * 0.12 * 7.5 + dailyHCV * 0.05 * 28.0 + (3000 * (captureRate / 3.2)));
  const dailyEVKwh = Math.round(daily4W * 0.08 * 28.0 + daily2W * 0.05 * 4.0 + (2800 * (captureRate / 3.2)));
  const monthlyFuelKL = Math.round((dailyMSKL + dailyHSDKL) * 30);

  const hourlyProfile = [
    { hour: "00:00", pct: 3.2, hsdShare: 75 },
    { hour: "01:00", pct: 2.8, hsdShare: 80 },
    { hour: "02:00", pct: 2.5, hsdShare: 85 },
    { hour: "03:00", pct: 2.4, hsdShare: 82 },
    { hour: "04:00", pct: 2.8, hsdShare: 78 },
    { hour: "05:00", pct: 3.5, hsdShare: 65 },
    { hour: "06:00", pct: 4.2, hsdShare: 50 },
    { hour: "07:00", pct: 5.8, hsdShare: 35 },
    { hour: "08:00", pct: 7.2, hsdShare: 28 },
    { hour: "09:00", pct: 6.8, hsdShare: 30 },
    { hour: "10:00", pct: 5.4, hsdShare: 38 },
    { hour: "11:00", pct: 4.8, hsdShare: 45 },
    { hour: "12:00", pct: 4.6, hsdShare: 52 },
    { hour: "13:00", pct: 4.5, hsdShare: 55 },
    { hour: "14:00", pct: 4.4, hsdShare: 54 },
    { hour: "15:00", pct: 4.8, hsdShare: 48 },
    { hour: "16:00", pct: 5.2, hsdShare: 42 },
    { hour: "17:00", pct: 6.9, hsdShare: 32 },
    { hour: "18:00", pct: 7.6, hsdShare: 28 },
    { hour: "19:00", pct: 7.1, hsdShare: 32 },
    { hour: "20:00", pct: 5.6, hsdShare: 42 },
    { hour: "21:00", pct: 4.5, hsdShare: 52 },
    { hour: "22:00", pct: 3.9, hsdShare: 64 },
    { hour: "23:00", pct: 3.5, hsdShare: 72 },
  ];

  const diurnalCurve = hourlyProfile.map((item) => ({
    hour: item.hour,
    trafficPct: item.pct,
    pcuVolume: Math.round((pcu * item.pct) / 100),
    footfall: Math.round((dailyFootfall * item.pct) / 100),
    hsdShare: item.hsdShare,
  }));

  return {
    aadt,
    pcu,
    captureRate,
    dailyFootfall,
    daily2WFootfall: daily2W,
    daily4WFootfall: daily4W,
    dailyHCVFootfall: dailyHCV,
    dailyMSKL,
    dailyHSDKL,
    dailyCNGKg,
    dailyEVKwh,
    monthlyFuelKL,
    diurnalCurve,
  };
}

/**
 * Universal calculation wrapper for Financial Underwriting Model
 */
export function calculateFinancials(
  site: WhiteSpotSite,
  forecourt: ForecourtConfig,
  monthlyFuelKL: number,
  dailyCNGKg: number,
  dailyEVKwh: number,
  format: string
): import("../types").FinancialModel {
  // Capex calculation in Lakhs
  const baseCivil = 145;
  const canopyPaving = 120 + (forecourt.msDUs + forecourt.hsdDUs) * 5;
  const dispensersAutomation = (forecourt.msDUs + forecourt.hsdDUs) * 12 + 25;
  const tanksPiping = forecourt.tankCapacityMS_KL * 0.8 + forecourt.tankCapacityHSD_KL * 0.8;
  const evChargers = forecourt.evChargersCount * (forecourt.evChargerKw >= 180 ? 48 : 32) + 25;
  const cngPackage = forecourt.cngCascades * 38;
  const commercialBuilding = forecourt.amenities.haldiramsExpress || forecourt.amenities.mcdonaldsDriveThru ? 95 : 55;
  const statutoryFees = 18;

  const totalCapexLakhs = baseCivil + canopyPaving + dispensersAutomation + tanksPiping + evChargers + cngPackage + commercialBuilding + statutoryFees;
  const totalCapexCr = Number((totalCapexLakhs / 100).toFixed(2));

  // Annual Opex in Lakhs
  const electricityAnnual = 24.0 + (dailyEVKwh * 365 * 0.04) / 100;
  const staffSalaries = 28.0;
  const maintenance = 12.0;
  const landLease = format === "DODO" ? 0 : 18.0;
  const insuranceAdmin = 6.5;

  const annualOpexLakhs = electricityAnnual + staffSalaries + maintenance + landLease + insuranceAdmin;

  // DCF 10-Year Model
  const tenYearDCF: Array<{
    year: number;
    fuelKL: number;
    evKwhDay: number;
    grossRevenueLakhs: number;
    opexLakhs: number;
    ebitdaLakhs: number;
    netCashFlowLakhs: number;
    cumulativeCashFlowLakhs: number;
    discountedCashFlowLakhs: number;
  }> = [];

  let cumulativeCash = -totalCapexLakhs;
  let paybackYears = 10;
  let paybackFound = false;
  let npvLakhs = -totalCapexLakhs;
  const discountRate = 0.105; // 10.5% WACC

  for (let y = 1; y <= 10; y++) {
    const fuelGrowth = Math.pow(1 + 0.035, y - 1);
    const evGrowth = Math.pow(1 + 0.16, y - 1);
    const inflation = Math.pow(1 + 0.045, y - 1);

    const yrFuelKL = Math.round(monthlyFuelKL * 12 * fuelGrowth);
    const yrEVKwhDay = Math.round(dailyEVKwh * evGrowth);

    // Fuel Margin: ~₹3.20/L blend
    const fuelMarginLakhs = (yrFuelKL * 1000 * 3.2) / 100000;
    // CNG Margin: ~₹4.50/kg
    const cngMarginLakhs = (dailyCNGKg * 365 * fuelGrowth * 4.5) / 100000;
    // EV Margin: ~₹7.50/kWh spread
    const evMarginLakhs = (yrEVKwhDay * 365 * 7.5) / 100000;
    // C-Store / QSR Revenue
    const qsrRevenueLakhs = 22.0 * inflation;

    const grossRevenueLakhs = fuelMarginLakhs + cngMarginLakhs + evMarginLakhs + qsrRevenueLakhs;
    const yrOpexLakhs = annualOpexLakhs * inflation;
    const ebitdaLakhs = grossRevenueLakhs - yrOpexLakhs;
    const taxLakhs = Math.max(0, ebitdaLakhs * 0.22);
    const netCashFlowLakhs = ebitdaLakhs - taxLakhs;

    cumulativeCash += netCashFlowLakhs;
    if (!paybackFound && cumulativeCash >= 0) {
      paybackYears = Number((y - 1 + Math.abs(cumulativeCash - netCashFlowLakhs) / netCashFlowLakhs).toFixed(1));
      paybackFound = true;
    }

    const discountedCashFlow = netCashFlowLakhs / Math.pow(1 + discountRate, y);
    npvLakhs += discountedCashFlow;

    tenYearDCF.push({
      year: y,
      fuelKL: yrFuelKL,
      evKwhDay: yrEVKwhDay,
      grossRevenueLakhs: Number(grossRevenueLakhs.toFixed(2)),
      opexLakhs: Number(yrOpexLakhs.toFixed(2)),
      ebitdaLakhs: Number(ebitdaLakhs.toFixed(2)),
      netCashFlowLakhs: Number(netCashFlowLakhs.toFixed(2)),
      cumulativeCashFlowLakhs: Number(cumulativeCash.toFixed(2)),
      discountedCashFlowLakhs: Number(discountedCashFlow.toFixed(2)),
    });
  }

  // Calculate project IRR
  const cashStreams = [-totalCapexLakhs, ...tenYearDCF.map((d) => d.netCashFlowLakhs)];
  const rawIrr = calculateIRR(cashStreams);
  const projectIRR = Number((rawIrr * 100).toFixed(1));
  const equityIRR = Number((projectIRR * 1.22).toFixed(1));

  return {
    totalCapexCr,
    totalCapexLakhs,
    equityIRR,
    projectIRR,
    tenYearNPVCr: Number((npvLakhs / 100).toFixed(2)),
    paybackYears,
    dscrRatio: 2.85,
    annualOpexLakhs: Number(annualOpexLakhs.toFixed(1)),
    capexBreakdown: {
      landDevelopmentAndCivilLakhs: baseCivil,
      canopyAndDrivewayPavingLakhs: canopyPaving,
      dispensersAndAutomationLakhs: dispensersAutomation,
      undergroundTanksAndPipingLakhs: tanksPiping,
      evFastChargersAndHTTransformerLakhs: evChargers,
      cngBoosterPackageLakhs: cngPackage,
      commercialBuildingAndQSRLakhs: commercialBuilding,
      statutoryPESOAndContingencyLakhs: statutoryFees,
    },
    opexBreakdown: {
      electricityAndDemandChargesAnnualLakhs: Number(electricityAnnual.toFixed(1)),
      staffSalariesAndCrewAnnualLakhs: Number(staffSalaries.toFixed(1)),
      maintenanceAndAMCAnnualLakhs: Number(maintenance.toFixed(1)),
      landLeaseOrRoyaltyAnnualLakhs: Number(landLease.toFixed(1)),
      insuranceAndAdminAnnualLakhs: Number(insuranceAdmin.toFixed(1)),
    },
    tenYearDCF,
  };
}

/**
 * Universal calculation wrapper for Cannibalization
 */
export function calculateCannibalization(
  monthlyFuelKL: number,
  sisterDistanceKm: number,
  brand: string
): {
  cannibalizationPercent: number;
  cannibalizedVolumeKL: number;
  netIncrementalVolumeKL: number;
  dealerGrievanceRisk: "Low" | "Moderate" | "High";
  territoryImpactSummary: string;
} {
  let rate = 0;
  if (sisterDistanceKm < 2.0) {
    rate = 24.5 * (1 - sisterDistanceKm / 3.0);
  } else if (sisterDistanceKm < 5.0) {
    rate = 14.0 * (1 - (sisterDistanceKm - 2.0) / 4.0);
  } else {
    rate = Math.max(1.5, 4.0 * (1 - (sisterDistanceKm - 5.0) / 7.0));
  }

  const cannibalizationPercent = Number(Math.max(1.5, Math.min(28.0, rate)).toFixed(1));
  const cannibalizedVolumeKL = Math.round((monthlyFuelKL * cannibalizationPercent) / 100);
  const netIncrementalVolumeKL = Math.max(50, monthlyFuelKL - cannibalizedVolumeKL);

  let dealerGrievanceRisk: "Low" | "Moderate" | "High" = "Low";
  let territoryImpactSummary = `Sister station at ${sisterDistanceKm.toFixed(1)} km exhibits clean highway demarcation with minimal dispute risk.`;

  if (cannibalizationPercent > 16.0) {
    dealerGrievanceRisk = "High";
    territoryImpactSummary = `Sister station within ${sisterDistanceKm.toFixed(1)} km may file territorial protection grievance. Recommend multi-fuel brand differentiation.`;
  } else if (cannibalizationPercent > 8.0) {
    dealerGrievanceRisk = "Moderate";
    territoryImpactSummary = `Moderate catchment overlap with sister dealer within ${sisterDistanceKm.toFixed(1)} km. Position high-speed EV chargers to capture new segment.`;
  }

  return {
    cannibalizationPercent,
    cannibalizedVolumeKL,
    netIncrementalVolumeKL,
    dealerGrievanceRisk,
    territoryImpactSummary,
  };
}

