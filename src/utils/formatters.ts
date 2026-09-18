/**
 * UrjaGrid Indian Numbering & Currency Utilities
 */

export function formatINR(valueInLakhsOrCrores: number, unit: "Lakhs" | "Crores" | "Rupees" = "Rupees"): string {
  if (isNaN(valueInLakhsOrCrores)) return "₹0";

  if (unit === "Crores") {
    return `₹${valueInLakhsOrCrores.toFixed(2)} Cr`;
  }
  if (unit === "Lakhs") {
    return `₹${valueInLakhsOrCrores.toFixed(2)} Lakhs`;
  }

  // Raw Rupees formatting
  const val = Math.round(valueInLakhsOrCrores);
  if (Math.abs(val) >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(2)} Lakh`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

export function formatIndianNumber(num: number, decimalDigits: number = 0): string {
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-IN", {
    maximumFractionDigits: decimalDigits,
    minimumFractionDigits: decimalDigits,
  });
}

export function formatKL(kilolitres: number): string {
  return `${formatIndianNumber(kilolitres, 1)} KL`;
}

export function formatAADT(traffic: number): string {
  return `${formatIndianNumber(traffic)} AADT`;
}

export function formatPct(val: number, decimals: number = 1): string {
  return `${val.toFixed(decimals)}%`;
}

export const BRAND_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  IOCL: { bg: "bg-orange-600/20", text: "text-orange-400", border: "border-orange-500", hex: "#f97316" }, // IndianOil Saffron/Blue
  BPCL: { bg: "bg-amber-600/20", text: "text-amber-400", border: "border-amber-500", hex: "#f59e0b" }, // BPCL Yellow/Blue
  HPCL: { bg: "bg-red-600/20", text: "text-red-400", border: "border-red-500", hex: "#ef4444" }, // HPCL Red/Blue
  "Jio-bp": { bg: "bg-emerald-600/20", text: "text-emerald-400", border: "border-emerald-500", hex: "#10b981" }, // Jio-bp Green/Blue
  Nayara: { bg: "bg-teal-600/20", text: "text-teal-400", border: "border-teal-500", hex: "#14b8a6" }, // Nayara Teal
  Shell: { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-400", hex: "#eab308" }, // Shell Yellow/Red
  IGL: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-500", hex: "#059669" }, // Indraprastha Gas CNG
  MGL: { bg: "bg-green-600/20", text: "text-green-300", border: "border-green-500", hex: "#16a34a" }, // Mahanagar Gas CNG
  "Adani Total Gas": { bg: "bg-sky-600/20", text: "text-sky-300", border: "border-sky-500", hex: "#0284c7" }, // Adani Total CNG
  "Torrent Gas": { bg: "bg-lime-600/20", text: "text-lime-300", border: "border-lime-500", hex: "#65a30d" }, // Torrent Gas CNG
  "GAIL Gas": { bg: "bg-emerald-700/20", text: "text-emerald-200", border: "border-emerald-600", hex: "#047857" }, // GAIL Gas CNG
  "Gujarat Gas": { bg: "bg-cyan-700/20", text: "text-cyan-200", border: "border-cyan-600", hex: "#0e7490" }, // Gujarat Gas CNG
  "Tata Power": { bg: "bg-cyan-600/20", text: "text-cyan-400", border: "border-cyan-500", hex: "#06b6d4" }, // Tata Power EV
  Statiq: { bg: "bg-purple-600/20", text: "text-purple-400", border: "border-purple-500", hex: "#a855f7" }, // Statiq Purple
  ChargeZone: { bg: "bg-blue-600/20", text: "text-blue-400", border: "border-blue-500", hex: "#3b82f6" }, // ChargeZone Blue
  Zeon: { bg: "bg-lime-600/20", text: "text-lime-400", border: "border-lime-500", hex: "#84cc16" }, // Zeon Lime
  "Ather Grid": { bg: "bg-orange-500/20", text: "text-orange-300", border: "border-orange-400", hex: "#ea580c" }, // Ather Grid Fast
  Kazam: { bg: "bg-indigo-600/20", text: "text-indigo-400", border: "border-indigo-500", hex: "#6366f1" }, // Kazam EV
  WhiteSpot: { bg: "bg-rose-600/20", text: "text-rose-400", border: "border-rose-500", hex: "#f43f5e" }, // White Spot Opportunity
};
