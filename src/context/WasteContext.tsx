import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Dustbin,
  PublicReport,
  Vehicle,
  SystemAlert,
  CollectionHistoryItem,
  RoutePlan,
  OptimizationWeights,
  SensorTelemetry,
  ReportStatus,
  LocationCoordinates
} from '../types/waste';
import {
  INITIAL_DUSTBINS,
  INITIAL_REPORTS,
  INITIAL_VEHICLES,
  INITIAL_ALERTS,
  INITIAL_COLLECTION_HISTORY,
  DEPOT_LOCATION
} from '../data/initialData';
import { optimizeCollectionRoute } from '../utils/routeOptimizer';
import { estimateWasteWeightKg } from '../utils/geoUtils';
import { API_BASE_URL as BACKEND_URL } from '../utils/apiConfig';

export interface HardwareInfo {
  status: string;
  local_ip: string;
  port: number;
  telemetry_url: string;
  test_curl: string;
  recent_readings: any[];
}

interface WasteContextType {
  // State
  dustbins: Dustbin[];
  reports: PublicReport[];
  vehicles: Vehicle[];
  alerts: SystemAlert[];
  activeRoute: RoutePlan | null;
  collectionHistory: CollectionHistoryItem[];
  weights: OptimizationWeights;
  depotLocation: LocationCoordinates;
  
  // Backend & Hardware Connection State
  isBackendConnected: boolean;
  hardwareInfo: HardwareInfo | null;
  refreshFromDatabase: () => Promise<void>;

  // Simulator
  isSimulatorRunning: boolean;
  lastTelemetry: SensorTelemetry | null;
  toggleSimulator: () => void;
  updateDustbinFill: (dustbinId: string, newFill: number) => void;
  triggerEmergencyOverflow: (dustbinId: string) => void;
  resetDustbin: (dustbinId: string) => void;
  resetAllDustbins: () => void;
  receiveEsp32Telemetry: (telemetry: SensorTelemetry) => void;

  // Dustbin CRUD Actions
  addDustbin: (binData: Partial<Dustbin>) => Promise<{ success: boolean; error?: string; dustbin?: Dustbin }>;
  deleteDustbin: (binId: string) => Promise<{ success: boolean; error?: string }>;
  deleteMultipleDustbins: (binIds: string[]) => Promise<{ success: boolean; error?: string; deletedCount?: number }>;
  keepOnlyHardwareBin: () => Promise<boolean>;
  restoreDefaultDustbins: () => Promise<boolean>;
  randomizeBinFillLevels: () => Promise<boolean>;
  createMultipleRandomBins: (count?: number) => Promise<boolean>;

  // Public Report Actions
  submitReport: (newReport: Omit<PublicReport, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  getReportById: (reportId: string) => PublicReport | undefined;

  // Authority Actions
  updateReportStatus: (
    reportId: string,
    status: ReportStatus,
    assignedVehicleId?: string,
    resolutionNotes?: string
  ) => void;
  markAlertRead: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  setWeights: React.Dispatch<React.SetStateAction<OptimizationWeights>>;
  generateRoute: (vehicleId?: string) => RoutePlan;
  dispatchRoute: (route: RoutePlan) => void;

  // Driver Actions
  markStopCollected: (dustbinId: string) => void;
  completeRoute: () => void;

  // Demo Walkthrough
  activeDemoStep: number;
  setActiveDemoStep: (step: number) => void;
}

const WasteContext = createContext<WasteContextType | undefined>(undefined);

const DEFAULT_WEIGHTS: OptimizationWeights = {
  fillWeight: 0.50,
  complaintWeight: 0.30,
  urgencyWeight: 0.20,
  criticalThreshold: 70, // Critical areas above 70%
  mediumThreshold: 40,   // Medium areas 40% - 70%
  includeNearlyFull: true,
  vehicleCapacityKg: 1500,
  routeTierFilter: 'critical_only'
};

export const WasteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dustbins, setDustbins] = useState<Dustbin[]>(INITIAL_DUSTBINS);
  const [reports, setReports] = useState<PublicReport[]>(INITIAL_REPORTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_ALERTS);
  const [activeRoute, setActiveRoute] = useState<RoutePlan | null>(null);
  const [collectionHistory, setCollectionHistory] = useState<CollectionHistoryItem[]>(INITIAL_COLLECTION_HISTORY);
  const [weights, setWeights] = useState<OptimizationWeights>(DEFAULT_WEIGHTS);
  const [isSimulatorRunning, setIsSimulatorRunning] = useState<boolean>(false);
  const [lastTelemetry, setLastTelemetry] = useState<SensorTelemetry | null>(null);
  const [activeDemoStep, setActiveDemoStep] = useState<number>(1);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);

  // Re-fetch everything from backend database
  const refreshFromDatabase = useCallback(async () => {
    try {
      const [binsRes, reportsRes, alertsRes, histRes, hwRes] = await Promise.allSettled([
        fetch(`${BACKEND_URL}/dustbins`).then(r => r.json()),
        fetch(`${BACKEND_URL}/reports`).then(r => r.json()),
        fetch(`${BACKEND_URL}/alerts`).then(r => r.json()),
        fetch(`${BACKEND_URL}/history`).then(r => r.json()),
        fetch(`${BACKEND_URL}/hardware/info`).then(r => r.json())
      ]);

      if (binsRes.status === 'fulfilled' && Array.isArray(binsRes.value)) {
        setDustbins(binsRes.value);
        setIsBackendConnected(true);
      }
      if (reportsRes.status === 'fulfilled' && Array.isArray(reportsRes.value)) {
        setReports(reportsRes.value);
      }
      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value)) {
        setAlerts(alertsRes.value);
      }
      if (histRes.status === 'fulfilled' && Array.isArray(histRes.value)) {
        setCollectionHistory(histRes.value);
      }
      if (hwRes.status === 'fulfilled' && hwRes.value) {
        setHardwareInfo(hwRes.value);
      }
    } catch (e) {
      setIsBackendConnected(false);
    }
  }, []);

  // Initial load from backend and hardware info
  useEffect(() => {
    refreshFromDatabase();
  }, [refreshFromDatabase]);

  // Periodic polling every 3 seconds to catch live ESP32 hardware transmissions
  useEffect(() => {
    const timer = setInterval(() => {
      refreshFromDatabase();
    }, 3000);
    return () => clearInterval(timer);
  }, [refreshFromDatabase]);

  // Update dustbin fill level (synced to SQLite database)
  const updateDustbinFill = useCallback((dustbinId: string, newFill: number) => {
    const clampedFill = Math.min(100, Math.max(0, Math.round(newFill)));

    // Send to backend
    fetch(`${BACKEND_URL}/dustbins/${dustbinId}/fill`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fill_level: clampedFill })
    }).catch(() => {});

    // Update local state immediately for responsive feel
    setDustbins(prev =>
      prev.map(bin => {
        if (bin.id === dustbinId) {
          const status = clampedFill >= weights.criticalThreshold ? 'Critical' : clampedFill >= (weights.mediumThreshold || 40) ? 'Nearly Full' : 'Normal';
          return {
            ...bin,
            fillLevel: clampedFill,
            status,
            lastUpdated: new Date().toISOString()
          };
        }
        return bin;
      })
    );
  }, [weights.criticalThreshold, weights.mediumThreshold]);

  // Transmit telemetry to database (simulates ESP32 HTTP POST)
  const receiveEsp32Telemetry = useCallback((telemetry: SensorTelemetry) => {
    setLastTelemetry(telemetry);
    fetch(`${BACKEND_URL}/sensors/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetry)
    })
      .then(() => refreshFromDatabase())
      .catch(() => {
        updateDustbinFill(telemetry.dustbin_id, telemetry.fill_level);
      });
  }, [refreshFromDatabase, updateDustbinFill]);

  const triggerEmergencyOverflow = useCallback((dustbinId: string) => {
    receiveEsp32Telemetry({
      dustbin_id: dustbinId,
      fill_level: 96,
      distance_cm: 4,
      latitude: 13.3409,
      longitude: 74.7421,
      timestamp: new Date().toISOString(),
      status: 'Critical',
      battery_pct: 95
    });
  }, [receiveEsp32Telemetry]);

  const resetDustbin = useCallback((dustbinId: string) => {
    fetch(`${BACKEND_URL}/dustbins/${dustbinId}/fill`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fill_level: 0 })
    }).catch(() => {});

    setDustbins(prev =>
      prev.map(b => (b.id === dustbinId ? { ...b, fillLevel: 0, status: 'Normal', activeComplaintCount: 0 } : b))
    );
  }, []);

  const resetAllDustbins = useCallback(() => {
    setDustbins(INITIAL_DUSTBINS);
    setReports(INITIAL_REPORTS);
    setVehicles(INITIAL_VEHICLES);
    setAlerts(INITIAL_ALERTS);
    setActiveRoute(null);
  }, []);

  // Add new dustbin
  const addDustbin = useCallback(async (binData: Partial<Dustbin>): Promise<{ success: boolean; error?: string; dustbin?: Dustbin }> => {
    try {
      const res = await fetch(`${BACKEND_URL}/dustbins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(binData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to add dustbin' };
      }
      if (data.dustbin) {
        setDustbins(prev => [data.dustbin, ...prev]);
        return { success: true, dustbin: data.dustbin };
      }
      await refreshFromDatabase();
      return { success: true };
    } catch {
      // Local fallback if offline
      const id = binData.id || `DB-${String(dustbins.length + 1).padStart(3, '0')}`;
      const nowIso = new Date().toISOString();
      const newBin: Dustbin = {
        id,
        name: binData.name || 'New Dustbin',
        zone: binData.zone || 'General Zone',
        latitude: binData.latitude || 13.3440,
        longitude: binData.longitude || 74.7430,
        fillLevel: binData.fillLevel || 0,
        status: 'Normal',
        capacityLiters: binData.capacityLiters || 240,
        batteryLevel: 95,
        sensorHealth: 'Optimal',
        lastUpdated: nowIso,
        lastCollected: nowIso,
        activeComplaintCount: 0,
        address: binData.address || 'Installed Location'
      };
      setDustbins(prev => [newBin, ...prev]);
      return { success: true, dustbin: newBin };
    }
  }, [dustbins.length, refreshFromDatabase]);

  // Delete dustbin
  const deleteDustbin = useCallback(async (binId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${BACKEND_URL}/dustbins/${binId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to delete dustbin' };
      }
      setDustbins(prev => prev.filter(b => b.id !== binId));
      return { success: true };
    } catch {
      setDustbins(prev => prev.filter(b => b.id !== binId));
      return { success: true };
    }
  }, []);

  // Batch delete dustbins
  const deleteMultipleDustbins = useCallback(async (binIds: string[]): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
    if (!binIds || binIds.length === 0) return { success: true, deletedCount: 0 };
    try {
      const res = await fetch(`${BACKEND_URL}/dustbins/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: binIds })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to batch delete' };
      }
      setDustbins(prev => prev.filter(b => !binIds.includes(b.id)));
      return { success: true, deletedCount: data.deleted_count ?? binIds.length };
    } catch {
      setDustbins(prev => prev.filter(b => !binIds.includes(b.id)));
      return { success: true, deletedCount: binIds.length };
    }
  }, []);

  // Keep only hardware bin (delete all simulated bins)
  const keepOnlyHardwareBin = useCallback(async (): Promise<boolean> => {
    try {
      await fetch(`${BACKEND_URL}/dustbins/keep-only-hardware`, { method: 'POST' });
      setDustbins(prev => prev.filter(b => b.id === 'DB-003'));
      await refreshFromDatabase();
      return true;
    } catch {
      setDustbins(prev => prev.filter(b => b.id === 'DB-003'));
      return true;
    }
  }, [refreshFromDatabase]);

  // Restore 18 default bins
  const restoreDefaultDustbins = useCallback(async (): Promise<boolean> => {
    try {
      await fetch(`${BACKEND_URL}/dustbins/reset-defaults`, { method: 'POST' });
      await refreshFromDatabase();
      return true;
    } catch {
      setDustbins(INITIAL_DUSTBINS);
      return true;
    }
  }, [refreshFromDatabase]);

  // Randomize all dustbins for Objective 3 testing
  const randomizeBinFillLevels = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_URL}/dustbins/randomize`, { method: 'POST' });
      const data = await res.json();
      if (data.dustbins && Array.isArray(data.dustbins)) {
        await refreshFromDatabase();
        return true;
      }
      await refreshFromDatabase();
      return true;
    } catch {
      // Local fallback: Randomize in-memory if backend not reachable
      setDustbins(prev => {
        const shuffled = [...prev].sort(() => 0.5 - Math.random());
        const critCount = 5;
        const medCount = 5;
        const nowIso = new Date().toISOString();
        return shuffled.map((b, idx) => {
          let fill = 0;
          let status: 'Critical' | 'Nearly Full' | 'Normal' = 'Normal';
          let complaints = 0;
          if (idx < critCount) {
            fill = Math.floor(Math.random() * 19) + 80;
            status = 'Critical';
            complaints = Math.floor(Math.random() * 3) + 1;
          } else if (idx < critCount + medCount) {
            fill = Math.floor(Math.random() * 31) + 45;
            status = 'Nearly Full';
            complaints = Math.random() > 0.6 ? 1 : 0;
          } else {
            fill = Math.floor(Math.random() * 26) + 10;
            status = 'Normal';
            complaints = 0;
          }
          return {
            ...b,
            fillLevel: fill,
            status,
            activeComplaintCount: complaints,
            lastUpdated: nowIso
          };
        }).sort((a, b) => b.fillLevel - a.fillLevel);
      });
      return true;
    }
  }, [refreshFromDatabase]);

  // Create multiple random bins
  const createMultipleRandomBins = useCallback(async (count = 5): Promise<boolean> => {
    try {
      await fetch(`${BACKEND_URL}/dustbins/create-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      await refreshFromDatabase();
      return true;
    } catch {
      await refreshFromDatabase();
      return true;
    }
  }, [refreshFromDatabase]);

  // Simulator toggle
  const toggleSimulator = () => setIsSimulatorRunning(v => !v);

  // Submit public complaint
  const submitReport = useCallback(async (newReportData: Omit<PublicReport, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    try {
      const res = await fetch(`${BACKEND_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReportData)
      });
      const data = await res.json();
      refreshFromDatabase();
      return data.reportId || `REPORT-${new Date().getFullYear()}-007`;
    } catch {
      // Local fallback
      const reportId = `REPORT-${new Date().getFullYear()}-${String(reports.length + 1).padStart(3, '0')}`;
      const nowIso = new Date().toISOString();
      const report: PublicReport = { ...newReportData, id: reportId, createdAt: nowIso, status: 'Submitted' };
      setReports(prev => [report, ...prev]);
      return reportId;
    }
  }, [refreshFromDatabase, reports.length]);

  const getReportById = useCallback((reportId: string): PublicReport | undefined => {
    const cleanId = reportId.trim().toUpperCase();
    return reports.find(r => r.id.toUpperCase() === cleanId);
  }, [reports]);

  // Authority updates report status
  const updateReportStatus = useCallback((
    reportId: string,
    status: ReportStatus,
    assignedVehicleId?: string,
    resolutionNotes?: string
  ) => {
    fetch(`${BACKEND_URL}/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assignedVehicleId, resolutionNotes })
    }).catch(() => {});

    setReports(prev =>
      prev.map(r => (r.id === reportId ? { ...r, status, assignedVehicleId, resolutionNotes } : r))
    );
  }, []);

  const markAlertRead = useCallback((alertId: string) => {
    fetch(`${BACKEND_URL}/alerts/${alertId}/read`, { method: 'PATCH' }).catch(() => {});
    setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, read: true } : a)));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    fetch(`${BACKEND_URL}/alerts/${alertId}`, { method: 'DELETE' }).catch(() => {});
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Generate Route with AI / Heuristics
  const generateRoute = useCallback((vehicleId?: string): RoutePlan => {
    const selectedVehicle =
      vehicles.find(v => v.id === vehicleId) ||
      vehicles.find(v => v.status === 'Available') ||
      vehicles[0];

    const plan = optimizeCollectionRoute(dustbins, selectedVehicle, DEPOT_LOCATION, weights);
    return plan;
  }, [dustbins, vehicles, weights]);

  // Dispatch route to driver
  const dispatchRoute = useCallback((route: RoutePlan) => {
    const updatedRoute: RoutePlan = {
      ...route,
      status: 'Dispatched'
    };
    setActiveRoute(updatedRoute);

    setVehicles(prev =>
      prev.map(v => (v.id === route.vehicleId ? { ...v, status: 'On Route', assignedRouteId: route.routeId } : v))
    );
  }, []);

  // Driver marks dustbin as collected (synced to database)
  const markStopCollected = useCallback((dustbinId: string) => {
    const targetBin = dustbins.find(b => b.id === dustbinId);
    if (!targetBin) return;

    fetch(`${BACKEND_URL}/dustbins/${dustbinId}/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_number: activeRoute ? activeRoute.vehicleNumber : 'KA-20-EA-4412',
        driver_name: activeRoute ? activeRoute.driverName : 'Ramesh Kumar'
      })
    }).then(() => refreshFromDatabase()).catch(() => {});

    // Update local state immediately
    const previousFill = targetBin.fillLevel;
    const wasteWeight = estimateWasteWeightKg(previousFill, targetBin.capacityLiters);
    const nowIso = new Date().toISOString();

    setDustbins(prev =>
      prev.map(bin => {
        if (bin.id === dustbinId) {
          return {
            ...bin,
            fillLevel: 0,
            status: 'Normal',
            lastUpdated: nowIso,
            lastCollected: nowIso,
            activeComplaintCount: 0
          };
        }
        return bin;
      })
    );

    if (activeRoute) {
      const updatedStops = activeRoute.stops.map(s =>
        s.dustbin.id === dustbinId ? { ...s, collected: true } : s
      );
      const completedCount = updatedStops.filter(s => s.collected).length;
      const allFinished = completedCount === updatedStops.length;

      setActiveRoute({
        ...activeRoute,
        stops: updatedStops,
        completedStopsCount: completedCount,
        status: allFinished ? 'Completed' : 'In Progress'
      });
    }
  }, [dustbins, activeRoute, refreshFromDatabase]);

  const completeRoute = useCallback(() => {
    if (!activeRoute) return;
    setActiveRoute(prev => (prev ? { ...prev, status: 'Completed' } : null));
    setVehicles(prev =>
      prev.map(v => (v.id === activeRoute.vehicleId ? { ...v, status: 'Available', assignedRouteId: undefined } : v))
    );
  }, [activeRoute]);

  return (
    <WasteContext.Provider
      value={{
        dustbins,
        reports,
        vehicles,
        alerts,
        activeRoute,
        collectionHistory,
        weights,
        depotLocation: DEPOT_LOCATION,
        isBackendConnected,
        hardwareInfo,
        refreshFromDatabase,
        isSimulatorRunning,
        lastTelemetry,
        toggleSimulator,
        updateDustbinFill,
        triggerEmergencyOverflow,
        resetDustbin,
        resetAllDustbins,
        receiveEsp32Telemetry,
        addDustbin,
        deleteDustbin,
        deleteMultipleDustbins,
        keepOnlyHardwareBin,
        restoreDefaultDustbins,
        randomizeBinFillLevels,
        createMultipleRandomBins,
        submitReport,
        getReportById,
        updateReportStatus,
        markAlertRead,
        dismissAlert,
        clearAllAlerts,
        setWeights,
        generateRoute,
        dispatchRoute,
        markStopCollected,
        completeRoute,
        activeDemoStep,
        setActiveDemoStep
      }}
    >
      {children}
    </WasteContext.Provider>
  );
};

export const useWaste = (): WasteContextType => {
  const context = useContext(WasteContext);
  if (!context) {
    throw new Error('useWaste must be used within a WasteProvider');
  }
  return context;
};
