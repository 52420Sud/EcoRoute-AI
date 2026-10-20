import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Dustbin, PublicReport, Vehicle, RoutePlan, LocationCoordinates } from '../../types/waste';
import { Layers, MapPin, Truck, AlertTriangle, RefreshCw, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react';

export type MapTileProvider = 'google-streets' | 'google-satellite' | 'google-terrain' | 'osm' | 'plain-white';

interface InteractiveMapProps {
  dustbins: Dustbin[];
  reports?: PublicReport[];
  vehicles?: Vehicle[];
  activeRoute?: RoutePlan | null;
  depotLocation?: LocationCoordinates;
  selectedDustbinId?: string | null;
  onSelectDustbin?: (bin: Dustbin) => void;
  className?: string;
  showControls?: boolean;
  plainWhite?: boolean;
  initialProvider?: MapTileProvider;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  dustbins,
  reports = [],
  vehicles = [],
  activeRoute = null,
  depotLocation,
  selectedDustbinId,
  onSelectDustbin,
  className = "h-[540px]",
  showControls = true,
  plainWhite = false,
  initialProvider
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'route'>('all');
  const [showVehicles, setShowVehicles] = useState(true);
  const [showReports, setShowReports] = useState(true);
  
  // Default to Google Maps Streets, or plain-white if explicitly requested
  const [tileProvider, setTileProvider] = useState<MapTileProvider>(
    initialProvider || (plainWhite ? 'plain-white' : 'google-streets')
  );

  useEffect(() => {
    if (plainWhite) {
      setTileProvider('plain-white');
    } else if (initialProvider) {
      setTileProvider(initialProvider);
    }
  }, [plainWhite, initialProvider]);

  // Pure White Image Tile SVG data URI (Zero external network calls, zero API keys required!)
  const whiteSvgTile = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="%23ffffff"/><path d="M0 255h256M255 0v256" stroke="%23f8fafc" stroke-width="1"/></svg>';

  // Helper to create tile layers (using Google Maps as default, no API keys/watermarks)
  const createTileLayer = (provider: MapTileProvider) => {
    switch (provider) {
      case 'google-streets':
        return L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Google Maps'
        });
      case 'google-satellite':
        return L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Google Maps Satellite'
        });
      case 'google-terrain':
        return L.tileLayer('https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Google Maps Terrain'
        });
      case 'osm':
        return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: 'OpenStreetMap'
        });
      case 'plain-white':
      default:
        return L.tileLayer(whiteSvgTile, {
          maxZoom: 20
        });
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center around the cluster centroid (approx 13.3440, 74.7430)
    const initialCenter: [number, number] = [13.3440, 74.7430];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      maxZoom: 20,
      zoomControl: false,
      attributionControl: false
    });

    const tileLayer = createTileLayer(tileProvider);
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle switching between Google Streets, Google Satellite, and Plain White Map
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    const nextTile = createTileLayer(tileProvider);
    nextTile.addTo(map);
    tileLayerRef.current = nextTile;
  }, [tileProvider]);

  // Update Markers and Route Layer whenever data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !routeLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    const routeGroup = routeLayerRef.current;
    markersGroup.clearLayers();
    routeGroup.clearLayers();

    // 1. Render Depot Marker
    if (depotLocation) {
      const depotHtml = `
        <div class="flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 border-2 border-white shadow-xl text-white font-bold">
          <svg class="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
      `;
      const depotIcon = L.divIcon({
        html: depotHtml,
        className: 'custom-leaflet-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const depotMarker = L.marker([depotLocation.latitude, depotLocation.longitude], { icon: depotIcon });
      depotMarker.bindPopup(`
        <div class="p-2 text-slate-900">
          <div class="text-xs uppercase font-extrabold tracking-wider text-emerald-600 mb-1">HQ Central Depot</div>
          <div class="font-bold text-sm text-slate-800">${depotLocation.address}</div>
          <div class="text-xs text-slate-500 mt-1">Starting point for collection vehicle fleets</div>
        </div>
      `);
      markersGroup.addLayer(depotMarker);
    }

    // 2. Render Dustbins
    const displayedBins = dustbins.filter(bin => {
      if (filterMode === 'critical') return bin.status === 'Critical';
      if (filterMode === 'route' && activeRoute) {
        return activeRoute.stops.some(s => s.dustbin.id === bin.id);
      }
      return true;
    });

    displayedBins.forEach(bin => {
      const isSelected = selectedDustbinId === bin.id;
      const routeStop = activeRoute?.stops.find(s => s.dustbin.id === bin.id);
      const isCritical = routeStop?.tier === 'Critical' || bin.fillLevel >= 70 || bin.status === 'Critical';
      const isNearlyFull = routeStop?.tier === 'Medium' || ((bin.fillLevel >= 40 && bin.fillLevel < 70) || bin.status === 'Nearly Full');

      let pinColor = '#10b981'; // emerald (Low <40%)
      let pulseClass = '';
      if (isCritical) {
        pinColor = '#f43f5e'; // rose (Critical >70%)
        pulseClass = 'pulse-critical';
      } else if (isNearlyFull) {
        pinColor = '#f59e0b'; // amber (Medium 40-70%)
      }

      const markerHtml = `
        <div class="relative group cursor-pointer">
          <div class="custom-dustbin-pin ${pulseClass} ${isSelected ? 'ring-4 ring-offset-2 ring-blue-500 scale-125' : ''}" 
               style="background-color: ${pinColor}; width: 34px; height: 34px; border: 2.5px solid white;">
            ${
              routeStop 
                ? `<span class="text-xs font-black text-white">#${routeStop.stopNumber}</span>`
                : `<span class="text-xs font-bold text-white">${bin.fillLevel}%</span>`
            }
          </div>
          ${bin.activeComplaintCount > 0 ? `
            <div class="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black border border-white">
              !
            </div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-pin',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17]
      });

      const marker = L.marker([bin.latitude, bin.longitude], { icon: customIcon });

      const popupContent = `
        <div class="p-2 min-w-[200px] text-slate-800 font-sans">
          <div class="flex items-center justify-between mb-1.5">
            <span class="font-extrabold text-sm text-slate-900">${bin.id}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isCritical
                ? 'bg-rose-100 text-rose-700'
                : isNearlyFull
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }">
              ${bin.status}
            </span>
          </div>
          <p class="font-semibold text-xs text-slate-700 leading-tight mb-2">${bin.name}</p>
          <div class="bg-slate-100 p-2 rounded-lg mb-2">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-slate-500">Fill Level:</span>
              <span class="font-bold text-slate-800">${bin.fillLevel}%</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full transition-all duration-500 ${
                isCritical ? 'bg-rose-500' : isNearlyFull ? 'bg-amber-500' : 'bg-emerald-500'
              }" style="width: ${bin.fillLevel}%"></div>
            </div>
          </div>
          <div class="text-[11px] text-slate-500 space-y-0.5 mb-2">
            <div>📍 <b>Zone:</b> ${bin.zone}</div>
            <div>🔋 <b>Battery:</b> ${bin.batteryLevel}%</div>
            <div>🕒 <b>Updated:</b> ${new Date(bin.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            ${bin.activeComplaintCount > 0 ? `<div class="text-rose-600 font-semibold">⚠️ ${bin.activeComplaintCount} Active Complaint(s)</div>` : ''}
          </div>
          <button id="inspect-bin-${bin.id}" class="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 rounded-md transition-colors">
            Inspect Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`inspect-bin-${bin.id}`);
        if (btn && onSelectDustbin) {
          btn.onclick = () => onSelectDustbin(bin);
        }
      });

      marker.on('click', () => {
        if (onSelectDustbin) onSelectDustbin(bin);
      });

      markersGroup.addLayer(marker);
    });

    // 3. Render Citizen Public Complaints Markers
    if (showReports) {
      reports
        .filter(r => r.status !== 'Resolved')
        .forEach(rep => {
          const reportIcon = L.divIcon({
            html: `
              <div class="w-7 h-7 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black animate-bounce-soft">
                📢
              </div>
            `,
            className: 'custom-report-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
          });

          const repMarker = L.marker([rep.latitude, rep.longitude], { icon: reportIcon });
          repMarker.bindPopup(`
            <div class="p-2 text-slate-800 font-sans">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">${rep.id}</span>
              <p class="font-bold text-xs mt-1 text-slate-900">${rep.issueType}</p>
              <p class="text-xs text-slate-600 mt-0.5">${rep.location}</p>
              <p class="text-[11px] text-slate-500 mt-1 italic">"${rep.description.slice(0, 60)}..."</p>
            </div>
          `);
          markersGroup.addLayer(repMarker);
        });
    }

    // 4. Render Collection Vehicles
    if (showVehicles) {
      vehicles.forEach(veh => {
        const vehIcon = L.divIcon({
          html: `
            <div class="w-8 h-8 rounded-full ${veh.status === 'On Route' ? 'bg-blue-600' : 'bg-emerald-600'} border-2 border-white shadow-xl flex items-center justify-center text-white text-xs">
              🚛
            </div>
          `,
          className: 'custom-vehicle-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        });

        const vehMarker = L.marker([veh.currentLocation.latitude, veh.currentLocation.longitude], { icon: vehIcon });
        vehMarker.bindPopup(`
          <div class="p-2 font-sans text-slate-800">
            <span class="text-xs font-extrabold text-blue-700">${veh.id} • ${veh.vehicleNumber}</span>
            <div class="font-bold text-xs mt-1">Driver: ${veh.driverName}</div>
            <div class="text-[11px] text-slate-600">Status: <span class="font-semibold">${veh.status}</span></div>
            <div class="text-[11px] text-slate-600">Payload: ${veh.currentLoadKg} / ${veh.capacityKg} kg</div>
          </div>
        `);
        markersGroup.addLayer(vehMarker);
      });
    }

    // 5. Draw Optimized Route Path Polyline if activeRoute exists
    if (activeRoute && activeRoute.stops.length > 0) {
      const latLngs: [number, number][] = [];

      // Depot start
      if (depotLocation) {
        latLngs.push([depotLocation.latitude, depotLocation.longitude]);
      }

      // Ordered stops
      activeRoute.stops.forEach(s => {
        latLngs.push([s.dustbin.latitude, s.dustbin.longitude]);
      });

      // Depot return
      if (depotLocation) {
        latLngs.push([depotLocation.latitude, depotLocation.longitude]);
      }

      // Glow backdrop line
      const routeGlow = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });

      // Sharp dashed foreground line
      const routeLine = L.polyline(latLngs, {
        color: '#1d4ed8',
        weight: 3.5,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      });

      routeGroup.addLayer(routeGlow);
      routeGroup.addLayer(routeLine);
    }
  }, [dustbins, reports, vehicles, activeRoute, depotLocation, filterMode, showVehicles, showReports, selectedDustbinId, onSelectDustbin]);

  // Handle focusing on selected dustbin
  useEffect(() => {
    if (!selectedDustbinId || !mapInstanceRef.current) return;
    const target = dustbins.find(b => b.id === selectedDustbinId);
    if (target) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 16, {
        duration: 0.8
      });
    }
  }, [selectedDustbinId, dustbins]);

  const resetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([13.3440, 74.7430], 14);
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-md bg-white ${className}`}>
      {/* Map Target Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Active Provider Badge */}
      <div className="absolute top-4 right-16 z-[500] hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-semibold text-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>
          {tileProvider === 'google-streets' && '🗺️ Google Maps Streets'}
          {tileProvider === 'google-satellite' && '🛰️ Google Maps Satellite'}
          {tileProvider === 'google-terrain' && '⛰️ Google Maps Terrain'}
          {tileProvider === 'plain-white' && '⬜ White Canvas'}
          {tileProvider === 'osm' && '🌐 OpenStreetMap'}
        </span>
      </div>

      {/* Floating Control Toolbar */}
      {showControls && (
        <div className="absolute top-4 left-4 z-[500] flex flex-wrap gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-lg">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Bins ({dustbins.length})
          </button>
          <button
            onClick={() => setFilterMode('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              filterMode === 'critical'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Critical ({dustbins.filter(b => b.status === 'Critical').length})
          </button>
          {activeRoute && (
            <button
              onClick={() => setFilterMode('route')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterMode === 'route'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Route Stops ({activeRoute.stops.length})
            </button>
          )}
        </div>
      )}

      {/* Toggle Layers Button & Reset Center */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-lg p-1.5 flex flex-col gap-1 items-center">
          <button
            onClick={() => setShowVehicles(v => !v)}
            title="Toggle Vehicle Markers"
            className={`p-2 rounded-lg text-xs flex items-center justify-center transition-colors ${
              showVehicles ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowReports(r => !r)}
            title="Toggle Citizen Complaints"
            className={`p-2 rounded-lg text-xs flex items-center justify-center transition-colors ${
              showReports ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
          
          <div className="w-full h-px bg-slate-200 my-0.5" />

          {/* Map Layer Switching Buttons */}
          <button
            onClick={() => setTileProvider('google-streets')}
            title="Google Maps Streets (Roadmap)"
            className={`p-1.5 rounded-lg text-xs flex items-center justify-center transition-all ${
              tileProvider === 'google-streets'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-[13px] leading-none" role="img" aria-label="Google Streets">🗺️</span>
          </button>

          <button
            onClick={() => setTileProvider('google-satellite')}
            title="Google Maps Satellite (Hybrid Imagery)"
            className={`p-1.5 rounded-lg text-xs flex items-center justify-center transition-all ${
              tileProvider === 'google-satellite'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-[13px] leading-none" role="img" aria-label="Google Satellite">🛰️</span>
          </button>

          <button
            onClick={() => setTileProvider('plain-white')}
            title="Clean White Canvas (Minimalist)"
            className={`p-1.5 rounded-lg text-xs flex items-center justify-center transition-all ${
              tileProvider === 'plain-white'
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-400'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="text-[13px] leading-none" role="img" aria-label="White Canvas">⬜</span>
          </button>

          <div className="w-full h-px bg-slate-200 my-0.5" />

          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={resetView}
            title="Reset Map Center"
            className="p-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-[500] pointer-events-none flex justify-center">
        <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-md text-xs font-medium text-slate-700 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white inline-block shadow-sm"></span>
            <span>Normal (0–50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white inline-block shadow-sm"></span>
            <span>Nearly Full (51–80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white inline-block shadow-sm"></span>
            <span>Critical (&gt;80%)</span>
          </div>
          {activeRoute && (
            <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
              <span className="w-4 h-1 bg-blue-600 rounded inline-block"></span>
              <span>Active Route ({activeRoute.totalDistanceKm} km)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
