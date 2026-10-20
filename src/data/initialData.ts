import { Dustbin, PublicReport, Vehicle, SystemAlert, CollectionHistoryItem, LocationCoordinates } from '../types/waste';

export const DEPOT_LOCATION: LocationCoordinates = {
  latitude: 13.3440,
  longitude: 74.7475,
  address: "Central Waste Transfer Station & Fleet Depot, Sector 4",
};

// 18 realistic dustbins across geographic zones
export const INITIAL_DUSTBINS: Dustbin[] = [
  {
    id: "DB-001",
    name: "College Road Junction",
    zone: "Education Hub",
    latitude: 13.3482,
    longitude: 74.7431,
    fillLevel: 45,
    status: "Normal",
    capacityLiters: 240,
    batteryLevel: 96,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:15:00Z",
    lastCollected: "2026-09-30T16:30:00Z",
    activeComplaintCount: 0,
    address: "Opposite Engineering Campus Gate 1, College Rd"
  },
  {
    id: "DB-002",
    name: "Market Road Commercial Complex",
    zone: "Commercial District",
    latitude: 13.3512,
    longitude: 74.7465,
    fillLevel: 78,
    status: "Nearly Full",
    capacityLiters: 360,
    batteryLevel: 88,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:25:00Z",
    lastCollected: "2026-09-30T08:00:00Z",
    activeComplaintCount: 1,
    address: "Near Central Vegetable Market, Lane 3"
  },
  {
    id: "DB-003",
    name: "City Bus Stand Platform 4",
    zone: "Transit Sector",
    latitude: 13.3409,
    longitude: 74.7421,
    fillLevel: 94,
    status: "Critical",
    capacityLiters: 480,
    batteryLevel: 92,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:30:00Z",
    lastCollected: "2026-09-29T18:45:00Z",
    activeComplaintCount: 2,
    address: "Inter-State Bus Terminal, Arrival Concourse"
  },
  {
    id: "DB-004",
    name: "Main High Street Promenade",
    zone: "Commercial District",
    latitude: 13.3435,
    longitude: 74.7490,
    fillLevel: 63,
    status: "Nearly Full",
    capacityLiters: 240,
    batteryLevel: 85,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:20:00Z",
    lastCollected: "2026-09-30T14:15:00Z",
    activeComplaintCount: 0,
    address: "Main High St, Near Shopping Plaza"
  },
  {
    id: "DB-005",
    name: "Green Meadows Residential Area",
    zone: "Residential South",
    latitude: 13.3365,
    longitude: 74.7385,
    fillLevel: 88,
    status: "Critical",
    capacityLiters: 360,
    batteryLevel: 90,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:28:00Z",
    lastCollected: "2026-09-29T11:00:00Z",
    activeComplaintCount: 1,
    address: "Block B Park Corner, Green Meadows Avenue"
  },
  {
    id: "DB-006",
    name: "Metro Station North Exit",
    zone: "Transit Sector",
    latitude: 13.3550,
    longitude: 74.7395,
    fillLevel: 32,
    status: "Normal",
    capacityLiters: 240,
    batteryLevel: 94,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:10:00Z",
    lastCollected: "2026-10-01T06:30:00Z",
    activeComplaintCount: 0,
    address: "North Concourse Escalator Bay, Metro Gate 2"
  },
  {
    id: "DB-007",
    name: "District Government Hospital",
    zone: "Healthcare Zone",
    latitude: 13.3380,
    longitude: 74.7460,
    fillLevel: 96,
    status: "Critical",
    capacityLiters: 480,
    batteryLevel: 79,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:32:00Z",
    lastCollected: "2026-09-29T14:20:00Z",
    activeComplaintCount: 2,
    address: "OPD Entrance Boulevard, District General Hospital"
  },
  {
    id: "DB-008",
    name: "Riverside Food Court & Walkway",
    zone: "Commercial District",
    latitude: 13.3460,
    longitude: 74.7350,
    fillLevel: 82,
    status: "Critical",
    capacityLiters: 360,
    batteryLevel: 91,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:26:00Z",
    lastCollected: "2026-09-30T07:10:00Z",
    activeComplaintCount: 1,
    address: "Promenade Pier 3, Riverside Food Kiosks"
  },
  {
    id: "DB-009",
    name: "Science & Technology Park",
    zone: "Tech Zone",
    latitude: 13.3585,
    longitude: 74.7445,
    fillLevel: 42,
    status: "Normal",
    capacityLiters: 240,
    batteryLevel: 98,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:05:00Z",
    lastCollected: "2026-10-01T07:00:00Z",
    activeComplaintCount: 0,
    address: "Innovation Center Courtyard, Tech Park"
  },
  {
    id: "DB-010",
    name: "Railway Colony Community Hall",
    zone: "Residential North",
    latitude: 13.3530,
    longitude: 74.7520,
    fillLevel: 72,
    status: "Nearly Full",
    capacityLiters: 240,
    batteryLevel: 83,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:18:00Z",
    lastCollected: "2026-09-30T10:00:00Z",
    activeComplaintCount: 0,
    address: "Community Hall Grounds, 4th Cross"
  },
  {
    id: "DB-011",
    name: "Central Railway Station West",
    zone: "Transit Sector",
    latitude: 13.3470,
    longitude: 74.7510,
    fillLevel: 87,
    status: "Critical",
    capacityLiters: 480,
    batteryLevel: 89,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:29:00Z",
    lastCollected: "2026-09-29T20:00:00Z",
    activeComplaintCount: 1,
    address: "Railway Station West Wing Auto Stand"
  },
  {
    id: "DB-012",
    name: "Public Library & Cultural Center",
    zone: "Education Hub",
    latitude: 13.3445,
    longitude: 74.7405,
    fillLevel: 28,
    status: "Normal",
    capacityLiters: 240,
    batteryLevel: 95,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T09:50:00Z",
    lastCollected: "2026-10-01T06:15:00Z",
    activeComplaintCount: 0,
    address: "Library Garden, Town Hall Square"
  },
  {
    id: "DB-013",
    name: "Wholesale Fish & Vegetable Yard",
    zone: "Commercial District",
    latitude: 13.3415,
    longitude: 74.7335,
    fillLevel: 91,
    status: "Critical",
    capacityLiters: 480,
    batteryLevel: 87,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:31:00Z",
    lastCollected: "2026-09-29T16:30:00Z",
    activeComplaintCount: 1,
    address: "Auction Bay 2, Wholesale Market Yard"
  },
  {
    id: "DB-014",
    name: "Sunrise Lake Joggers Park",
    zone: "Recreation Zone",
    latitude: 13.3320,
    longitude: 74.7430,
    fillLevel: 52,
    status: "Nearly Full",
    capacityLiters: 240,
    batteryLevel: 93,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:14:00Z",
    lastCollected: "2026-09-30T17:00:00Z",
    activeComplaintCount: 0,
    address: "Lake View Trailhead South"
  },
  {
    id: "DB-015",
    name: "Industrial Estate Sector 7",
    zone: "Industrial Zone",
    latitude: 13.3620,
    longitude: 74.7505,
    fillLevel: 68,
    status: "Nearly Full",
    capacityLiters: 360,
    batteryLevel: 86,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:22:00Z",
    lastCollected: "2026-09-30T12:00:00Z",
    activeComplaintCount: 0,
    address: "Factory Main Gate Road, Sector 7"
  },
  {
    id: "DB-016",
    name: "Children's Memorial Hospital",
    zone: "Healthcare Zone",
    latitude: 13.3350,
    longitude: 74.7485,
    fillLevel: 41,
    status: "Normal",
    capacityLiters: 240,
    batteryLevel: 97,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T09:40:00Z",
    lastCollected: "2026-10-01T06:00:00Z",
    activeComplaintCount: 0,
    address: "Emergency Entrance Slip Road"
  },
  {
    id: "DB-017",
    name: "Sports Complex & Stadium",
    zone: "Recreation Zone",
    latitude: 13.3510,
    longitude: 74.7360,
    fillLevel: 38,
    status: "Normal",
    capacityLiters: 360,
    batteryLevel: 94,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:00:00Z",
    lastCollected: "2026-10-01T07:30:00Z",
    activeComplaintCount: 0,
    address: "Gate 4 VIP Parking, City Stadium"
  },
  {
    id: "DB-018",
    name: "Sunset Boulevard Residential Towers",
    zone: "Residential South",
    latitude: 13.3335,
    longitude: 74.7390,
    fillLevel: 84,
    status: "Critical",
    capacityLiters: 360,
    batteryLevel: 81,
    sensorHealth: "Optimal",
    lastUpdated: "2026-10-01T10:27:00Z",
    lastCollected: "2026-09-29T15:00:00Z",
    activeComplaintCount: 1,
    address: "Sunset Boulevard Block 3 Service Lane"
  }
];

// Sample realistic images for public complaints (base64 SVG data URLs for instant offline fidelity)
const createComplaintSvgUrl = (label: string, bgHue: number) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${bgHue}, 40%, 30%)"/>
        <stop offset="100%" stop-color="hsl(${bgHue}, 50%, 15%)"/>
      </linearGradient>
    </defs>
    <rect width="400" height="300" fill="url(#g)"/>
    <rect x="150" y="80" width="100" height="150" rx="8" fill="#475569" stroke="#94a3b8" stroke-width="4"/>
    <path d="M140 80 L260 80 L240 60 L160 60 Z" fill="#64748b"/>
    <circle cx="200" cy="155" r="24" fill="#ef4444" opacity="0.9"/>
    <text x="200" y="163" fill="#ffffff" font-size="24" font-weight="bold" text-anchor="middle" font-family="sans-serif">!</text>
    <path d="M130 220 C 170 200, 230 240, 270 220" stroke="#f59e0b" stroke-width="6" fill="none" stroke-linecap="round"/>
    <rect x="20" y="240" width="360" height="40" rx="6" fill="rgba(0,0,0,0.6)"/>
    <text x="200" y="265" fill="#f8fafc" font-size="14" font-weight="600" text-anchor="middle" font-family="sans-serif">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const INITIAL_REPORTS: PublicReport[] = [
  {
    id: "REPORT-2026-001",
    photo: createComplaintSvgUrl("Overflowing Dumpster at Bus Stand", 0),
    location: "City Bus Stand Platform 4",
    latitude: 13.3409,
    longitude: 74.7421,
    dustbinId: "DB-003",
    issueType: "Overflowing Dustbin",
    description: "Trash spilling onto passenger waiting concourse. Plastic bottles and organic waste overflowing onto pavement.",
    createdAt: "2026-10-01T08:30:00Z",
    status: "Under Review",
    reporterName: "Aditya Hegde",
    reporterPhone: "+91 98451 22345"
  },
  {
    id: "REPORT-2026-002",
    photo: createComplaintSvgUrl("Medical Complex Waste Spill", 340),
    location: "District Government Hospital Gate",
    latitude: 13.3380,
    longitude: 74.7460,
    dustbinId: "DB-007",
    issueType: "Overflowing Dustbin",
    description: "Bin lid jammed open with overflow. Poses hygiene hazard for patients walking toward OPD.",
    createdAt: "2026-10-01T09:10:00Z",
    status: "Submitted",
    reporterName: "Dr. Suma Rao",
    reporterPhone: "+91 98200 45678"
  },
  {
    id: "REPORT-2026-003",
    photo: createComplaintSvgUrl("Uncollected Commercial Waste", 25),
    location: "Market Road Commercial Complex",
    latitude: 13.3512,
    longitude: 74.7465,
    dustbinId: "DB-002",
    issueType: "Waste Around Dustbin",
    description: "Cardboard boxes and vegetable crates dumped around bin perimeter, blocking drainage.",
    createdAt: "2026-10-01T07:45:00Z",
    status: "Assigned",
    reporterName: "Prakash Nayak",
    reporterPhone: "+91 94481 99120",
    assignedVehicleId: "VEH-01"
  },
  {
    id: "REPORT-2026-004",
    photo: createComplaintSvgUrl("Damaged Ultrasonic Sensor Lid", 200),
    location: "Green Meadows Residential Block B",
    latitude: 13.3365,
    longitude: 74.7385,
    dustbinId: "DB-005",
    issueType: "Damaged Dustbin",
    description: "Top hinge damaged, lid hanging sideways after heavy wind storm.",
    createdAt: "2026-09-30T17:20:00Z",
    status: "In Progress",
    reporterName: "Ananya Pai",
    reporterPhone: "+91 97412 33445",
    assignedVehicleId: "VEH-02"
  },
  {
    id: "REPORT-2026-005",
    photo: createComplaintSvgUrl("Resolved: Waterfront Cleaned", 140),
    location: "Riverside Food Court Walkway",
    latitude: 13.3460,
    longitude: 74.7350,
    dustbinId: "DB-008",
    issueType: "Overflowing Dustbin",
    description: "Night snack packaging overfilled the bins.",
    createdAt: "2026-09-30T06:00:00Z",
    status: "Resolved",
    reporterName: "Karthik Shenoy",
    reporterPhone: "+91 96112 88776",
    assignedVehicleId: "VEH-01",
    resolvedAt: "2026-09-30T07:15:00Z",
    resolutionNotes: "Compactor truck dispatched, bins emptied and 15m radius sanitized."
  },
  {
    id: "REPORT-2026-006",
    photo: createComplaintSvgUrl("Illegal Dumping at Wholesaler Yard", 30),
    location: "Wholesale Fish & Vegetable Yard",
    latitude: 13.3415,
    longitude: 74.7335,
    dustbinId: "DB-013",
    issueType: "Waste Around Dustbin",
    description: "Heavy stench and stray animals gathering around overflowing bin.",
    createdAt: "2026-10-01T09:40:00Z",
    status: "Submitted",
    reporterName: "Vinod Shetty",
    reporterPhone: "+91 98863 11223"
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: "VEH-01",
    vehicleNumber: "KA-20-EA-4412",
    driverName: "Ramesh Kumar",
    driverPhone: "+91 98450 11223",
    currentLocation: {
      latitude: 13.3440,
      longitude: 74.7475,
      address: "Central Fleet Depot, Bay 1"
    },
    capacityKg: 1500,
    currentLoadKg: 320,
    status: "Available"
  },
  {
    id: "VEH-02",
    vehicleNumber: "KA-20-EA-8890",
    driverName: "Suresh Gowda",
    driverPhone: "+91 97410 44556",
    currentLocation: {
      latitude: 13.3365,
      longitude: 74.7385,
      address: "Green Meadows Avenue"
    },
    capacityKg: 1800,
    currentLoadKg: 950,
    status: "On Route"
  },
  {
    id: "VEH-03",
    vehicleNumber: "KA-20-EA-3321",
    driverName: "Deepak Poojary",
    driverPhone: "+91 99001 77889",
    currentLocation: {
      latitude: 13.3585,
      longitude: 74.7445,
      address: "Tech Park Maintenance Hub"
    },
    capacityKg: 1200,
    currentLoadKg: 0,
    status: "Available"
  }
];

export const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: "ALT-001",
    type: "CRITICAL_FILL",
    severity: "critical",
    title: "Critical Dustbin Alert",
    message: "DB-007 (District Government Hospital) has reached 96% capacity. Immediate collection required.",
    location: "OPD Entrance Boulevard, District General Hospital",
    dustbinId: "DB-007",
    timestamp: "2026-10-01T10:32:00Z",
    read: false
  },
  {
    id: "ALT-002",
    type: "CRITICAL_FILL",
    severity: "critical",
    title: "Critical Dustbin Alert",
    message: "DB-003 (City Bus Stand) has reached 94% capacity with 2 citizen complaints.",
    location: "Inter-State Bus Terminal, Arrival Concourse",
    dustbinId: "DB-003",
    timestamp: "2026-10-01T10:30:00Z",
    read: false
  },
  {
    id: "ALT-003",
    type: "CRITICAL_FILL",
    severity: "critical",
    title: "Critical Dustbin Alert",
    message: "DB-013 (Wholesale Fish Yard) has reached 91% capacity.",
    location: "Wholesale Fish & Vegetable Yard",
    dustbinId: "DB-013",
    timestamp: "2026-10-01T10:31:00Z",
    read: false
  },
  {
    id: "ALT-004",
    type: "CITIZEN_REPORT",
    severity: "warning",
    title: "New Public Complaint Filed",
    message: "REPORT-2026-006 received: Waste Around Dustbin at Wholesale Yard.",
    location: "Wholesale Fish & Vegetable Yard",
    dustbinId: "DB-013",
    reportId: "REPORT-2026-006",
    timestamp: "2026-10-01T09:40:00Z",
    read: false
  }
];

export const INITIAL_COLLECTION_HISTORY: CollectionHistoryItem[] = [
  {
    id: "COL-001",
    dustbinId: "DB-006",
    dustbinName: "Metro Station North Exit",
    zone: "Transit Sector",
    collectedAt: "2026-10-01T06:30:00Z",
    collectedByVehicle: "KA-20-EA-4412",
    driverName: "Ramesh Kumar",
    previousFillLevel: 91,
    wasteWeightKg: 185
  },
  {
    id: "COL-002",
    dustbinId: "DB-012",
    dustbinName: "Public Library & Cultural Center",
    zone: "Education Hub",
    collectedAt: "2026-10-01T06:15:00Z",
    collectedByVehicle: "KA-20-EA-4412",
    driverName: "Ramesh Kumar",
    previousFillLevel: 88,
    wasteWeightKg: 142
  },
  {
    id: "COL-003",
    dustbinId: "DB-016",
    dustbinName: "Children's Memorial Hospital",
    zone: "Healthcare Zone",
    collectedAt: "2026-10-01T06:00:00Z",
    collectedByVehicle: "KA-20-EA-4412",
    driverName: "Ramesh Kumar",
    previousFillLevel: 85,
    wasteWeightKg: 160
  },
  {
    id: "COL-004",
    dustbinId: "DB-009",
    dustbinName: "Science & Technology Park",
    zone: "Tech Zone",
    collectedAt: "2026-10-01T07:00:00Z",
    collectedByVehicle: "KA-20-EA-3321",
    driverName: "Deepak Poojary",
    previousFillLevel: 94,
    wasteWeightKg: 195
  },
  {
    id: "COL-005",
    dustbinId: "DB-017",
    dustbinName: "Sports Complex & Stadium",
    zone: "Recreation Zone",
    collectedAt: "2026-10-01T07:30:00Z",
    collectedByVehicle: "KA-20-EA-3321",
    driverName: "Deepak Poojary",
    previousFillLevel: 89,
    wasteWeightKg: 210
  }
];
