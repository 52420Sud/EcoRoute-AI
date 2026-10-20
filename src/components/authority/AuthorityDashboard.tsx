import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import { AnalyticsCharts } from './AnalyticsCharts';
import { DustbinTable } from './DustbinTable';
import { InteractiveMap } from '../map/InteractiveMap';
import { Dustbin } from '../../types/waste';
import {
  Archive,
  AlertTriangle,
  FileText,
  Truck,
  TrendingUp,
  Cpu,
  Route,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Sliders
} from 'lucide-react';

interface AuthorityDashboardProps {
  onNavigateToTab: (tab: 'dustbins' | 'reports' | 'alerts' | 'map' | 'route' | 'vehicles' | 'history') => void;
  onOpenSimulatorForBin?: (binId: string) => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  onNavigateToTab,
  onOpenSimulatorForBin
}) => {
  const { dustbins, reports, alerts, activeRoute, depotLocation, hardwareInfo } = useWaste();

  const [selectedDustbin, setSelectedDustbin] = useState<Dustbin | null>(null);
  const [dashboardMode, setDashboardMode] = useState<'city' | 'hardware'>('city');

  const hardwareReading = hardwareInfo?.recent_readings?.find((r: any) => r.dustbin_id === 'DB-003');
  const hardwareDistance = hardwareReading?.distance_cm;
  const hardwareBin = dustbins.find(b => b.id === 'DB-003');

  // Core Statistics (PRD Section 8)
  const totalDustbins = dustbins.length;
  const normalDustbins = dustbins.filter(b => b.status === 'Normal').length;
  const nearlyFullDustbins = dustbins.filter(b => b.status === 'Nearly Full').length;
  const criticalDustbins = dustbins.filter(b => b.status === 'Critical').length;
  const activeReports = reports.filter(r => r.status !== 'Resolved').length;
  const resolvedReports = reports.filter(r => r.status === 'Resolved').length;
  const pendingCollections = criticalDustbins + nearlyFullDustbins;

  const displayedDustbins = dashboardMode === 'hardware' && hardwareBin ? [hardwareBin] : dustbins;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Quick Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-emerald-400 text-xs font-bold mb-2">
            <Cpu className="w-3.5 h-3.5" />
            Central Municipal Waste Monitoring & Logistics Node
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Authority Command Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500">
            Real-time IoT telemetry, automated fill-level alerts, public complaints, and AI route generation
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: All 18 Bins vs 1 Hardware Bin */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs shadow-inner">
            <button
              onClick={() => setDashboardMode('city')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                dashboardMode === 'city'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🌐 All 18 City Bins
            </button>
            <button
              onClick={() => setDashboardMode('hardware')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                dashboardMode === 'hardware'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🔴 My Hardware Bin (1 Bin)
            </button>
          </div>

          <button
            onClick={() => onNavigateToTab('route')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Route className="w-4 h-4" />
            Open Route Optimizer
          </button>
        </div>
      </div>

      {/* Dashboard Statistics Cards (PRD Section 8) */}
      {dashboardMode === 'hardware' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Hardware ID */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/30 shadow-md text-white">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Node ID
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              DB-003
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ESP32 Online
            </span>
          </div>

          {/* Fill Level */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Live Fill Level
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              {hardwareBin?.fillLevel ?? 0}%
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {hardwareBin?.status ?? 'Normal'}
            </span>
          </div>

          {/* Measured Distance */}
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 shadow-sm">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Sensor Distance
            </span>
            <div className="text-2xl font-black text-blue-700 mt-0.5">
              {hardwareDistance != null ? `${hardwareDistance} cm` : '50.3 cm'}
            </div>
            <span className="text-[10px] text-blue-600 block mt-1">HC-SR04 Ultrasonic</span>
          </div>

          {/* Status */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Current State
            </span>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {hardwareBin?.status ?? 'Normal'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Operational</span>
          </div>

          {/* Battery */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Battery / Power
            </span>
            <div className="text-2xl font-black text-slate-800 mt-0.5">
              {hardwareBin?.batteryLevel ?? 95}%
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">USB / 5V VIN</span>
          </div>

          {/* Location */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Municipal Zone
            </span>
            <div className="text-lg font-black text-slate-800 mt-1 truncate">
              {hardwareBin?.zone ?? 'Transit Sector'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">City Bus Stand</span>
          </div>

          {/* Total Bins in HW mode */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Active Hardware
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              1 / 1 Bin
            </div>
            <span className="text-[10px] text-emerald-600 block mt-1">Physical Prototype</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* Total Dustbins */}
          <div
            onClick={() => onNavigateToTab('dustbins')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-400 transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Bins
            </span>
            <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors mt-0.5">
              {totalDustbins}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">100% Online</span>
          </div>

          {/* Normal Dustbins */}
          <div
            onClick={() => onNavigateToTab('dustbins')}
            className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 shadow-sm hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Normal
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-0.5">
              {normalDustbins}
            </div>
            <span className="text-[10px] text-emerald-600 block mt-1">0–50% Fill</span>
          </div>

          {/* Nearly Full Dustbins */}
          <div
            onClick={() => onNavigateToTab('dustbins')}
            className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Nearly Full
            </span>
            <div className="text-2xl font-black text-amber-700 mt-0.5">
              {nearlyFullDustbins}
            </div>
            <span className="text-[10px] text-amber-600 block mt-1">51–80% Fill</span>
          </div>

          {/* Critical Dustbins */}
          <div
            onClick={() => onNavigateToTab('dustbins')}
            className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-sm hover:border-rose-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                Critical
              </span>
              {criticalDustbins > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              )}
            </div>
            <div className="text-2xl font-black text-rose-700 mt-0.5">
              {criticalDustbins}
            </div>
            <span className="text-[10px] text-rose-600 block mt-1">&gt; 80% Action Req.</span>
          </div>

          {/* Active Reports */}
          <div
            onClick={() => onNavigateToTab('reports')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-400 transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Reports
            </span>
            <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors mt-0.5">
              {activeReports}
            </div>
            <span className="text-[10px] text-amber-600 block mt-1">Citizen Complaints</span>
          </div>

          {/* Resolved Reports */}
          <div
            onClick={() => onNavigateToTab('reports')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-400 transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Resolved
            </span>
            <div className="text-2xl font-black text-teal-600 mt-0.5">
              {resolvedReports}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Grievances Solved</span>
          </div>

          {/* Pending Collections */}
          <div
            onClick={() => onNavigateToTab('route')}
            className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 shadow-sm hover:border-blue-400 transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Pending Queue
            </span>
            <div className="text-2xl font-black text-blue-700 mt-0.5">
              {pendingCollections}
            </div>
            <span className="text-[10px] text-blue-600 block mt-1">High + Medium</span>
          </div>
        </div>
      )}

      {/* Interactive Map Live Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2 flex-wrap">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Live GIS Dustbin & Fleet Tracking Map</span>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Google Maps Live</span>
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Interactive map displaying dustbin fill markers, citizen complaint locations, and optimized vehicle collection polylines
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('map')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Fullscreen View <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <InteractiveMap
          dustbins={displayedDustbins}
          reports={dashboardMode === 'hardware' ? reports.filter(r => r.dustbinId === 'DB-003') : reports}
          activeRoute={activeRoute}
          depotLocation={depotLocation}
          selectedDustbinId={selectedDustbin?.id || (dashboardMode === 'hardware' ? 'DB-003' : undefined)}
          onSelectDustbin={bin => setSelectedDustbin(bin)}
          className="h-[460px]"
        />
      </div>

      {/* Analytics Charts Section (PRD Section 22) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Automated Analytics & Operational Reports (PRD §22)
          </h3>
          <p className="text-xs text-slate-500">
            Real-time aggregate data on fill distributions, historical collections, and zone risk indicators
          </p>
        </div>

        <AnalyticsCharts />
      </div>

      {/* Dustbins Quick Monitoring Grid */}
      <DustbinTable
        onInspectOnMap={bin => {
          setSelectedDustbin(bin);
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }}
        onOpenSimulatorForBin={onOpenSimulatorForBin}
      />
    </div>
  );
};
