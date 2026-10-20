export type DustbinStatus = 'Normal' | 'Nearly Full' | 'Critical';

export type ReportIssueType = 
  | 'Overflowing Dustbin'
  | 'Unmaintained Dustbin'
  | 'Waste Around Dustbin'
  | 'Damaged Dustbin'
  | 'Other';

export type ReportStatus = 
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export type VehicleStatus = 'Available' | 'On Route' | 'Maintenance' | 'Off Duty';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Dustbin {
  id: string; // e.g. "DB-001"
  name: string; // e.g. "College Road Junction"
  zone: string; // e.g. "Central Zone"
  latitude: number;
  longitude: number;
  fillLevel: number; // 0 - 100%
  status: DustbinStatus;
  capacityLiters: number;
  batteryLevel: number; // e.g. 94%
  sensorHealth: 'Optimal' | 'Degraded' | 'Offline';
  lastUpdated: string; // ISO string
  lastCollected: string; // ISO string
  activeComplaintCount: number;
  address: string;
}

export interface PublicReport {
  id: string; // e.g. "REPORT-2026-001"
  photo: string; // URL or Data URL
  location: string;
  latitude: number;
  longitude: number;
  dustbinId?: string; // Optional dustbin reference
  issueType: ReportIssueType;
  description: string;
  createdAt: string;
  status: ReportStatus;
  reporterName: string;
  reporterPhone?: string;
  otpVerified?: boolean;
  assignedVehicleId?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface SensorTelemetry {
  dustbin_id: string;
  fill_level: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  status: DustbinStatus;
  distance_cm?: number; // HC-SR04 raw distance
  battery_pct?: number;
}

export interface Vehicle {
  id: string; // e.g. "VEH-01"
  vehicleNumber: string; // e.g. "KA-20-EA-4412"
  driverName: string;
  driverPhone: string;
  currentLocation: LocationCoordinates;
  capacityKg: number;
  currentLoadKg: number;
  status: VehicleStatus;
  assignedRouteId?: string;
}

export type RouteTierFilter = 'critical_only' | 'critical_then_medium' | 'all_priority';

export interface OptimizedStop {
  stopNumber: number;
  dustbin: Dustbin;
  distanceFromPreviousKm: number;
  priorityScore: number;
  cumulativeDistanceKm: number;
  estimatedArrivalMins: number;
  collected: boolean;
  tier?: 'Critical' | 'Medium' | 'Low';
}

export interface RoutePlan {
  routeId: string;
  vehicleId: string;
  vehicleNumber: string;
  driverName: string;
  createdAt: string;
  stops: OptimizedStop[];
  totalDistanceKm: number;
  estimatedDurationMins: number;
  status: 'Draft' | 'Dispatched' | 'In Progress' | 'Completed';
  depotLocation: LocationCoordinates;
  completedStopsCount: number;
}

export interface SystemAlert {
  id: string;
  type: 'CRITICAL_FILL' | 'OVERFLOW_100' | 'CITIZEN_REPORT' | 'UNRESOLVED_ESCALATION' | 'SENSOR_OFFLINE';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  location: string;
  dustbinId?: string;
  reportId?: string;
  timestamp: string;
  read: boolean;
}

export interface CollectionHistoryItem {
  id: string;
  dustbinId: string;
  dustbinName: string;
  zone: string;
  collectedAt: string;
  collectedByVehicle: string;
  driverName: string;
  previousFillLevel: number;
  wasteWeightKg: number;
}

export interface OptimizationWeights {
  fillWeight: number; // default 0.50
  complaintWeight: number; // default 0.30
  urgencyWeight: number; // default 0.20
  criticalThreshold: number; // default 70%
  mediumThreshold: number; // default 40%
  includeNearlyFull: boolean;
  vehicleCapacityKg: number;
  routeTierFilter?: RouteTierFilter;
}
