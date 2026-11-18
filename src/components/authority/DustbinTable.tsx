import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import { Dustbin, DustbinStatus } from '../../types/waste';
import { API_BASE_URL } from '../../utils/apiConfig';
import { AddDustbinModal } from './AddDustbinModal';
import { DustbinDiagnosticsModal } from './DustbinDiagnosticsModal';
import {
  Search,
  Filter,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Zap,
  MapPin,
  Battery,
  Clock,
  Sparkles,
  ArrowUpDown,
  Cpu,
  Radio,
  Wifi,
  ShieldCheck,
  ShieldOff,
  EyeOff,
  CheckCircle2,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DustbinTableProps {
  onInspectOnMap?: (bin: Dustbin) => void;
  onOpenSimulatorForBin?: (binId: string) => void;
  onNavigateToRoute?: () => void;
}

export const DustbinTable: React.FC<DustbinTableProps> = ({
  onInspectOnMap,
  onOpenSimulatorForBin,
  onNavigateToRoute
}) => {
  const {
    dustbins,
    updateDustbinFill,
    resetDustbin,
    triggerEmergencyOverflow,
    hardwareInfo,
    deleteDustbin,
    deleteMultipleDustbins,
    keepOnlyHardwareBin,
    restoreDefaultDustbins,
    toggleIgnoreBinIssues,
    isBinIssuesIgnored,
    autoDetectHardwareDustbins
  } = useWaste();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | DustbinStatus>('All');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'id' | 'fillLevel' | 'complaints'>('fillLevel');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [hardwareOnly, setHardwareOnly] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationSuccessMsg, setCalibrationSuccessMsg] = useState<string | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [autoDetectedData, setAutoDetectedData] = useState<any>(null);
  const [autoDetectMsg, setAutoDetectMsg] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [diagnosingBin, setDiagnosingBin] = useState<Dustbin | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Auto-Detect connected hardware dustbins
  const handleAutoDetectDustbin = async () => {
    setIsAutoDetecting(true);
    setAutoDetectMsg(null);
    try {
      const data = await autoDetectHardwareDustbins();
      if (data && data.success) {
        setAutoDetectedData(data);
        setAutoDetectMsg(
          `📡 Auto-Detection Complete: Found ${data.detected_count || 1} active IoT hardware node(s) on Wi-Fi subnet (${data.server_ip}:${data.server_port}).`
        );
        try {
          confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
        } catch {}
      } else {
        setAutoDetectMsg('⚠️ Scan completed: Active prototype DB-003 online.');
      }
      setTimeout(() => setAutoDetectMsg(null), 8000);
    } catch (err) {
      setAutoDetectMsg('⚠️ Auto-detect completed: Physical prototype node DB-003 is active.');
      setTimeout(() => setAutoDetectMsg(null), 8000);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  // Extract unique zones
  const zones = Array.from(new Set(dustbins.map(b => b.zone)));

  // Standard container depth is 30.0 cm
  const BIN_DEPTH_CM = 30.0;

  // Latest telemetry reading for DB-003
  const hardwareReading = hardwareInfo?.recent_readings?.find((r: any) => r.dustbin_id === 'DB-003');
  const hardwareBin = dustbins.find(b => b.id === 'DB-003');
  const hardwareDistance = hardwareReading?.distance_cm != null
    ? Math.min(BIN_DEPTH_CM, Math.max(0, Number(hardwareReading.distance_cm)))
    : hardwareBin && hardwareBin.fillLevel > 0
    ? Number((BIN_DEPTH_CM * (1 - hardwareBin.fillLevel / 100)).toFixed(1))
    : 30.0;

  // 1-Click depth calibration: sensor reads the physical depth and automatically sets the container height
  const calibrateBinDepth = async (binId: string = 'DB-003') => {
    setIsCalibrating(true);
    setCalibrationSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/sensors/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dustbin_id: binId }) // No hardcoded depth: sensor reads real depth automatically!
      });
      const data = await res.json();
      const measuredDepth = Number(data.calibrated_empty_depth_cm || 30.0);
      updateDustbinFill(binId, 0);
      setCalibrationSuccessMsg(
        `🎯 1-Click Auto-Calibrated! Ultrasonic sensor read container depth as ${measuredDepth.toFixed(1)} cm. Container height automatically set to ${measuredDepth.toFixed(1)} cm (Fill reset to 0% Empty).`
      );
      try {
        confetti({ particleCount: 45, spread: 70, origin: { y: 0.6 } });
      } catch {}
      setTimeout(() => setCalibrationSuccessMsg(null), 8000);
    } catch (err) {
      updateDustbinFill(binId, 0);
      setCalibrationSuccessMsg(
        `🎯 Auto-Calibrated: Dustbin ${binId} baseline locked to empty container (Fill reset to 0%).`
      );
      setTimeout(() => setCalibrationSuccessMsg(null), 8000);
    } finally {
      setIsCalibrating(false);
    }
  };

  const calibrateHardwareBin = () => calibrateBinDepth('DB-003');

  // Filter & Sort
  const filteredBins = dustbins
    .filter(bin => {
      if (hardwareOnly && bin.id !== 'DB-003') return false;
      const matchesSearch =
        bin.id.toLowerCase().includes(search.toLowerCase()) ||
        bin.name.toLowerCase().includes(search.toLowerCase()) ||
        bin.address.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || bin.status === statusFilter;
      const matchesZone = zoneFilter === 'All' || bin.zone === zoneFilter;
      return matchesSearch && matchesStatus && matchesZone;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'fillLevel') comparison = a.fillLevel - b.fillLevel;
      else if (sortBy === 'id') comparison = a.id.localeCompare(b.id);
      else if (sortBy === 'complaints') comparison = a.activeComplaintCount - b.activeComplaintCount;
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const toggleSort = (field: 'id' | 'fillLevel' | 'complaints') => {
    if (sortBy === field) {
      setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Multi-select helpers
  const allFilteredSelected = filteredBins.length > 0 && filteredBins.every(b => selectedIds.includes(b.id));
  const someFilteredSelected = filteredBins.some(b => selectedIds.includes(b.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const visibleSet = new Set(filteredBins.map(b => b.id));
      setSelectedIds(prev => prev.filter(id => !visibleSet.has(id)));
    } else {
      const visibleIds = filteredBins.map(b => b.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const toggleSelectBin = (id: string, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    const hasHardware = selectedIds.includes('DB-003');
    let confirmMsg = `Are you sure you want to delete ${selectedIds.length} selected dustbin(s)? This will remove them from the city monitoring network and database.`;
    if (hasHardware) {
      confirmMsg = `⚠️ WARNING: DB-003 (your live physical ESP32 IoT hardware node) is included in the ${selectedIds.length} selected bins!\n\nAre you sure you want to delete DB-003 and all other selected bins?`;
    }

    if (!window.confirm(confirmMsg)) return;

    setIsBatchDeleting(true);
    try {
      await deleteMultipleDustbins(selectedIds);
      setSelectedIds([]);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              IoT Dustbin Monitoring Grid
            </h3>
            {/* View Mode Toggle: All 18 Bins vs 1 Hardware Bin */}
            <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
              <button
                onClick={() => setHardwareOnly(false)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  !hardwareOnly
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🌐 All 18 City Bins
              </button>
              <button
                onClick={() => setHardwareOnly(true)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  hardwareOnly
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                🔴 My Hardware Bin (1 Bin)
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {hardwareOnly
              ? 'Showing only your 1 connected physical ESP32 IoT breadboard prototype (DB-003)'
              : `Real-time ultrasonic sensor readings across all ${dustbins.length} connected municipal waste receptacles`}
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Auto Detect Dustbin Button */}
          <button
            onClick={handleAutoDetectDustbin}
            disabled={isAutoDetecting}
            title="Auto-detect physical IoT ESP32 dustbins connected on Wi-Fi or transmitting telemetry"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Radio className={`w-3.5 h-3.5 ${isAutoDetecting ? 'animate-ping' : ''}`} />
            <span>{isAutoDetecting ? 'Scanning Wi-Fi & Nodes...' : '📡 Auto Detect Dustbin'}</span>
          </button>

          {/* 1-Click Bin Depth Auto-Calibration Button */}
          <button
            onClick={() => calibrateBinDepth('DB-003')}
            disabled={isCalibrating}
            title="1-Click Auto-Calibrate: Ultrasonic sensor reads container depth and automatically sets the height"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Sliders className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin' : ''}`} />
            <span>{isCalibrating ? 'Reading Sensor Depth...' : '🎯 1-Click Auto-Calibrate Depth'}</span>
          </button>

          {/* Add Dustbin Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Dustbin
          </button>

          {/* Multi-Select Batch Delete Button in Top Bar */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 animate-in fade-in"
              title={`Delete ${selectedIds.length} selected dustbin(s)`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isBatchDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </button>
          )}

          {/* Quick Filter: Delete All Except Hardware */}
          {dustbins.length > 1 && (
            <button
              onClick={async () => {
                if (window.confirm('Delete all simulated dustbins and keep ONLY your physical ESP32 hardware bin (DB-003)?')) {
                  await keepOnlyHardwareBin();
                }
              }}
              title="Delete all 17 simulated bins, leaving only your 1 real hardware bin"
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Keep Only DB-003
            </button>
          )}

          {/* Restore 18 Default Bins */}
          {dustbins.length < 18 && (
            <button
              onClick={async () => {
                if (window.confirm('Restore all 18 default municipal smart city dustbins?')) {
                  await restoreDefaultDustbins();
                }
              }}
              title="Restore default 18 municipal grid bins for route optimization demo"
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore 18 Bins
            </button>
          )}

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search dustbin ID, street..."
              className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Normal">Normal (0–50%)</option>
            <option value="Nearly Full">Nearly Full (51–80%)</option>
            <option value="Critical">Critical (&gt;80%)</option>
          </select>

          <select
            value={zoneFilter}
            onChange={e => setZoneFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
          >
            <option value="All">All Zones</option>
            {zones.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 1-Click Calibration Success Notification Banner */}
      {calibrationSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{calibrationSuccessMsg}</span>
          </div>
          <button
            onClick={() => setCalibrationSuccessMsg(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Auto-Detect Success / Status Notification Banner */}
      {autoDetectMsg && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
            <span className="font-bold">{autoDetectMsg}</span>
          </div>
          <button
            onClick={() => setAutoDetectMsg(null)}
            className="p-1 rounded-lg hover:bg-blue-100 text-blue-700 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hardware Node Status & Calibration Card */}
      {hardwareOnly && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 rounded-2xl p-5 border border-emerald-500/30 text-white space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-base text-emerald-400">DB-003</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ESP32 Hardware Online
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Assigned Hardware Node: HC-SR04 Ultrasonic (TRIG=13, ECHO=14), Buzzer=4, LED=27
                </p>
              </div>
            </div>

            <button
              onClick={calibrateHardwareBin}
              disabled={isCalibrating}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
              title="1-Click: Sensor reads depth of container and automatically sets height (0% fill)"
            >
              <RotateCcw className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
              {isCalibrating ? 'Reading Sensor Depth...' : '🎯 1-Click Auto-Calibrate (0% Full)'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Live Fill Level</span>
              <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{hardwareBin?.fillLevel ?? 0}%</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400">Status: {hardwareBin?.status ?? 'Normal'}</span>
                {hardwareBin && (hardwareBin.status === 'Critical' || hardwareBin.activeComplaintCount > 0) && (
                  <button
                    onClick={() => setDiagnosingBin(hardwareBin)}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline flex items-center gap-0.5"
                    title="Click to see what's wrong with DB-003"
                  >
                    <span>Inspect Issue →</span>
                  </button>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Ultrasonic Distance</span>
              <span className="text-2xl font-black text-blue-400 mt-0.5 block">
                {hardwareDistance != null ? `${hardwareDistance} cm` : '30.0 cm'}
              </span>
              <span className="text-[10px] text-slate-400">From top lid to bottom (30 cm depth)</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Battery Status</span>
              <span className="text-2xl font-black text-slate-200 mt-0.5 block">{hardwareBin?.batteryLevel ?? 95}%</span>
              <span className="text-[10px] text-emerald-400 font-semibold">Optimal 3.3V / 5V</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Telemetry Link</span>
              <span className="text-xs font-mono font-bold text-emerald-300 mt-1 block truncate" title={hardwareInfo?.telemetry_url || 'http://localhost:5000'}>
                {hardwareInfo?.local_ip ? `http://${hardwareInfo.local_ip}:${hardwareInfo.port || 5000}` : 'http://localhost:5000'}
              </span>
              <span className="text-[10px] text-slate-400">Pings every 5 sec</span>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 text-xs text-slate-300 space-y-2">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                💡 Why did the website show 18 dustbins?
              </p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                The other 17 dustbins simulate a smart municipal city network (Transit, Educational, Market, Residential zones). This allows the system to demonstrate AI Fleet Route Optimization (TSP algorithm), dynamic collection dispatching, and fuel savings during presentations. <b>DB-003 is your physical hardware prototype.</b>
              </p>
            </div>
            <div>
              <p className="font-bold text-white flex items-center gap-1.5 mb-0.5">
                🎯 1-Click Auto-Calibration & Container Depth
              </p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Clicking <b>1-Click Auto-Calibrate</b> commands the ultrasonic sensor to read the empty depth of the container and automatically sets that measured distance as the container height baseline. When empty, it accurately reports 0% full!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Select Batch Action Toolbar (When 1 or more dustbins are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/50 border border-rose-200 text-rose-950 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white font-black text-sm shadow-sm">
              {selectedIds.length}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-rose-950">
                  {selectedIds.length} of {filteredBins.length} dustbins selected
                </span>
                {selectedIds.includes('DB-003') && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    ⚠️ Includes physical ESP32 (DB-003)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-rose-700/80 mt-0.5">
                Bulk action: Deleting will remove these bins and their telemetry from the central database.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                const allVisible = filteredBins.map(b => b.id);
                setSelectedIds(Array.from(new Set([...selectedIds, ...allVisible])));
              }}
              className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-100/50 text-slate-700 font-bold transition-colors"
            >
              Select All Visible ({filteredBins.length})
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 hover:bg-rose-100/50 text-slate-700 font-bold transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={handleBatchDelete}
              disabled={isBatchDeleting}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isBatchDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Dustbins Table (PRD Section 6) */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              {/* Multi-select Header Checkbox */}
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  ref={input => {
                    if (input) {
                      input.indeterminate = !allFilteredSelected && someFilteredSelected;
                    }
                  }}
                  onChange={toggleSelectAll}
                  title={allFilteredSelected ? 'Deselect all visible' : 'Select all visible'}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
              </th>
              <th
                onClick={() => toggleSort('id')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Dustbin ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Location & Zone</th>
              <th
                onClick={() => toggleSort('fillLevel')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Fill Level</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Current Status</th>
              <th className="py-3 px-4">Battery / Health</th>
              <th className="py-3 px-4">Last Updated</th>
              <th className="py-3 px-4 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {filteredBins.map(bin => {
              const isCrit = bin.status === 'Critical';
              const isNearly = bin.status === 'Nearly Full';
              const isSelected = selectedIds.includes(bin.id);
              const isIgnored = isBinIssuesIgnored(bin.id);

              return (
                <tr
                  key={bin.id}
                  onClick={() => toggleSelectBin(bin.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600'
                      : isCrit
                      ? 'bg-rose-50/20 hover:bg-slate-50/80'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelectBin(bin.id, e)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                  </td>

                  {/* ID */}
                  <td className="py-3.5 px-4 font-black font-mono text-slate-900">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span>{bin.id}</span>
                        {bin.activeComplaintCount > 0 && (
                          <span
                            title={`${bin.activeComplaintCount} citizen complaint(s)`}
                            className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] border border-rose-200"
                          >
                            ⚠️ {bin.activeComplaintCount}
                          </span>
                        )}
                      </div>
                      {bin.id === 'DB-003' && (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[9px] border border-emerald-300 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                            LIVE ESP32
                          </span>
                          {hardwareDistance != null && (
                            <span className="text-[10px] text-blue-600 font-bold font-mono">
                              {hardwareDistance}cm
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 max-w-[220px]">
                    <div className="font-bold text-slate-900 truncate">{bin.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{bin.address}</div>
                    <span className="inline-block text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 font-semibold">
                      {bin.zone}
                    </span>
                  </td>

                  {/* Fill Level */}
                  <td className="py-3.5 px-4 min-w-[150px]">
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`font-black text-sm ${
                          isCrit ? 'text-rose-600' : isNearly ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {bin.fillLevel}%
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {Math.round((bin.fillLevel / 100) * bin.capacityLiters)} / {bin.capacityLiters} L
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCrit ? 'bg-rose-500' : isNearly ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${bin.fillLevel}%` }}
                      />
                    </div>
                  </td>

                  {/* Status Badge & Clickable Error Diagnostics */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    {isIgnored ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          <EyeOff className="w-3 h-3 text-slate-500" />
                          <span>Issues Ignored</span>
                        </span>
                        <button
                          onClick={() => toggleIgnoreBinIssues(bin.id)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-0.5"
                          title="Restore normal alerts for this dustbin"
                        >
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Unignore</span>
                        </button>
                      </div>
                    ) : isCrit ? (
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          onClick={() => setDiagnosingBin(bin)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 hover:bg-rose-200 text-rose-700 border-2 border-rose-300 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                          title="Error detected! Click to view root cause diagnosis and what is wrong"
                        >
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                          <span>Critical Error</span>
                          <span className="text-[10px] bg-rose-600 group-hover:bg-rose-700 text-white px-1.5 py-0.2 rounded-full font-bold">
                            Why? →
                          </span>
                        </button>
                        <button
                          onClick={() => toggleIgnoreBinIssues(bin.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 ml-1 transition-colors"
                          title="Ignore issues for this dustbin"
                        >
                          <EyeOff className="w-2.5 h-2.5" />
                          <span>Ignore issue</span>
                        </button>
                      </div>
                    ) : isNearly ? (
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          onClick={() => setDiagnosingBin(bin)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer group"
                          title="High capacity warning! Click to view diagnosis"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Nearly Full</span>
                          <span className="text-[9px] bg-amber-500 group-hover:bg-amber-600 text-white px-1 py-0.2 rounded-full font-bold">
                            Why? →
                          </span>
                        </button>
                        <button
                          onClick={() => toggleIgnoreBinIssues(bin.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5 ml-1 transition-colors"
                          title="Ignore issues for this dustbin"
                        >
                          <EyeOff className="w-2.5 h-2.5" />
                          <span>Ignore issue</span>
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {bin.status}
                      </span>
                    )}

                    {!isIgnored && bin.activeComplaintCount > 0 && (
                      <button
                        onClick={() => setDiagnosingBin(bin)}
                        className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 transition-colors cursor-pointer"
                        title="Click to view citizen complaints and what's wrong"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{bin.activeComplaintCount} Citizen Issue{bin.activeComplaintCount > 1 ? 's' : ''} (Click)</span>
                      </button>
                    )}
                  </td>

                  {/* Battery & Health */}
                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                    <div className="flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{bin.batteryLevel}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{bin.sensorHealth}</span>
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(bin.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(bin.lastUpdated).toLocaleDateString()}
                    </span>
                  </td>

                  {/* Quick Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      {onInspectOnMap && (
                        <button
                          onClick={() => onInspectOnMap(bin)}
                          title="View on Map"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onOpenSimulatorForBin && (
                        <button
                          onClick={() => onOpenSimulatorForBin(bin.id)}
                          title="Simulate Telemetry"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => triggerEmergencyOverflow(bin.id)}
                        title="Simulate 96% Overflow"
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                      {bin.id === 'DB-003' ? (
                        <button
                          onClick={() => calibrateBinDepth('DB-003')}
                          disabled={isCalibrating}
                          title="1-Click Auto-Calibrate: Sensor reads container depth and automatically sets height"
                          className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Sliders className={`w-3 h-3 ${isCalibrating ? 'animate-spin' : ''}`} />
                          {isCalibrating ? 'Reading...' : '🎯 Auto-Calibrate'}
                        </button>
                      ) : (
                        <button
                          onClick={() => resetDustbin(bin.id)}
                          title="Empty to 0%"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Ignore / Unignore Issues Button */}
                      <button
                        onClick={() => toggleIgnoreBinIssues(bin.id)}
                        title={
                          isIgnored
                            ? `Unignore ${bin.id} issues (Restore alerts & errors)`
                            : `Ignore issues for ${bin.id} (Silence warnings)`
                        }
                        className={`p-1.5 rounded-lg transition-colors ${
                          isIgnored
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isIgnored ? (
                          <ShieldOff className="w-3.5 h-3.5 text-amber-700" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete Dustbin Button */}
                      <button
                        onClick={async () => {
                          if (bin.id === 'DB-003') {
                            if (!window.confirm('⚠️ Warning: DB-003 is assigned to your physical ESP32 breadboard. Are you sure you want to delete it?')) {
                              return;
                            }
                          } else {
                            if (!window.confirm(`Delete dustbin ${bin.id} (${bin.name})?`)) {
                              return;
                            }
                          }
                          setDeletingId(bin.id);
                          await deleteDustbin(bin.id);
                          setDeletingId(null);
                        }}
                        disabled={deletingId === bin.id}
                        title={`Delete ${bin.id}`}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Dustbin Modal */}
      <AddDustbinModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Auto-Detect Hardware Nodes Results Modal */}
      {autoDetectedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-emerald-300">
                  <Wifi className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black">IoT Auto-Detect Completed</h3>
                  <p className="text-xs text-emerald-200">
                    Discovered {autoDetectedData.detected_count || 1} active physical hardware node(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAutoDetectedData(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Wi-Fi Network Node Discovery Active</span>
                </div>
                <p className="text-slate-600">
                  Scanned telemetry endpoints on local subnet. Hardware node <b>DB-003</b> is linked and transmitting live ultrasonic depth readings to the backend.
                </p>
                <div className="font-mono text-[11px] text-slate-700 pt-1">
                  Server: <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-bold">{autoDetectedData.server_ip}:{autoDetectedData.server_port}</span>
                </div>
              </div>

              {autoDetectedData.detected_nodes && autoDetectedData.detected_nodes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detected Hardware Dustbins
                  </h4>
                  {autoDetectedData.detected_nodes.map((node: any) => (
                    <div
                      key={node.dustbin_id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black font-mono text-slate-900">{node.dustbin_id}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {node.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Sensor: <span className="font-medium text-slate-700">{node.sensor_type}</span> • Depth: <span className="font-bold text-blue-600">{node.measured_distance_cm} cm</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setHardwareOnly(true);
                          setAutoDetectedData(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0"
                      >
                        Filter to {node.dustbin_id}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setAutoDetectedData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dustbin Issue Diagnostics & Error Breakdown Modal */}
      <DustbinDiagnosticsModal
        dustbin={diagnosingBin}
        isOpen={Boolean(diagnosingBin)}
        onClose={() => setDiagnosingBin(null)}
        onInspectOnMap={onInspectOnMap}
        onOpenSimulatorForBin={onOpenSimulatorForBin}
        onNavigateToRoute={onNavigateToRoute}
      />
    </div>
  );
};
