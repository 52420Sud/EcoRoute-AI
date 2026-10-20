import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import {
  Truck,
  CheckCircle2,
  Navigation,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Compass,
  Dices,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DriverConsoleProps {
  onGoToRouteOptimizer?: () => void;
}

export const DriverConsole: React.FC<DriverConsoleProps> = ({
  onGoToRouteOptimizer
}) => {
  const {
    activeRoute,
    markStopCollected,
    completeRoute,
    vehicles,
    dustbins,
    generateRoute,
    dispatchRoute,
    randomizeBinFillLevels
  } = useWaste();

  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // If no active route dispatched yet, provide a quick one-click start button
  const handleAutoDispatch = () => {
    const route = generateRoute('VEH-01');
    dispatchRoute(route);
  };

  // Objective 3: Randomize all bins and immediately dispatch optimized route to driver
  const handleRandomizeAndOptimize = async () => {
    setIsRandomizing(true);
    setToastNotice('🎲 Generating random bin fill levels in database...');
    await randomizeBinFillLevels();
    setTimeout(() => {
      const newRoute = generateRoute('VEH-01');
      dispatchRoute(newRoute);
      setIsRandomizing(false);
      setToastNotice(`✨ Objective 3 Activated: Randomized bin fill percentages! Dispatched optimal 2-Opt TSP route with ${newRoute.stops.length} critical stops.`);
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.55 }
      });
      setTimeout(() => setToastNotice(null), 7000);
    }, 450);
  };

  const handleCollect = (dustbinId: string) => {
    setCollectingId(dustbinId);
    setTimeout(() => {
      markStopCollected(dustbinId);
      setCollectingId(null);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 450);
  };

  const currentVehicle = vehicles.find(v => v.id === activeRoute?.vehicleId) || vehicles[0];

  // Find next uncollected stop
  const nextStop = activeRoute?.stops.find(s => !s.collected);
  const completedCount = activeRoute?.stops.filter(s => s.collected).length || 0;
  const totalStops = activeRoute?.stops.length || 0;
  const isAllCollected = totalStops > 0 && completedCount === totalStops;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Driver Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/20">
            <Truck className="w-3.5 h-3.5" />
            Field Collection Staff Console (PRD §16)
          </div>
          <h2 className="text-2xl font-black text-white">
            {currentVehicle.driverName} • {currentVehicle.vehicleNumber}
          </h2>
          <p className="text-xs text-slate-400">
            Vehicle ID: {currentVehicle.id} • Payload Load: {currentVehicle.currentLoadKg} / {currentVehicle.capacityKg} kg
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block font-medium">Mission Status</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold inline-block mt-1 ${
              isAllCollected
                ? 'bg-emerald-500 text-white'
                : activeRoute
                ? 'bg-blue-600 text-white animate-pulse'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isAllCollected ? 'Route Completed' : activeRoute ? 'En Route' : 'Idle / Standby'}
          </span>
        </div>
      </div>

      {/* Objective 3 Toast Notice */}
      {toastNotice && (
        <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl border border-emerald-500/40 shadow-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{toastNotice}</span>
          </div>
          <button onClick={() => setToastNotice(null)} className="text-emerald-300 hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {/* Objective 3 Live Scenario Generator Card */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 md:p-6 border border-blue-800/50 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[11px] font-bold border border-blue-400/30">
            <Dices className="w-3.5 h-3.5 text-blue-300" />
            Objective 3: AI Route Optimization & Dynamic Driver Dispatch
          </div>
          <h3 className="text-base md:text-lg font-black text-white">
            Live Scenario Generator for Objective 3
          </h3>
          <p className="text-xs text-blue-200/90 leading-relaxed">
            Fills bins with realistic random percentages (Critical ≥80%, Medium 45–75%, Normal) and executes the 2-Opt TSP heuristic to dispatch the optimal collection path.
          </p>
        </div>

        <button
          onClick={handleRandomizeAndOptimize}
          disabled={isRandomizing}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 shrink-0"
        >
          <Dices className={`w-4 h-4 ${isRandomizing ? 'animate-spin' : ''}`} />
          {isRandomizing ? 'Randomizing & Routing...' : '🎲 Randomize Bins & Optimize Route'}
        </button>
      </div>

      {!activeRoute ? (
        /* Empty / Idle State */
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Truck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">No Dispatched Route Assigned</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The Authority Command Center has not dispatched an AI collection route for this vehicle yet. You can auto-generate and dispatch one now for demonstration.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={handleRandomizeAndOptimize}
              disabled={isRandomizing}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Dices className="w-4 h-4 fill-white" />
              {isRandomizing ? 'Generating Route...' : '🎲 Randomize Bins & Dispatch Route (Objective 3)'}
            </button>
            <button
              onClick={handleAutoDispatch}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Use Current Bins
            </button>
            {onGoToRouteOptimizer && (
              <button
                onClick={onGoToRouteOptimizer}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 rounded-2xl text-xs transition-colors"
              >
                Open Route Optimizer
              </button>
            )}
          </div>
        </div>
      ) : isAllCollected ? (
        /* Route Completed Banner */
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-emerald-950">
              All Scheduled Stops Successfully Serviced!
            </h3>
            <p className="text-xs md:text-sm text-emerald-800 max-w-md mx-auto">
              All {totalStops} target dustbins have been emptied to 0% Normal capacity and citizen complaints have been resolved.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={completeRoute}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition-colors"
            >
              Return to Fleet Depot & Finish Mission
            </button>
          </div>
        </div>
      ) : (
        /* Active Collection Console */
        <div className="space-y-6">
          {/* Progress Tracker Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider">
                Collection Route Progress ({activeRoute.routeId})
              </span>
              <span className="font-black text-emerald-700 text-sm">
                {completedCount} of {totalStops} Bins Cleared
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <div
                className="h-3 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalStops) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Total Distance: {activeRoute.totalDistanceKm} km</span>
              <span>Estimated Time: ~{activeRoute.estimatedDurationMins} mins</span>
            </div>
          </div>

          {/* Current Next Target Dustbin Hero Card (PRD Section 16) */}
          {nextStop && (
            <div className="bg-gradient-to-br from-white to-emerald-50/50 rounded-3xl p-6 border-2 border-emerald-400 shadow-lg space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white">
                    NEXT STOP #{nextStop.stopNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                    Priority Score: {nextStop.priorityScore}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Leg Distance: +{nextStop.distanceFromPreviousKm} km
                </span>
              </div>

              <div>
                <span className="font-mono text-xs font-black text-slate-400 uppercase">
                  {nextStop.dustbin.id}
                </span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  {nextStop.dustbin.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{nextStop.dustbin.address} ({nextStop.dustbin.zone})</span>
                </div>
              </div>

              {/* Fill Gauge & Details */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Sensor Fill Level</span>
                  <span className="text-xl font-black text-rose-600">{nextStop.dustbin.fillLevel}%</span>
                  <span className="text-[10px] text-slate-400 block">Critical Capacity</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Receptacle Volume</span>
                  <span className="text-xl font-black text-slate-900">{nextStop.dustbin.capacityLiters} L</span>
                  <span className="text-[10px] text-slate-400 block">Municipal Standard</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Active Complaints</span>
                  <span className="text-xl font-black text-amber-600">
                    {nextStop.dustbin.activeComplaintCount}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Verified Citizen Reports</span>
                </div>
              </div>

              {/* "Mark as Collected" Primary Action Button (PRD Section 16) */}
              <div>
                <button
                  onClick={() => handleCollect(nextStop.dustbin.id)}
                  disabled={collectingId === nextStop.dustbin.id}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-4 px-6 rounded-2xl text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    {collectingId === nextStop.dustbin.id
                      ? 'Emptying Bin & Updating Telemetry to 0%...'
                      : 'Mark as Collected (Reset to 0% Normal)'}
                  </span>
                </button>
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  Empties dustbin, sets fill to 0%, logs waste kilograms, and auto-resolves linked complaints.
                </p>
              </div>
            </div>
          )}

          {/* Sequential Waypoint Checklist */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Turn-by-Turn Collection Waypoint Itinerary
            </h4>

            <div className="space-y-2">
              {activeRoute.stops.map(stop => {
                const isCurrent = stop.stopNumber === nextStop?.stopNumber;

                return (
                  <div
                    key={stop.dustbin.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      stop.collected
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isCurrent
                        ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                          stop.collected
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {stop.collected ? '✓' : stop.stopNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">{stop.dustbin.id}</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {stop.dustbin.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {stop.dustbin.address} • {stop.distanceFromPreviousKm} km away
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {stop.collected ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Collected (0%)
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCollect(stop.dustbin.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-colors"
                        >
                          Collect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
