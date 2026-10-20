import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import { History, Search, ArrowDownCircle, Truck, Calendar, CheckCircle2 } from 'lucide-react';

export const CollectionHistoryView: React.FC = () => {
  const { collectionHistory } = useWaste();
  const [search, setSearch] = useState('');

  const totalClearedKg = collectionHistory.reduce((acc, item) => acc + item.wasteWeightKg, 0);

  const filteredHistory = collectionHistory.filter(item => {
    return (
      item.dustbinId.toLowerCase().includes(search.toLowerCase()) ||
      item.dustbinName.toLowerCase().includes(search.toLowerCase()) ||
      item.driverName.toLowerCase().includes(search.toLowerCase()) ||
      item.collectedByVehicle.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Waste Collection & Emptying History
          </h3>
          <p className="text-xs text-slate-500">
            Immutable audit log of all completed dustbin collections and compaction truck drop-offs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl text-xs font-bold text-emerald-800">
            Total Waste Cleared: <span className="text-emerald-950 font-black">{totalClearedKg} kg</span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by bin ID, driver..."
              className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <th className="py-3 px-4">Log ID</th>
              <th className="py-3 px-4">Dustbin Receptacle</th>
              <th className="py-3 px-4">Zone</th>
              <th className="py-3 px-4">Pre-Collection Fill</th>
              <th className="py-3 px-4">Waste Cleared</th>
              <th className="py-3 px-4">Vehicle & Driver</th>
              <th className="py-3 px-4">Serviced Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {filteredHistory.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.id}</td>
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{item.dustbinId}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{item.dustbinName}</div>
                </td>
                <td className="py-3 px-4 text-slate-600">{item.zone}</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                    {item.previousFillLevel}% Fill
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                    +{item.wasteWeightKg} kg
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-800">{item.collectedByVehicle}</div>
                  <div className="text-[11px] text-slate-500">{item.driverName}</div>
                </td>
                <td className="py-3 px-4 text-slate-500">
                  <div>{new Date(item.collectedAt).toLocaleDateString()}</div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
