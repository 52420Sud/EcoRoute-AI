import React, { useState } from 'react';
import { WasteProvider, useWaste } from './context/WasteContext';
import { AuthProvider, useAuth } from './firebase/authContext';
import { Navbar, ActivePortal, PublicTab, AuthorityTab } from './components/navbar/Navbar';
import { PublicHome } from './components/public/PublicHome';
import { ReportDustbinPage } from './components/public/ReportDustbinPage';
import { TrackReportPage } from './components/public/TrackReportPage';
import { AboutProject } from './components/public/AboutProject';
import { AuthorityDashboard } from './components/authority/AuthorityDashboard';
import { DustbinTable } from './components/authority/DustbinTable';
import { ReportsManagement } from './components/authority/ReportsManagement';
import { AlertsCenter } from './components/authority/AlertsCenter';
import { RouteOptimizationView } from './components/authority/RouteOptimizationView';
import { VehiclesView } from './components/authority/VehiclesView';
import { CollectionHistoryView } from './components/authority/CollectionHistoryView';
import { InteractiveMap } from './components/map/InteractiveMap';
import { DriverConsole } from './components/driver/DriverConsole';
import { SensorSimulatorModal } from './components/simulator/SensorSimulatorModal';
import { DemoScenarioWalkthrough } from './components/demo/DemoScenarioWalkthrough';
import { FirebaseSetupModal } from './components/firebase/FirebaseSetupModal';
import { LoginModal } from './components/auth/LoginModal';
import {
  Recycle,
  Shield,
  Cpu,
  Heart,
  Award,
  Layers,
  Sparkles,
  MapPin
} from 'lucide-react';

const MainApp: React.FC = () => {
  const [portal, setPortal] = useState<ActivePortal>('public');
  const [publicTab, setPublicTab] = useState<PublicTab>('home');
  const [authorityTab, setAuthorityTab] = useState<AuthorityTab>('dashboard');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isFirebaseSetupOpen, setIsFirebaseSetupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [activeReportIdForTracking, setActiveReportIdForTracking] = useState<string>('REPORT-2026-001');

  const { dustbins, reports, vehicles, activeRoute, depotLocation } = useWaste();

  // Unified navigation handler used by demo scenario and buttons
  const handleNavigate = (target: 'home' | 'report' | 'track' | 'dashboard' | 'route' | 'driver' | 'map') => {
    if (target === 'home') {
      setPortal('public');
      setPublicTab('home');
    } else if (target === 'report') {
      setPortal('public');
      setPublicTab('report');
    } else if (target === 'track') {
      setPortal('public');
      setPublicTab('track');
    } else if (target === 'driver') {
      setPortal('driver');
    } else if (target === 'route') {
      setPortal('authority');
      setAuthorityTab('route');
    } else if (target === 'map') {
      setPortal('authority');
      setAuthorityTab('map');
    } else {
      setPortal('authority');
      setAuthorityTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        portal={portal}
        setPortal={setPortal}
        publicTab={publicTab}
        setPublicTab={setPublicTab}
        authorityTab={authorityTab}
        setAuthorityTab={setAuthorityTab}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenFirebaseSetup={() => setIsFirebaseSetupOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {/* PUBLIC PORTAL */}
        {portal === 'public' && (
          <div>
            {publicTab === 'home' && (
              <PublicHome
                onGoToReport={() => setPublicTab('report')}
                onGoToTrack={() => setPublicTab('track')}
                onGoToAuthority={() => {
                  setPortal('authority');
                  setAuthorityTab('dashboard');
                }}
                onSelectBin={() => {
                  setPortal('authority');
                  setAuthorityTab('dustbins');
                }}
              />
            )}

            {publicTab === 'report' && (
              <ReportDustbinPage
                onReportCreated={id => setActiveReportIdForTracking(id)}
                onGoToTrack={id => {
                  if (id) setActiveReportIdForTracking(id);
                  setPublicTab('track');
                }}
              />
            )}

            {publicTab === 'track' && (
              <TrackReportPage
                initialReportId={activeReportIdForTracking}
                onGoToReport={() => setPublicTab('report')}
              />
            )}

            {publicTab === 'about' && <AboutProject />}
          </div>
        )}

        {/* AUTHORITY PORTAL */}
        {portal === 'authority' && (
          <div>
            {authorityTab === 'dashboard' && (
              <AuthorityDashboard
                onNavigateToTab={tab => setAuthorityTab(tab)}
                onOpenSimulatorForBin={() => setIsSimulatorOpen(true)}
              />
            )}

            {authorityTab === 'dustbins' && (
              <DustbinTable
                onInspectOnMap={() => setAuthorityTab('map')}
                onOpenSimulatorForBin={() => setIsSimulatorOpen(true)}
              />
            )}

            {authorityTab === 'reports' && <ReportsManagement />}

            {authorityTab === 'alerts' && (
              <AlertsCenter
                onTriggerRoute={() => setAuthorityTab('route')}
                onInspectBin={() => setAuthorityTab('dustbins')}
              />
            )}

            {authorityTab === 'map' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Full-Scale GIS Waste Management Map
                      </h2>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Google Maps Live</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Real-time Google Maps spatial tracking of all 18 dustbins, citizen grievance flags, fleet vehicles, and 2-opt route polylines
                    </p>
                  </div>
                </div>
                <InteractiveMap
                  dustbins={dustbins}
                  reports={reports}
                  vehicles={vehicles}
                  activeRoute={activeRoute}
                  depotLocation={depotLocation}
                  className="h-[640px]"
                />
              </div>
            )}

            {authorityTab === 'route' && (
              <RouteOptimizationView
                onGoToDriverConsole={() => setPortal('driver')}
              />
            )}

            {authorityTab === 'vehicles' && <VehiclesView />}

            {authorityTab === 'history' && <CollectionHistoryView />}
          </div>
        )}

        {/* DRIVER PORTAL */}
        {portal === 'driver' && (
          <DriverConsole
            onGoToRouteOptimizer={() => {
              setPortal('authority');
              setAuthorityTab('route');
            }}
          />
        )}
      </main>

      {/* Persistent Guided Demo Scenario Walkthrough Bar (PRD Section 26) */}
      <DemoScenarioWalkthrough
        onNavigateTab={handleNavigate}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* IoT Sensor Simulator Modal (PRD Section 7 & 24) */}
      <SensorSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* Firebase Setup Guide & Config Modal */}
      <FirebaseSetupModal
        isOpen={isFirebaseSetupOpen}
        onClose={() => setIsFirebaseSetupOpen(false)}
      />

      {/* Authentication Login / Sign-up Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onOpenFirebaseSetup={() => setIsFirebaseSetupOpen(true)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-400">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                <Recycle className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-base text-white">EcoRoute AI</span>
            </div>
            <p className="leading-relaxed">
              AI-Based Smart Waste Management System using IoT ultrasonic sensors, citizen reporting, and intelligent route optimization heuristics.
            </p>
            <div className="text-[11px] text-emerald-400 font-semibold">
              Designed for College Final-Year Project Demonstration
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">System Portals</h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => {
                    setPortal('public');
                    setPublicTab('home');
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Citizen Public Grievance Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setPortal('authority');
                    setAuthorityTab('dashboard');
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Municipal Authority Command Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPortal('driver')}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Driver Navigation & Collection Console
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsSimulatorOpen(true)}
                  className="hover:text-emerald-400 transition-colors"
                >
                  ESP32 IoT Sensor Simulator
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Technical Architecture</h4>
            <ul className="space-y-1.5">
              <li>• ESP32 + HC-SR04 Ultrasonic Telemetry</li>
              <li>• Multi-Factor Dynamic Priority Scoring</li>
              <li>• Nearest-Neighbor + 2-Opt TSP Optimizer</li>
              <li>• React 19 + TypeScript + Tailwind CSS</li>
              <li>• Leaflet OpenStreetMap Engine</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Hardware Ready</h4>
            <p className="text-[11px] leading-relaxed">
              REST API contract ready for real ESP32 microcontrollers over Wi-Fi/GSM.
            </p>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Open Sensor Simulator
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-3">
          <div>
            © 2026 EcoRoute AI • Smart Waste Management System Using IoT & AI.
          </div>
          <div className="flex items-center gap-3">
            <span>Prototype Demonstration Build</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Ready for Academic Review</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WasteProvider>
        <MainApp />
      </WasteProvider>
    </AuthProvider>
  );
}
