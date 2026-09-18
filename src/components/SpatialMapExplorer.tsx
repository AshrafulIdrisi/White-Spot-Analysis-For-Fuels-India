import React, { useEffect, useRef, useState, useCallback } from "react";
import { WhiteSpotSite, ExistingOutlet, FuelBrand, ActiveTab } from "../types";
import { COMMERCIAL_HUBS_LIST } from "../data/mockDatabase";
import { BRAND_COLORS, formatINR, formatIndianNumber, formatKL } from "../utils/formatters";
import { calculateHaversineDistance } from "../utils/calculations";
import { 
  analyzeLocationOnMap, 
  LocationAnalysisResult, 
  GEOAPIFY_API_KEY 
} from "../services/geoIntelligence";
import { 
  getStoredLocations, 
  deleteStoredLocation, 
  clearAllStoredLocations, 
  StoredLocationRecord 
} from "../services/storageService";
import { LocationAnalysisInspector } from "./LocationAnalysisInspector";
import { 
  Layers, 
  MapPin, 
  Fuel, 
  Zap, 
  Sliders, 
  PlusCircle, 
  CheckCircle2, 
  Info, 
  Compass, 
  Building2, 
  ChevronRight,
  ShieldCheck,
  Navigation,
  Search,
  Crosshair,
  Sparkles,
  Loader2,
  X,
  Radar,
  Bookmark,
  History,
  Trash2,
  Download,
  Share2,
  ExternalLink,
  Eye,
  Radio,
  MapPinned,
  MousePointerClick
} from "lucide-react";
import L from "leaflet";

// Defensive safeguard for Leaflet against _leaflet_pos undefined reads during animated transitions
if (typeof window !== "undefined" && L && L.DomUtil) {
  const originalGetPosition = L.DomUtil.getPosition;
  L.DomUtil.getPosition = function (el: any) {
    if (!el) {
      return new L.Point(0, 0);
    }
    try {
      return originalGetPosition.call(L.DomUtil, el) || new L.Point(0, 0);
    } catch {
      return (el && el._leaflet_pos) || new L.Point(0, 0);
    }
  };

  const originalSetPosition = L.DomUtil.setPosition;
  L.DomUtil.setPosition = function (el: any, point: L.Point) {
    if (!el) return;
    try {
      originalSetPosition.call(L.DomUtil, el, point);
    } catch {
      if (el) {
        el._leaflet_pos = point;
      }
    }
  };
}

interface SpatialMapExplorerProps {
  sites: WhiteSpotSite[];
  existingOutlets: ExistingOutlet[];
  activeSite: WhiteSpotSite;
  setActiveSite: (site: WhiteSpotSite) => void;
  onAddCustomSite: (newSite: WhiteSpotSite) => void;
  selectedBrand: FuelBrand | "All_OMCs";
  setActiveTab: (tab: ActiveTab) => void;
  analyzedLocation: LocationAnalysisResult | null;
  setAnalyzedLocation: (result: LocationAnalysisResult | null) => void;
  onClearAnalysis?: () => void;
}

export const SpatialMapExplorer: React.FC<SpatialMapExplorerProps> = ({
  sites,
  existingOutlets,
  activeSite,
  setActiveSite,
  onAddCustomSite,
  selectedBrand,
  setActiveTab,
  analyzedLocation,
  setAnalyzedLocation,
  onClearAnalysis,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const circlesGroupRef = useRef<L.LayerGroup | null>(null);
  const clickMarkerGroupRef = useRef<L.LayerGroup | null>(null);
  const scannedCompetitorGroupRef = useRef<L.LayerGroup | null>(null);
  const radialLinesGroupRef = useRef<L.LayerGroup | null>(null);

  // Layer filters (Fuel, CNG, and EV Hubs)
  const [showWhiteSpots, setShowWhiteSpots] = useState(true);
  const [showExistingOutlets, setShowExistingOutlets] = useState(true);
  const [showCNGStations, setShowCNGStations] = useState(true);
  const [showEVPlazas, setShowEVPlazas] = useState(true);
  const [showCommercialHubs, setShowCommercialHubs] = useState(false);
  const [showCatchmentRings, setShowCatchmentRings] = useState(true);
  const [showScannedCompetitors, setShowScannedCompetitors] = useState(true);
  const [showRadialLines, setShowRadialLines] = useState(true);
  const [customCatchmentKm, setCustomCatchmentKm] = useState<number>(5);

  // Interactive Location Intelligence State (On-Click Analysis)
  // When returning from another tab, preserve inspector open if analyzedLocation is present
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(Boolean(analyzedLocation));
  const [searchQuery, setSearchQuery] = useState<string>(analyzedLocation ? analyzedLocation.location.roadName || "" : "");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [manualLat, setManualLat] = useState<string>(analyzedLocation ? analyzedLocation.location.lat.toFixed(4) : "28.2435");
  const [manualLng, setManualLng] = useState<string>(analyzedLocation ? analyzedLocation.location.lng.toFixed(4) : "76.8123");
  const [geoLocating, setGeoLocating] = useState<boolean>(false);

  // Saved Points Vault State (Deduplicated)
  const [savedPoints, setSavedPoints] = useState<StoredLocationRecord[]>([]);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);

  // Load saved points on mount
  useEffect(() => {
    setSavedPoints(getStoredLocations());
  }, []);

  // Dedicated helper to render the Target Click Marker with radar pulse effect
  const renderClickMarker = useCallback((lat: number, lng: number, roadName?: string, compCount?: number) => {
    if (!clickMarkerGroupRef.current) return;
    clickMarkerGroupRef.current.clearLayers();

    const pulseIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute h-16 w-16 rounded-full bg-purple-500/30 animate-ping"></div>
          <div class="absolute h-10 w-10 rounded-full bg-purple-600/50 animate-pulse"></div>
          <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-700 text-white shadow-xl">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
        </div>
      `,
      className: "custom-click-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([lat, lng], { icon: pulseIcon }).addTo(clickMarkerGroupRef.current);
    
    marker.bindPopup(`
      <div class="p-2 font-sans text-xs text-purple-950 min-w-[210px]">
        <div class="font-extrabold text-sm text-purple-900 flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-full bg-purple-600 animate-ping"></span>
          ${roadName || "Point Analysis Target"}
        </div>
        <div class="text-[11px] font-mono text-purple-800 font-bold mt-1">
          ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E
        </div>
        <div class="text-[10px] text-slate-600 mt-1">
          Dual Geoapify + OSM Overpass census active. ${typeof compCount === "number" ? `${compCount} competitors mapped.` : "Competitors mapped automatically."}
        </div>
      </div>
    `);
  }, []);

  // Explicit Clear Map Data & Analysis Handler
  const handleClearAnalysis = useCallback(() => {
    if (onClearAnalysis) {
      onClearAnalysis();
    } else {
      setAnalyzedLocation(null);
    }
    setInspectorOpen(false);
    if (clickMarkerGroupRef.current) clickMarkerGroupRef.current.clearLayers();
    if (scannedCompetitorGroupRef.current) scannedCompetitorGroupRef.current.clearLayers();
    if (radialLinesGroupRef.current) radialLinesGroupRef.current.clearLayers();
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.flyTo([activeSite.lat, activeSite.lng], 9, { duration: 0.8 });
      } catch {
        mapInstanceRef.current.setView([activeSite.lat, activeSite.lng], 9);
      }
    }
  }, [activeSite, onClearAnalysis, setAnalyzedLocation]);

  // Function to perform on-click location analysis (Refreshes data when clicking a new point)
  const handleAnalyzeCoordinates = useCallback(
    async (lat: number, lng: number, flyTo: boolean = true) => {
      setIsAnalyzing(true);
      setInspectorOpen(true);
      setManualLat(lat.toFixed(4));
      setManualLng(lng.toFixed(4));

      // Immediately render target marker while querying
      renderClickMarker(lat, lng);

      if (flyTo && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.flyTo([lat, lng], 11, { duration: 0.8 });
        } catch {
          mapInstanceRef.current.setView([lat, lng], 11);
        }
      }

      try {
        const result = await analyzeLocationOnMap(lat, lng, existingOutlets);
        setAnalyzedLocation(result);
        renderClickMarker(lat, lng, result.location.roadName, result.competitors.length);
        // Refresh saved points from local storage
        setSavedPoints(getStoredLocations());
      } catch (err) {
        console.error("Location analysis error:", err);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [existingOutlets, renderClickMarker, setAnalyzedLocation]
  );

  // Handle Manual Lat/Lng Hit
  const handleManualHit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98) {
      handleAnalyzeCoordinates(lat, lng, true);
    }
  };

  // Handle GPS Current Location Hit
  const handleGetGPS = () => {
    if ("geolocation" in navigator) {
      setGeoLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLocating(false);
          handleAnalyzeCoordinates(pos.coords.latitude, pos.coords.longitude, true);
        },
        (err) => {
          setGeoLocating(false);
          console.warn("GPS location fallback:", err);
          handleAnalyzeCoordinates(28.4595, 77.0266, true);
        },
        { timeout: 8000 }
      );
    } else {
      handleAnalyzeCoordinates(28.4595, 77.0266, true);
    }
  };

  // Search Address/Corridor with Geoapify Geocoding API
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        searchQuery
      )}&filter=countrycode:in&limit=5&apiKey=${GEOAPIFY_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn("Geocoding search fallback:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates;
    setSearchResults([]);
    setSearchQuery(feature.properties.formatted || feature.properties.name);
    handleAnalyzeCoordinates(lat, lng, true);
  };

  // Delete saved point
  const handleDeleteSavedPoint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteStoredLocation(id);
    setSavedPoints(updated);
  };

  // Clear all saved points
  const handleClearAllSaved = () => {
    clearAllStoredLocations();
    setSavedPoints([]);
  };

  // Export saved points as JSON
  const handleExportSavedPoints = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedPoints, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `urjagrid_scanned_points_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on persisted analyzedLocation if present, otherwise activeSite
    const initialCenter: [number, number] = analyzedLocation
      ? [analyzedLocation.location.lat, analyzedLocation.location.lng]
      : [activeSite.lat, activeSite.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: analyzedLocation ? 11 : 8,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    // High quality OpenStreetMap + Carto Voyager Tiles (Clean light aesthetic)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    const circlesGroup = L.layerGroup().addTo(map);
    const clickMarkerGroup = L.layerGroup().addTo(map);
    const scannedCompetitorGroup = L.layerGroup().addTo(map);
    const radialLinesGroup = L.layerGroup().addTo(map);

    layersGroupRef.current = layersGroup;
    circlesGroupRef.current = circlesGroup;
    clickMarkerGroupRef.current = clickMarkerGroup;
    scannedCompetitorGroupRef.current = scannedCompetitorGroup;
    radialLinesGroupRef.current = radialLinesGroup;
    mapInstanceRef.current = map;

    // If analysis was already loaded, restore its target marker immediately
    if (analyzedLocation) {
      renderClickMarker(
        analyzedLocation.location.lat,
        analyzedLocation.location.lng,
        analyzedLocation.location.roadName,
        analyzedLocation.competitors.length
      );
    }

    // Invalidate size once tiles are loaded to avoid gray tile overlapping
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        // ignore
      }
    }, 200);

    // Master Click Listener: ONLY fetch/analyze when user clicks on the map
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      handleAnalyzeCoordinates(lat, lng, false);
    });

    // NOTE: DO NOT auto-fetch any default point on startup!

    // ResizeObserver on the container to prevent any map clipping or overlapping
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch {
          // ignore
        }
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.closePopup();
          mapInstanceRef.current.eachLayer((layer) => {
            try {
              layer.remove();
            } catch {
              // ignore
            }
          });
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate map size when inspector or vault is opened/closed or layout changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch {
          // ignore
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [inspectorOpen, isVaultOpen]);

  // Synchronize Click Marker and Inputs with analyzedLocation state (handles tab return and clearing)
  useEffect(() => {
    if (!mapInstanceRef.current || !clickMarkerGroupRef.current) return;

    if (analyzedLocation) {
      const { lat, lng } = analyzedLocation.location;
      renderClickMarker(lat, lng, analyzedLocation.location.roadName, analyzedLocation.competitors.length);
      setManualLat(lat.toFixed(4));
      setManualLng(lng.toFixed(4));
    } else {
      clickMarkerGroupRef.current.clearLayers();
      if (scannedCompetitorGroupRef.current) scannedCompetitorGroupRef.current.clearLayers();
      if (radialLinesGroupRef.current) radialLinesGroupRef.current.clearLayers();
    }
  }, [analyzedLocation, renderClickMarker]);

  // Center map when activeSite changes from outside selector without auto-fetching
  useEffect(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.flyTo([activeSite.lat, activeSite.lng], 9, {
          duration: 0.8,
        });
      } catch {
        mapInstanceRef.current.setView([activeSite.lat, activeSite.lng], 9);
      }
      setTimeout(() => {
        try {
          mapInstanceRef.current?.invalidateSize();
        } catch {
          // ignore
        }
      }, 300);
    }
  }, [activeSite.id]);

  // Render Base Map Markers & Static Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    const circlesGroup = circlesGroupRef.current;
    if (!map || !layersGroup || !circlesGroup) return;

    layersGroup.clearLayers();
    circlesGroup.clearLayers();

    // 1. Draw Catchment Rings around Active Target Site (Purple & White theme)
    const targetLat = analyzedLocation ? analyzedLocation.location.lat : activeSite.lat;
    const targetLng = analyzedLocation ? analyzedLocation.location.lng : activeSite.lng;

    if (showCatchmentRings) {
      // 3 km Urban Ring (Violet)
      L.circle([targetLat, targetLng], {
        radius: 3000,
        color: "#9333ea",
        weight: 1.5,
        dashArray: "4, 6",
        fillColor: "#9333ea",
        fillOpacity: 0.08,
      }).addTo(circlesGroup);

      // Custom / 5 km Semi-Urban Ring (Indigo)
      L.circle([targetLat, targetLng], {
        radius: customCatchmentKm * 1000,
        color: "#6366f1",
        weight: 2,
        dashArray: "6, 8",
        fillColor: "#6366f1",
        fillOpacity: 0.05,
      }).addTo(circlesGroup);

      // 10 km Highway Buffer Ring (Purple)
      L.circle([targetLat, targetLng], {
        radius: 10000,
        color: "#a855f7",
        weight: 1.5,
        dashArray: "3, 6",
        fillColor: "#a855f7",
        fillOpacity: 0.02,
      }).addTo(circlesGroup);
    }

    // 2. Render White Spot Opportunities (Purple & White Badges)
    if (showWhiteSpots) {
      sites.forEach((site) => {
        const isSelected = site.id === activeSite.id;

        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute h-9 w-9 rounded-full ${isSelected ? "bg-purple-600/30 animate-ping" : "bg-purple-500/15 group-hover:bg-purple-500/30"}"></div>
            <div class="relative flex h-7 w-7 items-center justify-center rounded-full border-2 ${
              isSelected ? "border-purple-800 bg-purple-700 text-white shadow-purple-600/40 shadow-lg scale-110" : "border-purple-400 bg-white text-purple-900 shadow-md"
            } font-bold text-[10px] transition-transform">
              ${site.deficitScore}
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap rounded bg-purple-900 px-1.5 py-0.5 text-[9px] font-bold text-white border border-purple-300 shadow-md">
              ${site.name.split(" ")[0]}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-white-spot-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([site.lat, site.lng], { icon: customIcon }).addTo(layersGroup);
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setActiveSite(site);
          handleAnalyzeCoordinates(site.lat, site.lng, true);
        });
      });
    }

    // 3. Render Existing OMC Outlets, CNG Stations & EV Plazas
    const filteredExisting = existingOutlets.filter((outlet) => {
      const isPureEV = outlet.monthlyKL === 0 && outlet.hasEVFastCharger && !outlet.hasCNG;
      const isPureCNG = outlet.monthlyKL === 0 && outlet.hasCNG;
      const isMultiFuel = outlet.monthlyKL > 0 && (outlet.hasCNG || outlet.hasEVFastCharger);
      const isFuelOnly = outlet.monthlyKL > 0 && !outlet.hasCNG && !outlet.hasEVFastCharger;

      if (isPureEV) return showEVPlazas;
      if (isPureCNG) return showCNGStations;
      if (isMultiFuel) return showExistingOutlets || showCNGStations || showEVPlazas;
      if (isFuelOnly) return showExistingOutlets;

      if (!showExistingOutlets) return false;
      if (selectedBrand === "All_OMCs") return true;
      return outlet.brand === selectedBrand;
    });

    filteredExisting.forEach((outlet) => {
      const isPureEV = outlet.monthlyKL === 0 && outlet.hasEVFastCharger && !outlet.hasCNG;
      const isPureCNG = outlet.monthlyKL === 0 && outlet.hasCNG;
      const brandColor = BRAND_COLORS[outlet.brand]?.hex || "#9333ea";

      let markerIconHtml = "";

      if (isPureEV) {
        // Dedicated EV Fast Charging Plaza
        markerIconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute h-8 w-8 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/40 transition-all"></div>
            <div class="relative flex h-6 w-6 items-center justify-center rounded-lg border-2 border-white shadow-md bg-cyan-600 text-white font-bold text-[10px] transform group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-400 shadow-md">
              ${outlet.evKwCapacity ? `${outlet.evKwCapacity}kW` : "EV"}
            </div>
          </div>
        `;
      } else if (isPureCNG) {
        // Dedicated CNG Station
        markerIconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute h-8 w-8 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/40 transition-all"></div>
            <div class="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-md bg-emerald-600 text-white font-bold text-[10px] transform group-hover:scale-110 transition-transform">
              🔥
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-400 shadow-md">
              CNG
            </div>
          </div>
        `;
      } else {
        // Multi-Fuel or Standard Fuel Outlet
        markerIconHtml = `
          <div class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform" style="background-color: ${brandColor};">
            <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
          </div>
        `;
      }

      const icon = L.divIcon({
        html: markerIconHtml,
        className: "custom-outlet-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([outlet.lat, outlet.lng], { icon }).addTo(layersGroup);
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        handleAnalyzeCoordinates(outlet.lat, outlet.lng, true);
      });

      marker.bindPopup(`
        <div class="p-1 text-slate-900 font-sans text-xs">
          <div class="font-bold text-sm text-purple-950">${outlet.name}</div>
          <div class="text-[11px] text-purple-700 font-semibold">${outlet.brand} (${outlet.format.replace(/_/g, " ")})</div>
          <div class="mt-1 text-[11px] text-slate-700">Corridor: ${outlet.corridor}</div>
          ${
            outlet.monthlyKL > 0
              ? `<div class="mt-1 font-mono font-bold text-purple-900">${outlet.monthlyKL} KL/month</div>`
              : ""
          }
          ${
            outlet.hasCNG
              ? `<div class="mt-0.5 font-mono text-emerald-700 font-semibold">CNG: ${outlet.cngCapacityKgDay ? `${outlet.cngCapacityKgDay} kg/day (${outlet.cngStationType || "Online"})` : "Available"}</div>`
              : ""
          }
          ${
            outlet.hasEVFastCharger
              ? `<div class="mt-0.5 font-mono text-cyan-700 font-semibold">EV: ${outlet.evKwCapacity || 60} kW Fast DC (${outlet.evGunsCount || 2} Guns)</div>`
              : ""
          }
          <div class="mt-2 text-[10px] text-purple-800 font-bold cursor-pointer underline">Click marker to perform full catchment analysis &rarr;</div>
        </div>
      `);
    });

    // 4. Render Commercial Logistics Hubs (APMC, ICD, Ports)
    if (showCommercialHubs) {
      COMMERCIAL_HUBS_LIST.forEach((hub) => {
        const iconHtml = `
          <div class="flex h-5 w-5 items-center justify-center rounded-md bg-purple-700 border border-white text-white shadow-md cursor-pointer hover:scale-125 transition-transform">
            <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
        `;
        const icon = L.divIcon({
          html: iconHtml,
          className: "custom-hub-marker",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const marker = L.marker([hub.lat, hub.lng], { icon }).addTo(layersGroup);
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          handleAnalyzeCoordinates(hub.lat, hub.lng, true);
        });
      });
    }
  }, [
    sites,
    existingOutlets,
    activeSite.id,
    showWhiteSpots,
    showExistingOutlets,
    showCNGStations,
    showEVPlazas,
    showCommercialHubs,
    showCatchmentRings,
    customCatchmentKm,
    selectedBrand,
    handleAnalyzeCoordinates,
    analyzedLocation,
  ]);

  // Render LIVE SCANNED COMPETITORS from Geoapify & Overpass with Radial Lines
  useEffect(() => {
    const scannedGroup = scannedCompetitorGroupRef.current;
    const radialGroup = radialLinesGroupRef.current;
    if (!scannedGroup || !radialGroup) return;

    scannedGroup.clearLayers();
    radialGroup.clearLayers();

    if (!showScannedCompetitors || !analyzedLocation) return;

    const targetLat = analyzedLocation.location.lat;
    const targetLng = analyzedLocation.location.lng;

    analyzedLocation.competitors.forEach((comp) => {
      const isEV = comp.category === "EV_Charging";
      const isCNG = comp.category === "CNG_Station";
      const brandColor = BRAND_COLORS[comp.brand as FuelBrand]?.hex || (isEV ? "#06b6d4" : isCNG ? "#10b981" : "#7e22ce");

      // 1. Draw Radial Distance Line from clicked point to competitor
      if (showRadialLines) {
        const polyline = L.polyline(
          [
            [targetLat, targetLng],
            [comp.lat, comp.lng],
          ],
          {
            color: isEV ? "#06b6d4" : isCNG ? "#10b981" : "#9333ea",
            weight: 1.5,
            dashArray: "3, 5",
            opacity: 0.7,
          }
        ).addTo(radialGroup);

        polyline.bindTooltip(
          `${comp.distanceKm.toFixed(2)} km to ${comp.brand}`,
          { permanent: false, direction: "center", className: "bg-purple-900 text-white text-[10px] px-1.5 py-0.5 rounded border border-purple-300 font-bold shadow-md" }
        );
      }

      // 2. Draw Competitor Marker
      let compHtml = "";
      if (isEV) {
        compHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute h-8 w-8 rounded-full bg-cyan-400/30 group-hover:bg-cyan-400/60 animate-pulse"></div>
            <div class="relative flex h-6 w-6 items-center justify-center rounded-lg border-2 border-white shadow-xl bg-cyan-600 text-white font-black text-[10px]">
              ⚡
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.2 text-[8px] font-extrabold text-cyan-300 border border-cyan-400 shadow-md">
              ${comp.distanceKm.toFixed(1)}km • ${comp.brand}
            </div>
          </div>
        `;
      } else if (isCNG) {
        compHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute h-8 w-8 rounded-full bg-emerald-400/30 group-hover:bg-emerald-400/60 animate-pulse"></div>
            <div class="relative flex h-6 w-6 items-center justify-center rounded-lg border-2 border-white shadow-xl bg-emerald-600 text-white font-black text-[10px]">
              🔥
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.2 text-[8px] font-extrabold text-emerald-300 border border-emerald-400 shadow-md">
              ${comp.distanceKm.toFixed(1)}km • ${comp.brand}
            </div>
          </div>
        `;
      } else {
        compHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute h-7 w-7 rounded-full opacity-25 group-hover:opacity-50 transition-opacity" style="background-color: ${brandColor};"></div>
            <div class="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-xl text-white font-black text-[9px]" style="background-color: ${brandColor};">
              ⛽
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap rounded bg-purple-950 px-1.5 py-0.2 text-[8px] font-extrabold text-white border border-purple-300 shadow-md">
              ${comp.distanceKm.toFixed(1)}km • ${comp.brand}
            </div>
          </div>
        `;
      }

      const compIcon = L.divIcon({
        html: compHtml,
        className: "custom-scanned-comp-marker",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const compMarker = L.marker([comp.lat, comp.lng], { icon: compIcon }).addTo(scannedGroup);

      compMarker.bindPopup(`
        <div class="p-2 font-sans text-xs text-slate-900 min-w-[240px]">
          <div class="flex items-center justify-between pb-1 border-b border-purple-100 mb-1.5">
            <span class="font-extrabold text-sm text-purple-950">${comp.name}</span>
            <span class="px-1.5 py-0.5 rounded font-bold text-[10px] text-white shadow-sm" style="background-color: ${brandColor};">
              ${comp.brand}
            </span>
          </div>
          
          <div class="grid grid-cols-2 gap-1 my-1.5 text-[11px] font-medium bg-purple-50 p-1.5 rounded-lg border border-purple-200">
            <div><span class="text-purple-800 font-bold">Distance:</span> ${comp.distanceKm.toFixed(2)} km</div>
            <div><span class="text-purple-800 font-bold">Bearing:</span> ${comp.bearing}</div>
            <div class="col-span-2 truncate"><span class="text-purple-800 font-bold">Category:</span> ${comp.category.replace(/_/g, " ")}</div>
          </div>

          ${
            comp.amenities && comp.amenities.length > 0
              ? `
              <div class="my-1.5">
                <div class="text-[9px] font-bold text-purple-900 uppercase mb-0.5">Dispensers & Amenities:</div>
                <div class="flex flex-wrap gap-1">
                  ${comp.amenities
                    .map(
                      (a) =>
                        `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-200">${a}</span>`
                    )
                    .join("")}
                </div>
              </div>
            `
              : ""
          }

          <div class="mt-2 pt-1 border-t border-purple-100 flex items-center justify-between text-[10px] text-slate-600">
            <span class="font-bold text-purple-800 flex items-center gap-1">
              ✓ ${comp.source.replace(/_/g, " ")} Verified
            </span>
            <span class="font-mono text-[9px] text-slate-500">${comp.lat.toFixed(4)}, ${comp.lng.toFixed(4)}</span>
          </div>
        </div>
      `);
    });
  }, [analyzedLocation, showScannedCompetitors, showRadialLines]);

  return (
    <div className="relative h-[calc(100vh-130px)] min-h-[580px] w-full overflow-hidden flex flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans isolate">
      {/* Map Control Sidebar / Layer Toggles (Crisp White & Royal Purple Light Theme) */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r-2 border-purple-100 p-4 z-20 flex flex-col justify-between overflow-y-auto max-h-[35vh] lg:max-h-full shadow-lg shrink-0">
        <div className="space-y-4">
          {/* Header & Vault Toggle */}
          <div className="flex items-center justify-between border-b border-purple-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-purple-700" />
              Geospatial Layers
            </h3>
            <button
              onClick={() => setIsVaultOpen(!isVaultOpen)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-700 hover:bg-purple-800 text-white shadow-sm flex items-center gap-1 transition-colors"
            >
              <Bookmark className="h-3 w-3" />
              Vault ({savedPoints.length})
            </button>
          </div>

          {/* Quick Search Bar (Crisp White with Purple Accents) */}
          <div className="relative">
            <form onSubmit={handleSearchAddress} className="relative">
              <input
                type="text"
                placeholder="Search highway, toll, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-purple-50/60 border-2 border-purple-200 py-2 pl-9 pr-8 text-xs text-purple-950 placeholder:text-purple-400 font-medium focus:border-purple-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-300/40 shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-700 font-bold" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-700 animate-spin" />
              )}
            </form>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-40 rounded-xl bg-white border-2 border-purple-300 shadow-2xl p-1.5 space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSearchResult(f)}
                    className="w-full text-left p-2 rounded-lg text-xs font-semibold text-purple-950 hover:bg-purple-700 hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">{f.properties.formatted || f.properties.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 ml-1 opacity-70" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Direct Coordinate Hit & GPS Box (Purple & White Card) */}
          <div className="rounded-xl bg-purple-50/70 border-2 border-purple-200 p-3 shadow-sm text-purple-950 space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-purple-950">
              <span className="flex items-center gap-1.5">
                <Crosshair className="h-4 w-4 text-purple-700" />
                Click Map or Hit Point
              </span>
              <button
                type="button"
                onClick={handleGetGPS}
                disabled={geoLocating}
                className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 transition-colors flex items-center gap-1 shadow-sm"
                title="Detect GPS"
              >
                <Navigation className={`h-3 w-3 ${geoLocating ? "animate-spin text-purple-700" : "text-purple-700"}`} />
                {geoLocating ? "Locating..." : "My GPS"}
              </button>
            </div>

            <form onSubmit={handleManualHit} className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] font-bold text-purple-800 uppercase">Latitude</label>
                  <input
                    type="text"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="28.2435"
                    className="w-full rounded-lg bg-white border border-purple-200 px-2 py-1 text-xs font-mono font-bold text-purple-950 focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-purple-800 uppercase">Longitude</label>
                  <input
                    type="text"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="76.8123"
                    className="w-full rounded-lg bg-white border border-purple-200 px-2 py-1 text-xs font-mono font-bold text-purple-950 focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="flex-1 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-[0.98] text-white font-extrabold text-xs py-2 shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Querying APIs...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Hit Coordinates
                    </>
                  )}
                </button>
                {analyzedLocation && (
                  <button
                    type="button"
                    onClick={handleClearAnalysis}
                    className="px-2.5 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-300 text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                    title="Clear Map Data"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    Clear
                  </button>
                )}
              </div>
            </form>

            {/* Quick-Hit Corridor Presets */}
            <div className="pt-1.5 border-t border-purple-200">
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-purple-800 mb-1">
                Strategic Corridor Presets
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {[
                  { name: "NH-48 Delhi-Jaipur", lat: 28.2435, lng: 76.8123 },
                  { name: "Mumbai-Pune E-Way", lat: 18.7521, lng: 73.4112 },
                  { name: "NH-44 BLR-Hosur", lat: 12.7824, lng: 77.7812 },
                  { name: "Yamuna E-Way", lat: 27.8124, lng: 77.6234 },
                  { name: "Samruddhi Mahamarg", lat: 19.9823, lng: 75.3214 },
                  { name: "Eastern Peripheral", lat: 28.6123, lng: 77.4812 },
                ].map((corridor, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAnalyzeCoordinates(corridor.lat, corridor.lng, true)}
                    className="p-1 rounded-lg bg-white hover:bg-purple-700 hover:text-white border border-purple-200 text-purple-900 text-left font-bold truncate transition-colors shadow-xs"
                  >
                    {corridor.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Layer Toggles (Purple & White High Contrast) */}
          <div className="space-y-1.5 text-xs">
            {/* Live Scanned Competitor Layer */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-purple-100/60 border border-purple-300 cursor-pointer hover:bg-purple-100 transition-all text-purple-950 font-bold shadow-xs">
              <span className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-purple-700 animate-pulse" />
                Live Competitors on Map
              </span>
              <input
                type="checkbox"
                checked={showScannedCompetitors}
                onChange={(e) => setShowScannedCompetitors(e.target.checked)}
                className="rounded border-purple-400 text-purple-700 focus:ring-purple-500 h-4 w-4"
              />
            </label>

            {/* Radial Connector Rays */}
            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 cursor-pointer hover:bg-purple-50 transition-all text-purple-950">
              <span className="flex items-center gap-2 font-semibold">
                <Compass className="h-3.5 w-3.5 text-purple-600" />
                Distance Connector Rays
              </span>
              <input
                type="checkbox"
                checked={showRadialLines}
                onChange={(e) => setShowRadialLines(e.target.checked)}
                className="rounded border-purple-300 text-purple-700 focus:ring-purple-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 cursor-pointer hover:bg-purple-50 transition-all text-purple-950">
              <span className="flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-600"></span>
                White Spots (Deficit Score)
              </span>
              <input
                type="checkbox"
                checked={showWhiteSpots}
                onChange={(e) => setShowWhiteSpots(e.target.checked)}
                className="rounded border-purple-300 text-purple-700 focus:ring-purple-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 cursor-pointer hover:bg-purple-50 transition-all text-purple-950">
              <span className="flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                Existing OMC Outlets (MS/HSD)
              </span>
              <input
                type="checkbox"
                checked={showExistingOutlets}
                onChange={(e) => setShowExistingOutlets(e.target.checked)}
                className="rounded border-purple-300 text-purple-700 focus:ring-purple-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 cursor-pointer hover:bg-purple-50 transition-all text-purple-950">
              <span className="flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                Dedicated CNG & CGD Cascades
              </span>
              <input
                type="checkbox"
                checked={showCNGStations}
                onChange={(e) => setShowCNGStations(e.target.checked)}
                className="rounded border-purple-300 text-purple-700 focus:ring-purple-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 cursor-pointer hover:bg-purple-50 transition-all text-purple-950">
              <span className="flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
                EV DC Fast Charging Hubs
              </span>
              <input
                type="checkbox"
                checked={showEVPlazas}
                onChange={(e) => setShowEVPlazas(e.target.checked)}
                className="rounded border-purple-300 text-purple-700 focus:ring-purple-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 cursor-pointer hover:bg-purple-50 transition-all text-purple-950">
              <span className="flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
                Logistics Hubs & Mandis
              </span>
              <input
                type="checkbox"
                checked={showCommercialHubs}
                onChange={(e) => setShowCommercialHubs(e.target.checked)}
                className="rounded border-purple-300 text-purple-700 focus:ring-purple-500 h-4 w-4"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 cursor-pointer hover:bg-purple-50 transition-all text-purple-950">
              <span className="flex items-center gap-2 font-semibold">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-700"></span>
                Isochrone Catchment Rings
              </span>
              <input
                type="checkbox"
                checked={showCatchmentRings}
                onChange={(e) => setShowCatchmentRings(e.target.checked)}
                className="rounded border-purple-300 text-purple-700 focus:ring-purple-500 h-4 w-4"
              />
            </label>
          </div>

          {/* Catchment Radius Slider */}
          {showCatchmentRings && (
            <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-3 shadow-xs">
              <div className="flex items-center justify-between text-xs text-purple-950 mb-1.5 font-semibold">
                <span>Active Catchment Buffer</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-purple-700 text-white shadow-xs">{customCatchmentKm} km</span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                step={1}
                value={customCatchmentKm}
                onChange={(e) => setCustomCatchmentKm(Number(e.target.value))}
                className="w-full accent-purple-700 h-1.5 bg-purple-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-purple-800 mt-1 font-mono font-medium">
                <span>3km Urban</span>
                <span>5km Semi-Urban</span>
                <span>10km Highway</span>
              </div>
            </div>
          )}
        </div>

        {/* Legend in Purple & White Combo */}
        <div className="mt-4 pt-3 border-t border-purple-100 text-[10px] text-purple-900 space-y-2">
          <div className="font-bold text-purple-950 uppercase tracking-wider">Multi-Fuel & Energy Legend</div>
          
          <div>
            <div className="text-[9px] uppercase font-bold text-purple-800 mb-0.5">Liquid Fuels (OMCs)</div>
            <div className="grid grid-cols-3 gap-1 font-mono text-purple-950">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500"></span> IOCL</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> BPCL</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"></span> HPCL</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Jio-bp</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-teal-500"></span> Nayara</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400"></span> Shell</span>
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase font-bold text-emerald-800 mb-0.5">City Gas (CNG Hubs)</div>
            <div className="grid grid-cols-2 gap-1 font-mono text-purple-950">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> IGL / MGL</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-lime-600"></span> Adani / Torrent</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-700"></span> GAIL / Gujarat</span>
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase font-bold text-cyan-800 mb-0.5">EV DC Fast CPOs</div>
            <div className="grid grid-cols-2 gap-1 font-mono text-purple-950">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-cyan-500"></span> Tata Power (240kW)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-600"></span> Statiq (180kW)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600"></span> ChargeZone / Zeon</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500"></span> Ather Grid Fast</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div className="flex-1 relative h-full min-h-[400px] overflow-hidden isolate">
        <div ref={mapContainerRef} className="h-full w-full bg-slate-100"></div>

        {/* Informational Callout when no point is actively analyzed */}
        {!analyzedLocation && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2 shadow-xl border-2 border-purple-300 text-purple-950 text-xs font-bold backdrop-blur-sm animate-pulse">
            <MousePointerClick className="h-4 w-4 text-purple-700 shrink-0" />
            <span>Click anywhere on the map or hit coordinates to scan live Fuel, CNG, and EV competitors</span>
          </div>
        )}

        {/* Floating Action: Open Inspector, Vault, and Clear Map Data */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 flex-wrap max-w-[calc(100%-120px)]">
          {analyzedLocation && !inspectorOpen && (
            <button
              onClick={() => setInspectorOpen(true)}
              className="rounded-2xl bg-white hover:bg-purple-50 text-purple-950 font-extrabold text-xs py-2 px-3.5 shadow-2xl flex items-center gap-2 border-2 border-purple-600 transition-all hover:scale-105"
            >
              <Radar className="h-4 w-4 text-purple-700" />
              Inspector: {analyzedLocation.location.roadName} ({analyzedLocation.competitors.length} Competitors)
            </button>
          )}

          <button
            onClick={() => setIsVaultOpen(!isVaultOpen)}
            className="rounded-2xl bg-white hover:bg-purple-50 text-purple-950 font-bold text-xs py-2 px-3 shadow-xl flex items-center gap-1.5 border-2 border-purple-300 backdrop-blur-md transition-all hover:scale-105"
          >
            <History className="h-3.5 w-3.5 text-purple-700" />
            <span>Vault ({savedPoints.length})</span>
          </button>

          {analyzedLocation && (
            <button
              onClick={handleClearAnalysis}
              className="rounded-2xl bg-white hover:bg-red-50 text-red-700 hover:text-red-800 font-bold text-xs py-2 px-3 shadow-xl flex items-center gap-1.5 border-2 border-red-300 backdrop-blur-md transition-all hover:scale-105"
              title="Clear Point Analysis and reset map view"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
              <span>Clear Map Data</span>
            </button>
          )}
        </div>

        {/* Live Competitor Count Pill Badge on Map */}
        {analyzedLocation && (
          <div className="absolute top-4 right-14 z-20 hidden sm:flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 shadow-xl border-2 border-purple-300 text-purple-950 text-xs font-extrabold backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{analyzedLocation.competitors.length} Competitors Active on Map</span>
          </div>
        )}
      </div>

      {/* SAVED POINTS VAULT DRAWER (Light Theme) */}
      {isVaultOpen && (
        <div className="absolute inset-y-0 left-0 lg:left-80 w-full sm:w-96 bg-white z-40 border-r-2 border-purple-300 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
          <div className="p-4 border-b-2 border-purple-100 flex items-center justify-between bg-purple-700 text-white">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-purple-200" />
              <h3 className="font-extrabold text-sm text-white">Scanned Points Vault</h3>
              <span className="px-2 py-0.5 rounded-full bg-white text-purple-950 font-mono text-[10px] font-black">
                {savedPoints.length}
              </span>
            </div>
            <button
              onClick={() => setIsVaultOpen(false)}
              className="p-1 rounded-lg hover:bg-purple-800 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-3 bg-purple-50/70 border-b border-purple-200 flex items-center justify-between text-xs">
            <span className="text-purple-900 font-bold">Non-duplicate location storage</span>
            <div className="flex items-center gap-1.5">
              {savedPoints.length > 0 && (
                <>
                  <button
                    onClick={handleExportSavedPoints}
                    className="p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 transition-colors flex items-center gap-1 text-[11px] font-bold border border-purple-300"
                    title="Export JSON"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </button>
                  <button
                    onClick={handleClearAllSaved}
                    className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 transition-colors flex items-center gap-1 text-[11px] font-bold border border-red-300"
                    title="Clear All"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {savedPoints.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Crosshair className="h-8 w-8 mx-auto text-purple-400" />
                <p className="text-xs font-bold text-purple-950">No scanned points stored yet.</p>
                <p className="text-[11px] text-slate-600">
                  Click anywhere on the map or hit coordinates to automatically catalog locations!
                </p>
              </div>
            ) : (
              savedPoints.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    handleAnalyzeCoordinates(item.lat, item.lng, true);
                    setIsVaultOpen(false);
                  }}
                  className="rounded-xl bg-white text-purple-950 p-3 shadow-md hover:shadow-xl border-2 border-purple-200 hover:border-purple-600 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-extrabold text-xs text-purple-950 group-hover:text-purple-700 transition-colors line-clamp-1">
                      {item.name}
                    </div>
                    <button
                      onClick={(e) => handleDeleteSavedPoint(item.id, e)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                    {item.lat.toFixed(4)}° N, {item.lng.toFixed(4)}° E • {item.formattedDate}
                  </div>

                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] bg-purple-50 p-1.5 rounded-lg border border-purple-200 text-center font-bold">
                    <div>
                      <div className="text-[8px] text-purple-800 uppercase">Deficit</div>
                      <div className="text-purple-950 font-mono">{item.whiteSpotScore}/100</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-purple-800 uppercase">Nearest</div>
                      <div className="text-purple-950 font-mono">{item.nearestCompetitorKm}km</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-purple-800 uppercase">Competitors</div>
                      <div className="text-purple-950 font-mono">{item.competitorCount}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* On-Click Location Deep Analysis Inspector Panel (Right-Hand Drawer) */}
      {inspectorOpen && analyzedLocation && (
        <div className="w-full lg:w-[480px] h-full z-30 shrink-0 shadow-2xl transition-all border-l-2 border-purple-200 bg-white">
          <LocationAnalysisInspector
            analysis={analyzedLocation}
            loading={isAnalyzing}
            onClose={() => setInspectorOpen(false)}
            onClearAnalysis={handleClearAnalysis}
            onSetAsActiveCandidate={(newSite) => {
              onAddCustomSite(newSite);
              setActiveSite(newSite);
              setInspectorOpen(false);
            }}
            setActiveTab={setActiveTab}
          />
        </div>
      )}
    </div>
  );
};
