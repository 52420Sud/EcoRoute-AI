import React from 'react';
import { useWaste } from '../../context/WasteContext';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Route,
  Clock,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface AlertsCenterProps {
  onTriggerRoute?: () => void;
  onInspectBin?: (binId: string) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({
  onTriggerRoute,
  onInspectBin
}) => {
  const { alerts, markAlertRead, dismissAlert, clearAllAlerts } = useWaste();

  const unreadAlerts = alerts.filter(a => !a.read);
  const readAlerts = alerts.filter(a => a.read);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              System Alerts & Urgent Notifications
            </h3>
            {unreadAlerts.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                {unreadAlerts.length} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Automated alerts triggered by ultrasonic sensor thresholds, citizen reports, and overflow warnings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onTriggerRoute && (
            <button
              onClick={onTriggerRoute}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Route className="w-3.5 h-3.5" />
              Optimize Emergency Route
            </button>
          )}
          {alerts.length > 0 && (
            <button
              onClick={clearAllAlerts}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">All Clean! No Active Alerts</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All dustbins are operating normally and all public complaints are addressed. You can simulate an alert via the IoT Simulator!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const isCrit = alert.severity === 'critical';
            const isWarn = alert.severity === 'warning';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  alert.read
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : isCrit
                    ? 'bg-rose-50/80 border-rose-300 shadow-sm'
                    : isWarn
                    ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                    : 'bg-blue-50/80 border-blue-300 shadow-sm'
                }`}
              >
                {/* Left Alert Info */}
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isCrit
                        ? 'bg-rose-100 text-rose-700 animate-bounce-soft'
                        : isWarn
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isCrit ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm text-slate-900">{alert.title}</span>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isCrit
                            ? 'bg-rose-200 text-rose-800'
                            : isWarn
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {alert.type.replace('_', ' ')}
                      </span>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      )}
                    </div>

                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{alert.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {alert.dustbinId && (
                        <span className="text-emerald-700 font-bold">
                          Dustbin: {alert.dustbinId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {alert.dustbinId && onInspectBin && (
                    <button
                      onClick={() => onInspectBin(alert.dustbinId!)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      Inspect Bin
                    </button>
                  )}
                  {!alert.read && (
                    <button
                      onClick={() => markAlertRead(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Dismiss Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
