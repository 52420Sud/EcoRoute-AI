import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import { InteractiveMap } from '../map/InteractiveMap';
import { RoutePlan, Vehicle } from '../../types/waste';
import {
  Route,
  Cpu,
  Truck,
  Sliders,
  Send,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  TrendingDown,
  Fuel,
  Info,
  Dices,
  PlusCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RouteOptimizationViewProps {
  onGoToDriverConsole?: () => void;
}

export const RouteOptimizationView: React.FC<RouteOptimizationViewProps> = ({
  onGoToDriverConsole
}) => {
  const {
    dustbins,
    vehicles,
    weights,
    setWeights,
    generateRoute,
    dispatchRoute,
    activeRoute,
    depotLocation,
    randomizeBinFillLevels,
    createMultipleRandomBins
  } = useWaste();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || 'VEH-01');
  const [currentPlan, setCurrentPlan] = useState<RoutePlan | null>(() => {
    return activeRoute || generateRoute(selectedVehicleId);
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  const handleRunOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const plan = generateRoute(selectedVehicleId);
      setCurrentPlan(plan);
      setIsOptimizing(false);
    }, 400);
  };

  const handleRandomizeAndOptimize = async () => {
    setIsRandomizing(true);
    await randomizeBinFillLevels();
    setTimeout(() => {
      const plan = generateRoute(selectedVehicleId);
      setCurrentPlan(plan);
      setIsRandomizing(false);
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 450);
  };

  const handleAddMultipleAndOptimize = async () => {
    setIsRandomizing(true);
    await createMultipleRandomBins(5);
    setTimeout(() => {
      const plan = generateRoute(selectedVehicleId);
      setCurrentPlan(plan);
      setIsRandomizing(false);
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 450);
  };

  const handleDispatch = () => {
    if (!currentPlan) return;
    dispatchRoute(currentPlan);
    setDispatchSuccess(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    setTimeout(() => setDispatchSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/20">
            <Cpu className="w-3.5 h-3.5" />
            AI / Heuristic Optimization Engine (PRD §10 & §11)
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Smart Waste Collection Route Optimization
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            Dynamically synthesizes IoT fill levels, citizen complaint density, and Euclidean coordinates using Nearest-Neighbor heuristic with 2-Opt TSP path refinement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRandomizeAndOptimize}
            disabled={isOptimizing || isRandomizing}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            title="Randomize fill percentages of all bins and compute optimal route"
          >
            <Dices className={`w-4 h-4 ${isRandomizing ? 'animate-spin' : ''}`} />
            {isRandomizing ? 'Randomizing...' : '🎲 Randomize Fills (Obj 3)'}
          </button>

          <button
            onClick={handleAddMultipleAndOptimize}
            disabled={isOptimizing || isRandomizing}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-3 rounded-2xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all active:scale-95"
            title="Add 5 new random bins across the city"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            +5 Bins
          </button>

          <button
            onClick={handleRunOptimizer}
            disabled={isOptimizing || isRandomizing}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            {isOptimizing ? 'Computing AI Routes...' : 'Run Route Optimizer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Parameter Tuning & Vehicle Picker */}
        <div className="space-y-6">
          {/* Optimization Tuning Sliders */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Configurable Priority Weights (PRD §11)
            </h3>

            {/* Fill Weight Slider */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Fill Level Weight (W_fill):</span>
                <span className="font-bold text-emerald-700">{Math.round(weights.fillWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={weights.fillWeight}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setWeights(w => ({ ...w, fillWeight: val }));
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="text-[10px] text-slate-400 block">Prioritizes dustbins nearing 100% capacity</span>
            </div>

            {/* Complaint Weight Slider */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Citizen Complaint Weight (W_comp):</span>
                <span className="font-bold text-teal-700">{Math.round(weights.complaintWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.7"
                step="0.05"
                value={weights.complaintWeight}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setWeights(w => ({ ...w, complaintWeight: val }));
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-400 block">Fast-tracks bins with verified public reports</span>
            </div>

            {/* Urgency Weight Slider */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Critical Urgency Weight (W_urg):</span>
                <span className="font-bold text-rose-700">{Math.round(weights.urgencyWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={weights.urgencyWeight}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setWeights(w => ({ ...w, urgencyWeight: val }));
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <span className="text-[10px] text-slate-400 block">Emergency weighting for overflow hazards</span>
            </div>

            {/* Critical Threshold Slider */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Critical Threshold Cutoff:</span>
                <span className="font-bold text-rose-700">&gt; {weights.criticalThreshold || 70}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={weights.criticalThreshold || 70}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setWeights(w => ({ ...w, criticalThreshold: val }));
                  setTimeout(() => {
                    const p = generateRoute(selectedVehicleId);
                    setCurrentPlan(p);
                  }, 50);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <span className="text-[10px] text-slate-400 block">Dustbins exceeding {weights.criticalThreshold || 70}% are classified as Critical priority</span>
            </div>
          </div>

          {/* Route Priority Tier Mode Selector */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Route Priority Tier Scope
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Prioritized
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Select which areas to include. The route is strictly sequenced: <b>Critical (&gt;{weights.criticalThreshold || 70}%) first</b>, then Medium, then Low.
            </p>

            <div className="space-y-2.5">
              {/* Option 1: Critical Only (>70%) */}
              <button
                onClick={() => {
                  setWeights(w => ({ ...w, routeTierFilter: 'critical_only' }));
                  setTimeout(() => {
                    const p = generateRoute(selectedVehicleId);
                    setCurrentPlan(p);
                  }, 50);
                }}
                className={`w-full p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-3 ${
                  (weights.routeTierFilter || 'critical_only') === 'critical_only'
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400 text-rose-950 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
                  🚨
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Critical Only (&gt; {weights.criticalThreshold || 70}%)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-800">
                      Emergency
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Routes ONLY critical bins (&gt;{weights.criticalThreshold || 70}%) or with active citizen complaints.
                  </div>
                </div>
              </button>

              {/* Option 2: Critical (>70%) then Medium (40-70%) */}
              <button
                onClick={() => {
                  setWeights(w => ({ ...w, routeTierFilter: 'critical_then_medium' }));
                  setTimeout(() => {
                    const p = generateRoute(selectedVehicleId);
                    setCurrentPlan(p);
                  }, 50);
                }}
                className={`w-full p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-3 ${
                  weights.routeTierFilter === 'critical_then_medium'
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400 text-amber-950 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
                  🟡
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Critical (&gt; {weights.criticalThreshold || 70}%) → Medium</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                      Balanced
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Visits all Critical (&gt;{weights.criticalThreshold || 70}%) areas first, then continues to Medium (40%–{weights.criticalThreshold || 70}%) locations.
                  </div>
                </div>
              </button>

              {/* Option 3: All Locations (Critical -> Medium -> Low) */}
              <button
                onClick={() => {
                  setWeights(w => ({ ...w, routeTierFilter: 'all_priority' }));
                  setTimeout(() => {
                    const p = generateRoute(selectedVehicleId);
                    setCurrentPlan(p);
                  }, 50);
                }}
                className={`w-full p-3 rounded-2xl border text-left text-xs transition-all flex items-start gap-3 ${
                  weights.routeTierFilter === 'all_priority'
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400 text-emerald-950 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm">
                  🟢
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>All Locations (Critical → Medium → Low)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                      Complete
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Full municipal sweep routed strictly in order: Critical first, then Medium, then Low.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Vehicle Assignment Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Select Collection Vehicle
            </h3>

            <div className="space-y-2">
              {vehicles.map(veh => {
                const isSelected = veh.id === selectedVehicleId;
                return (
                  <button
                    key={veh.id}
                    onClick={() => {
                      setSelectedVehicleId(veh.id);
                      const p = generateRoute(veh.id);
                      setCurrentPlan(p);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{veh.vehicleNumber}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {veh.id}
                        </span>
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">Driver: {veh.driverName}</div>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold">{veh.capacityKg} kg</span>
                      <span className="text-[10px] opacity-70">Capacity</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Map Preview and Step-by-Step Collection Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active / Draft Plan Metrics Banner */}
          {currentPlan && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-black text-slate-900">{currentPlan.routeId}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-bold text-emerald-700">
                      Assigned: {currentPlan.vehicleNumber} ({currentPlan.driverName})
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    Departing from: {depotLocation.address}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDispatch}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                  >
                    {dispatchSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-200" /> : <Send className="w-4 h-4" />}
                    {dispatchSuccess ? 'Dispatched to Driver!' : 'Dispatch Route to Driver'}
                  </button>

                  {onGoToDriverConsole && (
                    <button
                      onClick={onGoToDriverConsole}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
                    >
                      Driver Console →
                    </button>
                  )}
                </div>
              </div>

              {/* High-level Heuristic Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Stops Scheduled</span>
                  <span className="text-xl font-black text-slate-900">{currentPlan.stops.length} Bins</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    {(weights.routeTierFilter || 'critical_only') === 'critical_only'
                      ? 'Critical Only'
                      : weights.routeTierFilter === 'critical_then_medium'
                      ? 'Critical + Medium'
                      : 'All Tiers'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Total Driving Path</span>
                  <span className="text-xl font-black text-blue-700">{currentPlan.totalDistanceKm} km</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">2-Opt Shortest Path</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Est. Mission Time</span>
                  <span className="text-xl font-black text-slate-900">{currentPlan.estimatedDurationMins} mins</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Driving + Service Time</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Fuel Saved vs Naive</span>
                  <span className="text-xl font-black text-emerald-600">~24%</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">AI Heuristic Efficiency</span>
                </div>
              </div>

              {/* Priority Breakdown & Sequence Rule Ribbon */}
              <div className="bg-gradient-to-r from-slate-50 via-slate-100 to-emerald-50/50 p-3 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span>🎯</span>
                    <span>Stops Breakdown:</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                    {currentPlan.stops.filter(s => s.tier === 'Critical').length} Critical (&gt;{weights.criticalThreshold || 70}%)
                  </span>
                  {currentPlan.stops.filter(s => s.tier === 'Medium').length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      {currentPlan.stops.filter(s => s.tier === 'Medium').length} Medium (40%–{weights.criticalThreshold || 70}%)
                    </span>
                  )}
                  {currentPlan.stops.filter(s => s.tier === 'Low').length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-medium border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {currentPlan.stops.filter(s => s.tier === 'Low').length} Low (&lt;40%)
                    </span>
                  )}
                </div>

                <div className="text-[11px] font-semibold text-slate-600 bg-white px-3 py-1 rounded-xl border border-slate-200/80 flex items-center gap-1.5 shadow-xs">
                  <span className="text-emerald-700 font-bold">Rule:</span>
                  <span>1st Critical (&gt;{weights.criticalThreshold || 70}%) ➔ 2nd Medium ➔ 3rd Low</span>
                </div>
              </div>

              {/* Interactive Route Map Preview */}
              <div className="pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Optimized Spatial Path (Waypoints & Vehicle Depot)
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <span>⬜</span>
                    <span>Plain White Route Map (No API Key Required)</span>
                  </span>
                </div>
                <InteractiveMap
                  dustbins={dustbins}
                  vehicles={vehicles}
                  activeRoute={currentPlan}
                  depotLocation={depotLocation}
                  className="h-80"
                  plainWhite={true}
                />
              </div>

              {/* Stop-by-Stop Priority Sequence Table (PRD Section 10) */}
              <div className="pt-3 space-y-3">
                <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                  Recommended Collection Sequence (Order of Visit)
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                        <th className="py-2.5 px-3">Stop #</th>
                        <th className="py-2.5 px-3">Priority Tier</th>
                        <th className="py-2.5 px-3">Dustbin</th>
                        <th className="py-2.5 px-3">Fill Level</th>
                        <th className="py-2.5 px-3">AI Priority Score</th>
                        <th className="py-2.5 px-3">Leg Distance</th>
                        <th className="py-2.5 px-3">Cumulative</th>
                        <th className="py-2.5 px-3">Est. ETA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {currentPlan.stops.map((stop, index) => {
                        const isCrit = stop.tier === 'Critical' || stop.dustbin.status === 'Critical';
                        const isMed = stop.tier === 'Medium' || stop.dustbin.status === 'Nearly Full';

                        return (
                          <tr key={stop.dustbin.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                {stop.stopNumber}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {stop.tier === 'Critical' || isCrit ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                                  1: Critical (&gt;{weights.criticalThreshold || 70}%)
                                </span>
                              ) : stop.tier === 'Medium' || isMed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  2: Medium (40%–{weights.criticalThreshold || 70}%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-900 border border-emerald-200">
                                  3: Low (&lt;40%)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">{stop.dustbin.id}</div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                                {stop.dustbin.name}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-bold ${
                                  isCrit ? 'text-rose-600' : isMed ? 'text-amber-600' : 'text-emerald-600'
                                }`}
                              >
                                {stop.dustbin.fillLevel}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                {stop.priorityScore} / 100
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              +{stop.distanceFromPreviousKm} km
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {stop.cumulativeDistanceKm} km
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              +{stop.estimatedArrivalMins} min
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
