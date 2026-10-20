import React from 'react';
import { useWaste } from '../../context/WasteContext';
import { Truck, User, MapPin, Fuel, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export const VehiclesView: React.FC = () => {
  const { vehicles, activeRoute } = useWaste();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Municipal Collection Fleet & Driver Roster
        </h3>
        <p className="text-xs text-slate-500">
          Real-time tracking of waste collection compaction trucks, driver assignments, and live payload capacity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vehicles.map(v => {
          const isAssigned = v.id === activeRoute?.vehicleId && activeRoute.status !== 'Completed';
          const payloadPct = Math.round((v.currentLoadKg / v.capacityKg) * 100);

          return (
            <div
              key={v.id}
              className={`rounded-3xl border p-6 space-y-5 flex flex-col justify-between transition-all ${
                isAssigned
                  ? 'bg-blue-50/50 border-blue-300 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-800">
                    <Truck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isAssigned || v.status === 'On Route'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isAssigned ? 'Active Mission' : v.status}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-xs font-black text-slate-400 uppercase tracking-wider block">
                    {v.id}
                  </span>
                  <h4 className="text-xl font-black text-slate-900">{v.vehicleNumber}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">Heavy Compactor Truck</div>
                </div>

                {/* Driver Info */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-800">{v.driverName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-5.5">{v.driverPhone}</div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="truncate">{v.currentLocation.address}</span>
                </div>

                {/* Capacity & Load Bar */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-500">Payload Load:</span>
                    <span className="font-bold text-slate-800">
                      {v.currentLoadKg} / {v.capacityKg} kg ({payloadPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        payloadPct >= 80 ? 'bg-rose-500' : payloadPct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${payloadPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-200/60">
                {isAssigned
                  ? `Assigned to active Route: ${activeRoute?.routeId}`
                  : 'Ready for AI dispatch assignments'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
