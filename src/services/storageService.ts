import { LocationAnalysisResult, calculateDistance } from "./geoIntelligence";

export interface StoredLocationRecord {
  id: string;
  name: string;
  lat: number;
  lng: number;
  timestamp: number;
  formattedDate: string;
  formattedAddress: string;
  roadName: string;
  roadCategory: string;
  whiteSpotScore: number;
  priorityRecommendation: string;
  nearestCompetitorKm: number;
  nearestCompetitorBrand: string;
  competitorCount: number;
  estimatedAADT: number;
  projectedMonthlyKL: number;
  projectedDailyCNGKg: number;
  projectedDailyEVKwh: number;
  analysisResult: LocationAnalysisResult;
}

const STORAGE_KEY = "urjagrid_scanned_points_v1";
const MAX_STORED_POINTS = 50;

/**
 * Retrieve all non-duplicate stored points from LocalStorage
 */
export function getStoredLocations(): StoredLocationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to load stored points from localStorage:", err);
  }
  return [];
}

/**
 * Store or Update a Scanned Location with Strict Spatial & Ident Deduplication
 * - If location is within ~150 meters of an existing stored record, it updates the record
 * - Avoids duplicate records while keeping the freshest analytics & timestamp
 */
export function saveOrUpdateScannedLocation(
  analysis: LocationAnalysisResult
): { record: StoredLocationRecord; isUpdate: boolean; allRecords: StoredLocationRecord[] } {
  const currentList = getStoredLocations();
  const lat = analysis.location.lat;
  const lng = analysis.location.lng;

  // Check for existing record within 0.15 km (150m) or identical coordinates (3 decimal places)
  const existingIndex = currentList.findIndex((item) => {
    const dist = calculateDistance(item.lat, item.lng, lat, lng);
    const latMatch = Math.abs(item.lat - lat) < 0.0015;
    const lngMatch = Math.abs(item.lng - lng) < 0.0015;
    return dist <= 0.15 || (latMatch && lngMatch);
  });

  const now = Date.now();
  const dateStr = new Date(now).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const siteName =
    analysis.location.roadName && analysis.location.roadName !== "Highway Corridor Node"
      ? `${analysis.location.roadName} (${analysis.location.city || analysis.location.district || "Corridor"})`
      : `Corridor Node (${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E)`;

  const newRecord: StoredLocationRecord = {
    id: existingIndex >= 0 ? currentList[existingIndex].id : `SCAN-${now}-${Math.floor(Math.random() * 1000)}`,
    name: siteName,
    lat,
    lng,
    timestamp: now,
    formattedDate: dateStr,
    formattedAddress: analysis.location.formattedAddress,
    roadName: analysis.location.roadName,
    roadCategory: analysis.location.roadCategory,
    whiteSpotScore: analysis.whiteSpotScore,
    priorityRecommendation: analysis.priorityRecommendation,
    nearestCompetitorKm: analysis.nearestCompetitorKm,
    nearestCompetitorBrand: analysis.nearestCompetitorBrand,
    competitorCount: analysis.competitors.length,
    estimatedAADT: analysis.trafficIntelligence.estimatedAADT,
    projectedMonthlyKL: analysis.trafficIntelligence.projectedMonthlyKL,
    projectedDailyCNGKg: analysis.trafficIntelligence.projectedDailyCNGKg,
    projectedDailyEVKwh: analysis.trafficIntelligence.projectedDailyEVKwh,
    analysisResult: analysis,
  };

  let updatedList: StoredLocationRecord[];
  let isUpdate = false;

  if (existingIndex >= 0) {
    // Update existing record and move to top of recent list
    isUpdate = true;
    currentList.splice(existingIndex, 1);
    updatedList = [newRecord, ...currentList];
  } else {
    // Add new unique record
    updatedList = [newRecord, ...currentList].slice(0, MAX_STORED_POINTS);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  } catch (err) {
    console.warn("Failed to persist location record:", err);
  }

  return { record: newRecord, isUpdate, allRecords: updatedList };
}

/**
 * Remove a specific point from storage
 */
export function deleteStoredLocation(id: string): StoredLocationRecord[] {
  const currentList = getStoredLocations();
  const filtered = currentList.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Failed to update storage after delete:", err);
  }
  return filtered;
}

/**
 * Clear all saved history
 */
export function clearAllStoredLocations(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear storage:", err);
  }
}
