import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import { PublicReport, ReportStatus } from '../../types/waste';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  Truck,
  MapPin,
  Calendar,
  User,
  AlertTriangle,
  Eye,
  X,
  MessageSquare
} from 'lucide-react';

export const ReportsManagement: React.FC = () => {
  const { reports, vehicles, updateReportStatus } = useWaste();

  const [selectedReport, setSelectedReport] = useState<PublicReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | ReportStatus>('All');
  const [search, setSearch] = useState('');

  // Editing state for modal
  const [editingStatus, setEditingStatus] = useState<ReportStatus>('Submitted');
  const [assignedVehicle, setAssignedVehicle] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const openModal = (report: PublicReport) => {
    setSelectedReport(report);
    setEditingStatus(report.status);
    setAssignedVehicle(report.assignedVehicleId || vehicles[0]?.id || '');
    setResolutionNotes(report.resolutionNotes || '');
  };

  const handleSaveModal = () => {
    if (!selectedReport) return;
    updateReportStatus(
      selectedReport.id,
      editingStatus,
      assignedVehicle || undefined,
      resolutionNotes || undefined
    );
    setSelectedReport(null);
  };

  const filteredReports = reports.filter(r => {
    const matchesFilter = statusFilter === 'All' || r.status === statusFilter;
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase()) ||
      r.reporterName.toLowerCase().includes(search.toLowerCase()) ||
      r.issueType.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
      {/* Header and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Citizen Grievance & Public Reports Management
          </h3>
          <p className="text-xs text-slate-500">
            Review photo submissions, assign waste collection vehicles, and verify on-ground resolutions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search complaint ID, location..."
              className="bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
          >
            <option value="All">All Statuses ({reports.length})</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map(rep => {
          const isResolved = rep.status === 'Resolved';
          const isInProgress = rep.status === 'In Progress';
          const isAssigned = rep.status === 'Assigned';

          return (
            <div
              key={rep.id}
              className="bg-slate-50/70 rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                {/* Photo Thumbnail */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img
                    src={rep.photo}
                    alt={rep.issueType}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white border border-slate-700">
                      {rep.id}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm ${
                        isResolved
                          ? 'bg-emerald-500 text-white'
                          : isInProgress
                          ? 'bg-blue-500 text-white'
                          : isAssigned
                          ? 'bg-indigo-500 text-white'
                          : 'bg-amber-500 text-slate-950 font-black'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 block uppercase">
                      {rep.issueType}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                      {rep.location}
                    </h4>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 italic">
                    "{rep.description}"
                  </p>

                  <div className="pt-1 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{rep.reporterName} ({rep.reporterPhone || 'No phone'})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(rep.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    {rep.dustbinId && (
                      <div className="text-emerald-700 font-medium">
                        Linked Bin: <b>{rep.dustbinId}</b>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-3 bg-white border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {rep.assignedVehicleId ? `Vehicle: ${rep.assignedVehicleId}` : 'Unassigned'}
                </span>
                <button
                  onClick={() => openModal(rep)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Manage Status
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status & Assignment Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase">Update Complaint</span>
                <h4 className="font-black text-lg text-slate-900">{selectedReport.id}</h4>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Update Lifecycle Status
                </label>
                <select
                  value={editingStatus}
                  onChange={e => setEditingStatus(e.target.value as ReportStatus)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Assign Waste Collection Vehicle
                </label>
                <select
                  value={assignedVehicle}
                  onChange={e => setAssignedVehicle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- No Vehicle Assigned --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.id} ({v.vehicleNumber}) - Driver: {v.driverName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 uppercase tracking-wider">
                  Resolution Notes / Action Taken
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Waste collected by compaction truck, bin disinfected."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModal}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
