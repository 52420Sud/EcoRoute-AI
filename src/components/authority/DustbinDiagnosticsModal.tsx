import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
  MapPin,
  Battery,
  Cpu,
  Clock,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  FileText,
  Sparkles,
  RotateCcw,
  Route,
  Sliders,
  Scale
} from 'lucide-react';
import { Dustbin } from '../../types/waste';
import { useWaste } from '../../context/WasteContext';
import { estimateWasteWeightKg } from '../../utils/geoUtils';

interface DustbinDiagnosticsModalProps {
  dustbin: Dustbin | null;
  isOpen: boolean;
  onClose: () => void;
  onInspectOnMap?: (dustbin: Dustbin) => void;
  onOpenSimulatorForBin?: (binId: string) => void;
  onNavigateToRoute?: () => void;
}

export const DustbinDiagnosticsModal: React.FC<DustbinDiagnosticsModalProps> = ({
  dustbin,
  isOpen,
  onClose,
  onInspectOnMap,
  onOpenSimulatorForBin,
  onNavigateToRoute
}) => {
  const {
    reports,
    alerts,
    updateDustbinFill,
    resetDustbin,
    hardwareInfo,
    calibrateDustbinDepth,
    toggleIgnoreBinIssues,
    isBinIssuesIgnored
  } = useWaste();
  const [isCalibratingModal, setIsCalibratingModal] = React.useState(false);
  const [calibrateMsg, setCalibrateMsg] = React.useState<string | null>(null);

  // Keyboard shortcut: close window on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dustbin) return null;

  const isIgnored = isBinIssuesIgnored(dustbin.id);

  // Determine all issues / errors
  const isCritical = dustbin.fillLevel >= 80 || dustbin.status === 'Critical';
  const isNearlyFull = !isCritical && (dustbin.fillLevel >= 50 || dustbin.status === 'Nearly Full');
  const hasComplaints = dustbin.activeComplaintCount > 0;
  const isLowBattery = dustbin.batteryLevel < 20;
  const isSensorFault = dustbin.sensorHealth !== 'Optimal';

  // Associated citizen reports
  const binReports = reports.filter(r => r.dustbinId === dustbin.id && r.status !== 'Resolved');
  // Associated alerts
  const binAlerts = alerts.filter(a => a.dustbinId === dustbin.id);

  // Ultrasonic sensor distance calculation based on standard 30.0 cm container height
  const BIN_DEPTH_CM = 30.0;
  const hardwareReading = dustbin.id === 'DB-003'
    ? hardwareInfo?.recent_readings?.find((r: any) => r.dustbin_id === 'DB-003')
    : null;

  const currentDistanceCm = hardwareReading?.distance_cm != null
    ? Math.min(BIN_DEPTH_CM, Math.max(0, Number(hardwareReading.distance_cm)))
    : Number((BIN_DEPTH_CM * (1 - (dustbin.fillLevel || 0) / 100)).toFixed(1));

  const estimatedWeightKg = estimateWasteWeightKg(dustbin.fillLevel, dustbin.capacityLiters);

  const handleEmptyBin = () => {
    resetDustbin(dustbin.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 cursor-default"
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Modal Header with Prominent Window Control Button */}
        <div className={`p-6 border-b text-white flex items-start justify-between shrink-0 rounded-t-3xl ${
          isCritical
            ? 'bg-gradient-to-r from-rose-600 to-red-700'
            : isNearlyFull
            ? 'bg-gradient-to-r from-amber-500 to-orange-600'
            : hasComplaints
            ? 'bg-gradient-to-r from-purple-600 to-indigo-700'
            : 'bg-gradient-to-r from-emerald-600 to-teal-700'
        }`}>
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 tracking-wider">
                {dustbin.id} Diagnostics
              </span>
              {dustbin.id === 'DB-003' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> ESP32 Physical Prototype
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              {isCritical ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-300 animate-bounce" />
                  Critical Error: Waste Overflow Hazard
                </>
              ) : isNearlyFull ? (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-200" />
                  Warning: High Capacity Approaching Limit
                </>
              ) : hasComplaints ? (
                <>
                  <ShieldAlert className="w-5 h-5 text-purple-200" />
                  Citizen Grievances Reported
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  Dustbin Operational (Normal Status)
                </>
              )}
            </h2>
            <p className="text-xs text-white/80">
              {dustbin.name} • {dustbin.zone}
            </p>
          </div>

          {/* Primary Top Window Control Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="px-3 py-2 rounded-xl bg-black/25 hover:bg-black/45 text-white border border-white/30 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md font-bold text-xs shrink-0"
            title="Close Window (Esc)"
            aria-label="Close Window"
          >
            <span>Close</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 space-y-6 text-slate-700 text-sm overflow-y-auto flex-1">
          {calibrateMsg && (
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{calibrateMsg}</span>
            </div>
          )}

          {/* Ignored Issues Status Alert */}
          {isIgnored && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Issues for this dustbin are currently <b>Ignored / Silenced</b> by Authority. Active alarms and priority dispatches are suppressed.
                </span>
              </div>
              <button
                onClick={() => toggleIgnoreBinIssues(dustbin.id)}
                className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-900 font-extrabold text-[11px] shrink-0 transition-colors"
              >
                Unignore
              </button>
            </div>
          )}

          {/* Section 1: "What is Wrong?" Plain-English Root Cause Analysis */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-rose-600" />
              Root Cause Analysis: What is Wrong?
            </h3>

            <div className="space-y-1.5 text-xs text-slate-800">
              {isCritical && (
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                  <p>
                    <b>Critical Capacity Breached ({dustbin.fillLevel}%):</b> The ultrasonic sensor mounted under the top lid detected garbage at only <b>{currentDistanceCm} cm</b>. In this standard <b>30 cm container</b>, {Number(30 - currentDistanceCm).toFixed(1)} cm is packed with waste. Waste overflow onto the pavement is occurring or imminent.
                  </p>
                </div>
              )}

              {isNearlyFull && (
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <p>
                    <b>High Fill Level Warning ({dustbin.fillLevel}%):</b> Bin capacity is between 50% and 80%. At the current fill rate, overflow is projected within 2–4 hours unless collected in the upcoming route loop.
                  </p>
                </div>
              )}

              {hasComplaints && (
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600 mt-1 shrink-0" />
                  <p>
                    <b>{dustbin.activeComplaintCount} Active Citizen Complaint(s):</b> Local residents or passengers submitted geo-tagged reports citing trash overflow, odor, or hygiene violations at this specific bin location.
                  </p>
                </div>
              )}

              {isLowBattery && (
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                  <p>
                    <b>Low Battery Voltage ({dustbin.batteryLevel}%):</b> Power rail dropped below 20%. The ultrasonic transducer may experience measurement jitter or communication dropouts if not recharged.
                  </p>
                </div>
              )}

              {isSensorFault && (
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600 mt-1 shrink-0" />
                  <p>
                    <b>Sensor Health Degradation:</b> Telemetry reports status <i>{dustbin.sensorHealth}</i>. Ultrasonic echo timing may require lens cleaning or hardware check.
                  </p>
                </div>
              )}

              {!isCritical && !isNearlyFull && !hasComplaints && !isLowBattery && !isSensorFault && (
                <div className="flex items-start gap-2 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p>
                    <b>No active errors detected!</b> Ultrasonic distance is healthy at {currentDistanceCm} cm in the 30 cm depth container, fill level is normal ({dustbin.fillLevel}%), and battery is optimal.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Sensor & Hardware Telemetry Diagnostic Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Live IoT Telemetry & Container Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Live Fill Level</span>
                <span className={`text-2xl font-black mt-0.5 block ${isCritical ? 'text-rose-600' : isNearlyFull ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {dustbin.fillLevel}%
                </span>
                <span className="text-[10px] text-slate-500">Threshold: 80%</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] text-blue-700 uppercase font-bold block">Ultrasonic Distance</span>
                <span className="text-2xl font-black text-blue-700 mt-0.5 block">
                  {currentDistanceCm} cm
                </span>
                <span className="text-[10px] text-blue-600">Depth Baseline: 30 cm</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Weight</span>
                <span className="text-2xl font-black text-slate-800 mt-0.5 block flex items-center gap-1">
                  <Scale className="w-4 h-4 text-slate-400" />
                  {estimatedWeightKg} kg
                </span>
                <span className="text-[10px] text-slate-500">Vol: {dustbin.capacityLiters} L</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Battery Voltage</span>
                <span className={`text-2xl font-black mt-0.5 block flex items-center gap-1 ${isLowBattery ? 'text-rose-600' : 'text-emerald-600'}`}>
                  <Battery className="w-4 h-4" />
                  {dustbin.batteryLevel}%
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">{dustbin.sensorHealth}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Citizen Grievances & Evidence */}
          {binReports.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                Active Public Complaints For This Dustbin ({binReports.length})
              </h4>
              <div className="space-y-2">
                {binReports.map(rep => (
                  <div key={rep.id} className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 flex gap-3 text-xs">
                    {rep.photo && (
                      <img
                        src={rep.photo}
                        alt="Citizen proof"
                        className="w-16 h-16 rounded-xl object-cover border border-purple-300 shrink-0"
                      />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-900">{rep.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-bold text-[10px]">
                          {rep.issueType}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rep.createdAt).toLocaleDateString()} {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 italic">"{rep.description}"</p>
                      <p className="text-[10px] text-slate-500">
                        Reported by: <b>{rep.reporterName || 'Citizen'}</b> ({rep.reporterPhone || 'Verified SMS'})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: System Alerts Log */}
          {binAlerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Triggered System Alerts
              </h4>
              <div className="space-y-1.5 text-xs">
                {binAlerts.map(alt => (
                  <div key={alt.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="font-semibold text-slate-800">{alt.title}:</span>
                      <span className="text-slate-600">{alt.message}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: AI Operational Recommendation */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5 text-xs text-emerald-950">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              AI Fleet Recommendation
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {isCritical
                ? `Immediate collection dispatch is recommended for ${dustbin.name}. Adding this bin to the automated TSP route prioritizes it with 0 extra detours.`
                : isNearlyFull
                ? `Schedule ${dustbin.name} in the afternoon collection cycle to prevent peak-hour overflow.`
                : `Normal monitoring active. Telemetry pings arrive every 5 seconds.`}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-semibold pt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Location: {dustbin.address} ({dustbin.latitude.toFixed(4)}° N, {dustbin.longitude.toFixed(4)}° E)</span>
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer with Window Control Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 shrink-0 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Window Control: Secondary Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Close this window (Esc)"
            >
              <X className="w-3.5 h-3.5 text-slate-600" />
              <span>Close Window</span>
            </button>

            {onInspectOnMap && (
              <button
                type="button"
                onClick={() => {
                  onInspectOnMap(dustbin);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Show on GIS Map
              </button>
            )}

            {onOpenSimulatorForBin && (
              <button
                type="button"
                onClick={() => {
                  onOpenSimulatorForBin(dustbin.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Simulate Telemetry
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {dustbin.id === 'DB-003' && (
              <button
                onClick={async () => {
                  setIsCalibratingModal(true);
                  const result = await calibrateDustbinDepth('DB-003');
                  setIsCalibratingModal(false);
                  setCalibrateMsg(result.message);
                  setTimeout(() => setCalibrateMsg(null), 4000);
                }}
                disabled={isCalibratingModal}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
                title="1-Click: Ultrasonic sensor measures empty depth and sets container height"
              >
                <Sliders className={`w-3.5 h-3.5 ${isCalibratingModal ? 'animate-spin' : ''}`} />
                {isCalibratingModal ? 'Reading Sensor...' : '🎯 1-Click Auto-Calibrate'}
              </button>
            )}

            {/* Ignore / Unignore Issues Button */}
            {(isCritical || isNearlyFull || hasComplaints || isLowBattery || isIgnored) && (
              <button
                onClick={() => toggleIgnoreBinIssues(dustbin.id)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
                  isIgnored
                    ? 'bg-slate-700 hover:bg-slate-800 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
                title={isIgnored ? "Restore active warnings for this dustbin" : "Ignore and silence active warnings for this dustbin"}
              >
                {isIgnored ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Unignore Issues
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-3.5 h-3.5" />
                    Ignore Issues
                  </>
                )}
              </button>
            )}

            {onNavigateToRoute && isCritical && (
              <button
                onClick={() => {
                  onNavigateToRoute();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Route className="w-3.5 h-3.5" />
                Dispatch / Optimize Route
              </button>
            )}

            <button
              onClick={handleEmptyBin}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Mark Emptied (Reset to 0%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

