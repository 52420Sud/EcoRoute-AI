import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import { ReportStatus } from '../../types/waste';
import { downloadReportPdf } from '../../utils/generateReportPdf';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  FileText,
  Check,
  Download,
  Printer,
  Sparkles
} from 'lucide-react';

interface TrackReportPageProps {
  initialReportId?: string;
  onGoToReport?: () => void;
}

const STATUS_STEPS: ReportStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved'
];

export const TrackReportPage: React.FC<TrackReportPageProps> = ({
  initialReportId = 'REPORT-2026-001',
  onGoToReport
}) => {
  const { reports, getReportById } = useWaste();
  const [searchInput, setSearchInput] = useState<string>(initialReportId);
  const [activeReportId, setActiveReportId] = useState<string>(initialReportId);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const report = getReportById(activeReportId) || reports[0];

  const handleDownloadPdf = async () => {
    if (!report) return;
    setIsGeneratingPdf(true);
    try {
      await downloadReportPdf(report);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setActiveReportId(searchInput.trim());
  };

  const getStepIndex = (status: ReportStatus) => {
    return STATUS_STEPS.indexOf(status);
  };

  const currentStepIndex = report ? getStepIndex(report.status) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Search Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <Search className="w-3.5 h-3.5 text-emerald-600" />
          Public Grievance Tracking System
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Track Your Waste Complaint Status
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          Enter your unique Report ID to view real-time inspection, vehicle dispatch, and collection progress.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto pt-3">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="e.g. REPORT-2026-001"
              className="w-full bg-white border-2 border-slate-300 focus:border-emerald-500 rounded-2xl pl-10 pr-28 py-3 text-xs md:text-sm font-semibold text-slate-800 shadow-md focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <button
              type="submit"
              className="absolute right-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-xs">
          <span className="text-slate-400 font-medium">Sample Reports:</span>
          {reports.slice(0, 4).map(r => (
            <button
              key={r.id}
              onClick={() => {
                setSearchInput(r.id);
                setActiveReportId(r.id);
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                activeReportId.toUpperCase() === r.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {r.id} ({r.status})
            </button>
          ))}
        </div>
      </div>

      {report ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden space-y-8 p-6 md:p-8 animate-in fade-in duration-200">
          {/* Top Banner: ID & Current Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black text-slate-900">{report.id}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">{report.issueType}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Reported on {new Date(report.createdAt).toLocaleDateString()} at{' '}
                {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Current State:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    report.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : report.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : report.status === 'Assigned'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 ${
                  report.status === 'Resolved'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
                title="Download official PDF report certificate"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
              </button>
            </div>
          </div>

          {/* Stepper (PRD Section 5.1 Status Flow) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Resolution Lifecycle Workflow
            </h3>

            <div className="relative">
              {/* Desktop Stepper Bar */}
              <div className="hidden sm:grid grid-cols-5 gap-2 relative">
                {/* Horizontal Progress Line */}
                <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 -z-0">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`
                    }}
                  />
                </div>

                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step} className="flex flex-col items-center text-center relative z-10">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs mt-2 font-semibold ${
                          isCurrent
                            ? 'text-emerald-700 font-bold'
                            : isDone
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Stepper */}
              <div className="sm:hidden space-y-2">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isDone || isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs ${
                          isCurrent ? 'text-emerald-700 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                        }`}
                      >
                        {step} {isCurrent && '← Current'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Report Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left: Attached Photo */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Evidence Photograph
              </span>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900 aspect-video flex items-center justify-center">
                <img
                  src={report.photo}
                  alt="Complaint Evidence"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right: Metadata Table */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Complaint Information
              </span>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 font-semibold block">Location</span>
                    <span className="text-slate-900 font-medium">{report.location}</span>
                    {report.dustbinId && (
                      <span className="text-[11px] text-emerald-700 block mt-0.5">
                        Linked Monitored Bin: <b>{report.dustbinId}</b>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 font-semibold block">Citizen Statement</span>
                    <p className="text-slate-800 leading-relaxed italic">"{report.description}"</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 font-semibold block">Filed By</span>
                    <span className="text-slate-900 font-medium">{report.reporterName}</span>
                    {report.reporterPhone && (
                      <span className="text-slate-500 block text-[11px]">{report.reporterPhone}</span>
                    )}
                  </div>
                </div>

                {report.assignedVehicleId && (
                  <div className="flex items-start gap-2.5 bg-blue-50/80 p-2.5 rounded-xl border border-blue-200">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-blue-900 font-bold block">Assigned Collection Unit</span>
                      <span className="text-blue-800 font-medium">Vehicle {report.assignedVehicleId}</span>
                    </div>
                  </div>
                )}

                {report.resolutionNotes && (
                  <div className="flex items-start gap-2.5 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-emerald-900 font-bold block">Resolution Verification</span>
                      <span className="text-emerald-800 leading-relaxed">{report.resolutionNotes}</span>
                      {report.resolvedAt && (
                        <span className="text-[10px] text-emerald-600 block mt-0.5">
                          Cleared on {new Date(report.resolvedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Official Verification Certificate & PDF Download Card */}
          <div
            className={`rounded-2xl p-5 md:p-6 border text-white shadow-lg space-y-4 transition-all ${
              report.status === 'Resolved'
                ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/40 ring-1 ring-emerald-500/20'
                : 'bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 border-blue-500/30'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-3 rounded-2xl border shadow-inner ${
                    report.status === 'Resolved'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}
                >
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-black text-base text-white">
                      {report.status === 'Resolved'
                        ? 'Official Municipal Resolution & Verification Certificate'
                        : 'Official Grievance Acknowledgment & Audit Slip'}
                    </h4>
                    {report.status === 'Resolved' ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Verification Complete
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        Municipal Action In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    {report.status === 'Resolved'
                      ? 'Sanitation inspection and collection have certified this grievance as 100% resolved and verified. You can download the stamped official PDF report with GPS coordinates, timeline audit, and evidence attachment for your records.'
                      : 'Download your official PDF acknowledgment slip containing your Complaint ID, citizen statement, geo-tagged coordinates, and live municipal dispatch tracking details.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                    report.status === 'Resolved'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {isGeneratingPdf
                    ? 'Generating Official PDF...'
                    : report.status === 'Resolved'
                    ? 'Download Resolution Certificate (PDF)'
                    : 'Download Grievance Slip (PDF)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">Complaint Not Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We could not find any grievance matching "{searchInput}". Please double check your Report ID or submit a new grievance.
          </p>
          <button
            onClick={onGoToReport}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors"
          >
            Submit New Report
          </button>
        </div>
      )}
    </div>
  );
};
