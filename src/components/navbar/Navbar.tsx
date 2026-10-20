import React, { useState } from 'react';
import { useWaste } from '../../context/WasteContext';
import { useAuth } from '../../firebase/authContext';
import { SystemAlert } from '../../types/waste';
import {
  Recycle,
  Bell,
  Cpu,
  Truck,
  Shield,
  User,
  Map as MapIcon,
  Route,
  FileText,
  Search,
  Menu,
  X,
  Sparkles,
  BarChart3,
  Archive,
  History,
  Flame,
  Lock
} from 'lucide-react';
import { PWAInstallButton } from '../common/PWAInstallButton';

export type ActivePortal = 'public' | 'authority' | 'driver';
export type PublicTab = 'home' | 'report' | 'track' | 'about';
export type AuthorityTab = 'dashboard' | 'dustbins' | 'reports' | 'alerts' | 'map' | 'route' | 'vehicles' | 'history';

interface NavbarProps {
  portal: ActivePortal;
  setPortal: (p: ActivePortal) => void;
  publicTab: PublicTab;
  setPublicTab: (t: PublicTab) => void;
  authorityTab: AuthorityTab;
  setAuthorityTab: (t: AuthorityTab) => void;
  onOpenSimulator: () => void;
  onOpenFirebaseSetup?: () => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portal,
  setPortal,
  publicTab,
  setPublicTab,
  authorityTab,
  setAuthorityTab,
  onOpenSimulator,
  onOpenFirebaseSetup,
  onOpenLogin
}) => {
  const { alerts, isSimulatorRunning, activeRoute } = useWaste();
  const { currentUser, isFirebaseActive } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadAlerts = alerts.filter((a: SystemAlert) => !a.read).length;
  const criticalCount = alerts.filter((a: SystemAlert) => a.severity === 'critical').length;

  return (
    <header className="sticky top-0 z-[800] bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-md">
      {/* Top Banner for System Status & Quick Role Switching */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              IoT Mesh Live
            </span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">
              Smart Waste Management & AI Route Optimization Prototype
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Firebase Project Setup Button */}
            {onOpenFirebaseSetup && (
              <button
                onClick={onOpenFirebaseSetup}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                  isFirebaseActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${isFirebaseActive ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{isFirebaseActive ? 'Firebase Connected' : 'Firebase Setup'}</span>
                {isFirebaseActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              </button>
            )}

            {/* Install PWA App Button */}
            <PWAInstallButton />

            {/* IoT Telemetry Simulator Quick Toggle Button */}
            <button
              onClick={onOpenSimulator}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                isSimulatorRunning
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>IoT Simulator</span>
              {isSimulatorRunning && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>

            {/* User Account / Login Button */}
            {onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[100px] truncate">
                  {currentUser ? currentUser.displayName : 'Sign In'}
                </span>
              </button>
            )}

            {/* Portal Role Selector */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => {
                  setPortal('public');
                  setMobileMenuOpen(false);
                }}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                  portal === 'public'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3 h-3" /> Citizen
              </button>
              <button
                onClick={() => {
                  setPortal('authority');
                  setMobileMenuOpen(false);
                }}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                  portal === 'authority'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3 h-3" /> Authority
              </button>
              <button
                onClick={() => {
                  setPortal('driver');
                  setMobileMenuOpen(false);
                }}
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${
                  portal === 'driver'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-3 h-3" /> Driver
                {activeRoute && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => {
                setPortal('public');
                setPublicTab('home');
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform">
                <Recycle className="w-6 h-6 text-white stroke-[2.2]" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                  EcoRoute <span className="text-emerald-400">AI</span>
                </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  IoT Waste Management
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {portal === 'public' && (
              <>
                <button
                  onClick={() => setPublicTab('home')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    publicTab === 'home'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setPublicTab('report')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    publicTab === 'report'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Report Dustbin
                </button>
                <button
                  onClick={() => setPublicTab('track')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    publicTab === 'track'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Track Report
                </button>
                <button
                  onClick={() => setPublicTab('about')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    publicTab === 'about'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  About System
                </button>
              </>
            )}

            {portal === 'authority' && (
              <>
                <button
                  onClick={() => setAuthorityTab('dashboard')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    authorityTab === 'dashboard'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Dashboard
                </button>
                <button
                  onClick={() => setAuthorityTab('dustbins')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    authorityTab === 'dustbins'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  Dustbins
                </button>
                <button
                  onClick={() => setAuthorityTab('reports')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    authorityTab === 'reports'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Reports
                </button>
                <button
                  onClick={() => setAuthorityTab('alerts')}
                  className={`relative px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    authorityTab === 'alerts'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  Alerts
                  {unreadAlerts > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                      {unreadAlerts}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setAuthorityTab('map')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    authorityTab === 'map'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  Live Map
                </button>
                <button
                  onClick={() => setAuthorityTab('route')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    authorityTab === 'route'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Route className="w-3.5 h-3.5" />
                  Route Optimizer
                </button>
                <button
                  onClick={() => setAuthorityTab('vehicles')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    authorityTab === 'vehicles'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Vehicles
                </button>
                <button
                  onClick={() => setAuthorityTab('history')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    authorityTab === 'history'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  History
                </button>
              </>
            )}

            {portal === 'driver' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Driver Console Active:</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-xs border border-blue-500/30">
                  Vehicle KA-20-EA-4412
                </span>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen((v: boolean) => !v)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          <div className="text-xs uppercase font-bold text-slate-500 px-2 py-1">
            Current Portal: {portal.toUpperCase()}
          </div>
          {portal === 'public' && (
            <>
              <button
                onClick={() => {
                  setPublicTab('home');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setPublicTab('report');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:bg-slate-800"
              >
                Report Dustbin
              </button>
              <button
                onClick={() => {
                  setPublicTab('track');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Track Report
              </button>
              <button
                onClick={() => {
                  setPublicTab('about');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                About System
              </button>
            </>
          )}

          {portal === 'authority' && (
            <>
              <button
                onClick={() => {
                  setAuthorityTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  setAuthorityTab('dustbins');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Dustbin Monitoring
              </button>
              <button
                onClick={() => {
                  setAuthorityTab('reports');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Public Reports
              </button>
              <button
                onClick={() => {
                  setAuthorityTab('alerts');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Alerts ({unreadAlerts})
              </button>
              <button
                onClick={() => {
                  setAuthorityTab('map');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Map
              </button>
              <button
                onClick={() => {
                  setAuthorityTab('route');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:bg-slate-800"
              >
                Route Optimization
              </button>
              <button
                onClick={() => {
                  setAuthorityTab('vehicles');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Vehicles
              </button>
              <button
                onClick={() => {
                  setAuthorityTab('history');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Collection History
              </button>
            </>
          )}

          {portal === 'driver' && (
            <div className="p-2 text-xs text-slate-300">
              Access the driver collection workflow directly on mobile.
            </div>
          )}

          {/* Mobile Install App Button */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Install as App:</span>
            <PWAInstallButton />
          </div>
        </div>
      )}
    </header>
  );
};
