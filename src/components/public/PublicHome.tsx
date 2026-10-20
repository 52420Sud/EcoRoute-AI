import React from 'react';
import { useWaste } from '../../context/WasteContext';
import {
  Camera,
  Radio,
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  TrendingDown,
  ShieldCheck,
  Search,
  Truck
} from 'lucide-react';

interface PublicHomeProps {
  onGoToReport: () => void;
  onGoToTrack: () => void;
  onGoToAuthority: () => void;
  onSelectBin?: (binId: string) => void;
}

export const PublicHome: React.FC<PublicHomeProps> = ({
  onGoToReport,
  onGoToTrack,
  onGoToAuthority,
  onSelectBin
}) => {
  const { dustbins, reports } = useWaste();

  const normalCount = dustbins.filter(b => b.status === 'Normal').length;
  const criticalCount = dustbins.filter(b => b.status === 'Critical').length;
  const nearlyFullCount = dustbins.filter(b => b.status === 'Nearly Full').length;
  const resolvedReports = reports.filter(r => r.status === 'Resolved').length;

  const avgFill = Math.round(
    dustbins.reduce((acc, b) => acc + b.fillLevel, 0) / (dustbins.length || 1)
  );

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section (PRD Section 13) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-8 md:p-14 border border-slate-800 shadow-2xl">
        {/* Subtle background glow circle */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Municipal Cleanliness & IoT Infrastructure
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Smart Waste Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400">Cleaner Communities</span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 leading-relaxed font-normal">
            Report waste problems, monitor dustbin conditions, and optimize waste collection using IoT and AI.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onGoToReport}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-2 text-sm active:scale-95"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              Report a Dustbin
            </button>
            <button
              onClick={onGoToTrack}
              className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold px-6 py-3.5 rounded-2xl border border-slate-700 transition-all flex items-center gap-2 text-sm active:scale-95"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              View Report Status
            </button>
            <button
              onClick={onGoToAuthority}
              className="bg-transparent hover:bg-white/5 text-slate-300 hover:text-white font-semibold px-4 py-3.5 rounded-2xl text-xs flex items-center gap-1.5 transition-colors"
            >
              Authority Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Metrics Floating Bar */}
        <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-xs block font-medium">Monitored IoT Bins</span>
            <span className="text-2xl font-black text-white">{dustbins.length}</span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">100% Sensor Connected</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-xs block font-medium">Average Fill Level</span>
            <span className="text-2xl font-black text-white">{avgFill}%</span>
            <span className="text-[11px] text-teal-400 block mt-0.5">Automated Telemetry</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-xs block font-medium">Normal / Empty Bins</span>
            <span className="text-2xl font-black text-emerald-400">{normalCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">&lt; 50% capacity</span>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
            <span className="text-slate-400 text-xs block font-medium">Citizen Reports Solved</span>
            <span className="text-2xl font-black text-teal-400">{resolvedReports}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Verified Collections</span>
          </div>
        </div>
      </section>

      {/* Three Feature Cards (PRD Section 13) */}
      <section className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Three Pillars of Smart Waste Management
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Connecting citizens, ultrasonic sensors, and smart AI logistics in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Card 1: Objective 1 - Report with OTP */}
          <div className="bg-white rounded-3xl p-7 border-2 border-emerald-300 shadow-md hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
                OTP Verified
              </span>
            </div>
            <div className="space-y-2 mb-6">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Objective 1</span>
              <h3 className="text-xl font-bold text-slate-900">Public Waste Reporting</h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                Enable citizens to report overflowing and unmaintained dustbins using photographs, GPS-based location, and issue details, with <b>OTP verification for secure and reliable reporting</b>.
              </p>
            </div>
            <button
              onClick={onGoToReport}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              Submit OTP-Verified Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Monitor */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-md hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Radio className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-2 mb-6">
              <h3 className="text-xl font-bold text-slate-900">📡 Monitor</h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                Monitor dustbin fill levels using IoT sensors. Ultrasonic telemetry categorizes bins into Normal, Nearly Full, and Critical states with automatic alerts.
              </p>
            </div>
            <button
              onClick={onGoToAuthority}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              View Sensor Status <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Optimize */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-md hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-2 mb-6">
              <h3 className="text-xl font-bold text-slate-900">🤖 Optimize</h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                Generate AI-based collection routes based on dustbin priority. Considers fill levels, citizen reports, and road distance to cut fuel emissions.
              </p>
            </div>
            <button
              onClick={onGoToAuthority}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:gap-2 transition-all"
            >
              Inspect Route Planning <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Live Dustbin Status Pulse (Snapshot of City Bins) */}
      <section className="bg-slate-100/70 rounded-3xl p-6 md:p-8 border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900">Live City Cleanliness Pulse</h3>
            <p className="text-xs text-slate-500">
              Real-time snapshot of monitored smart dustbins across urban sectors
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              {normalCount} Normal
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
              {nearlyFullCount} Nearly Full
            </span>
            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">
              {criticalCount} Critical
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dustbins.slice(0, 6).map(bin => {
            const isCrit = bin.status === 'Critical';
            const isNearly = bin.status === 'Nearly Full';

            return (
              <div
                key={bin.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors cursor-pointer"
                onClick={() => onSelectBin && onSelectBin(bin.id)}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{bin.id}</span>
                    <span className="text-[10px] text-slate-400 font-medium">📍 {bin.zone}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">
                    {bin.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Updated {new Date(bin.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-black ${
                      isCrit ? 'text-rose-600' : isNearly ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {bin.fillLevel}%
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCrit
                        ? 'bg-rose-100 text-rose-700'
                        : isNearly
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {bin.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
