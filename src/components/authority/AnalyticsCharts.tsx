import React from 'react';
import { useWaste } from '../../context/WasteContext';
import { BarChart3, PieChart, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const AnalyticsCharts: React.FC = () => {
  const { dustbins, reports, collectionHistory } = useWaste();

  // Chart 1: Status Distribution
  const normalCount = dustbins.filter(b => b.status === 'Normal').length;
  const nearlyCount = dustbins.filter(b => b.status === 'Nearly Full').length;
  const criticalCount = dustbins.filter(b => b.status === 'Critical').length;
  const totalBins = dustbins.length || 1;

  const normalPct = Math.round((normalCount / totalBins) * 100);
  const nearlyPct = Math.round((nearlyCount / totalBins) * 100);
  const criticalPct = Math.round((criticalCount / totalBins) * 100);

  // Chart 2: Average Fill Level by Zone
  const zoneStats: Record<string, { totalFill: number; count: number }> = {};
  dustbins.forEach(b => {
    if (!zoneStats[b.zone]) zoneStats[b.zone] = { totalFill: 0, count: 0 };
    zoneStats[b.zone].totalFill += b.fillLevel;
    zoneStats[b.zone].count += 1;
  });

  const zoneAverages = Object.entries(zoneStats).map(([zone, data]) => ({
    zone,
    avg: Math.round(data.totalFill / data.count)
  }));

  // Chart 4: Public Reports Breakdown by Issue Type
  const issueCounts: Record<string, number> = {};
  reports.forEach(r => {
    issueCounts[r.issueType] = (issueCounts[r.issueType] || 0) + 1;
  });

  // Chart 5: Critical Dustbins by Zone
  const criticalByZone: Record<string, number> = {};
  dustbins
    .filter(b => b.status === 'Critical')
    .forEach(b => {
      criticalByZone[b.zone] = (criticalByZone[b.zone] || 0) + 1;
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart 1: Dustbin Status Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              1. Status Distribution
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Total: {totalBins} Bins</span>
          </div>

          {/* Bar Segment Visualization */}
          <div className="space-y-3 my-auto">
            <div className="h-4 rounded-full bg-slate-100 flex overflow-hidden p-0.5 border border-slate-200">
              <div
                style={{ width: `${normalPct}%` }}
                className="bg-emerald-500 rounded-l-full transition-all duration-500"
                title={`Normal: ${normalCount} (${normalPct}%)`}
              />
              <div
                style={{ width: `${nearlyPct}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Nearly Full: ${nearlyCount} (${nearlyPct}%)`}
              />
              <div
                style={{ width: `${criticalPct}%` }}
                className="bg-rose-500 rounded-r-full transition-all duration-500"
                title={`Critical: ${criticalCount} (${criticalPct}%)`}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] text-emerald-700 font-bold block uppercase">Normal</span>
                <span className="text-base font-black text-emerald-800">{normalCount}</span>
                <span className="text-[10px] text-emerald-600 block">{normalPct}%</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="text-[10px] text-amber-700 font-bold block uppercase">Nearly</span>
                <span className="text-base font-black text-amber-800">{nearlyCount}</span>
                <span className="text-[10px] text-amber-600 block">{nearlyPct}%</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-100">
                <span className="text-[10px] text-rose-700 font-bold block uppercase">Critical</span>
                <span className="text-base font-black text-rose-800">{criticalCount}</span>
                <span className="text-[10px] text-rose-600 block">{criticalPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Average Fill Level by Zone */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              2. Average Fill Level by Zone
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">IoT Avg</span>
          </div>

          <div className="space-y-2.5 my-auto max-h-56 overflow-y-auto pr-1">
            {zoneAverages.map(item => (
              <div key={item.zone} className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-700 truncate max-w-[170px]">{item.zone}</span>
                  <span
                    className={`font-bold ${
                      item.avg >= 80 ? 'text-rose-600' : item.avg >= 50 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {item.avg}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      item.avg >= 80 ? 'bg-rose-500' : item.avg >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.avg}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Waste Collection & Emptying Activity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              3. Recent Collection Activity
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Completed Logs</span>
          </div>

          <div className="space-y-2 my-auto max-h-56 overflow-y-auto pr-1">
            {collectionHistory.slice(0, 4).map(item => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{item.dustbinId}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{item.dustbinName}</div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    +{item.wasteWeightKg} kg
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 4: Public Reports Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              4. Citizen Reports by Issue Type
            </h4>
            <span className="text-[11px] text-slate-400 font-medium">Active & Resolved</span>
          </div>

          <div className="space-y-3">
            {Object.entries(issueCounts).map(([type, count]) => {
              const pct = Math.round((count / (reports.length || 1)) * 100);
              return (
                <div key={type} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{type}</span>
                    <span className="font-bold text-slate-900">{count} reports ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 5: Critical Dustbins by Zone */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              5. Critical Dustbins by Location / Zone
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
              Needs Priority Collection
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(criticalByZone).length > 0 ? (
              Object.entries(criticalByZone).map(([zone, count]) => (
                <div
                  key={zone}
                  className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs"
                >
                  <span className="font-bold text-slate-800">{zone}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="font-black text-rose-700">{count} Critical Bins</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                🎉 No critical dustbins currently! All zones operating below emergency thresholds.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
