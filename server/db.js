import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'waste_management.db');

export const db = new DatabaseSync(DB_PATH);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dustbins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      zone TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      fill_level INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Normal',
      capacity_liters INTEGER NOT NULL DEFAULT 240,
      battery_level INTEGER NOT NULL DEFAULT 95,
      sensor_health TEXT NOT NULL DEFAULT 'Optimal',
      last_updated TEXT NOT NULL,
      last_collected TEXT,
      active_complaint_count INTEGER NOT NULL DEFAULT 0,
      address TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sensor_telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dustbin_id TEXT NOT NULL,
      fill_level INTEGER NOT NULL,
      distance_cm REAL,
      battery_pct INTEGER,
      raw_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public_reports (
      id TEXT PRIMARY KEY,
      photo TEXT,
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      dustbin_id TEXT,
      issue_type TEXT NOT NULL,
      description TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_phone TEXT,
      status TEXT NOT NULL DEFAULT 'Submitted',
      assigned_vehicle_id TEXT,
      resolved_at TEXT,
      resolution_notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      location TEXT NOT NULL,
      dustbin_id TEXT,
      report_id TEXT,
      timestamp TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS collection_history (
      id TEXT PRIMARY KEY,
      dustbin_id TEXT NOT NULL,
      dustbin_name TEXT NOT NULL,
      zone TEXT NOT NULL,
      collected_at TEXT NOT NULL,
      collected_by_vehicle TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      previous_fill_level INTEGER NOT NULL,
      waste_weight_kg INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      vehicle_number TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      driver_phone TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT NOT NULL,
      capacity_kg INTEGER NOT NULL DEFAULT 1500,
      current_load_kg INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Available',
      assigned_route_id TEXT
    );
  `);

  // Check if we need to seed initial data
  const countRow = db.prepare('SELECT COUNT(*) as count FROM dustbins').get();
  if (countRow.count === 0) {
    seedInitialData();
  }
}

export function seedInitialData() {
  const insertBin = db.prepare(`
    INSERT INTO dustbins (
      id, name, zone, latitude, longitude, fill_level, status,
      capacity_liters, battery_level, sensor_health, last_updated,
      last_collected, active_complaint_count, address
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const initialBins = [
    ["DB-001", "College Road Junction", "Education Hub", 13.3482, 74.7431, 45, "Normal", 240, 96, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "Opposite Engineering Campus Gate 1, College Rd"],
    ["DB-002", "Market Road Commercial Complex", "Commercial District", 13.3512, 74.7465, 78, "Nearly Full", 360, 88, "Optimal", new Date().toISOString(), new Date().toISOString(), 1, "Near Central Vegetable Market, Lane 3"],
    ["DB-003", "City Bus Stand Platform 4", "Transit Sector", 13.3409, 74.7421, 94, "Critical", 480, 92, "Optimal", new Date().toISOString(), new Date().toISOString(), 2, "Inter-State Bus Terminal, Arrival Concourse"],
    ["DB-004", "Main High Street Promenade", "Commercial District", 13.3435, 74.7490, 63, "Nearly Full", 240, 85, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "Main High St, Near Shopping Plaza"],
    ["DB-005", "Green Meadows Residential Area", "Residential South", 13.3365, 74.7385, 88, "Critical", 360, 90, "Optimal", new Date().toISOString(), new Date().toISOString(), 1, "Block B Park Corner, Green Meadows Avenue"],
    ["DB-006", "Metro Station North Exit", "Transit Sector", 13.3550, 74.7395, 32, "Normal", 240, 94, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "North Concourse Escalator Bay, Metro Gate 2"],
    ["DB-007", "District Government Hospital", "Healthcare Zone", 13.3380, 74.7460, 96, "Critical", 480, 79, "Optimal", new Date().toISOString(), new Date().toISOString(), 2, "OPD Entrance Boulevard, District General Hospital"],
    ["DB-008", "Riverside Food Court & Walkway", "Commercial District", 13.3460, 74.7350, 82, "Critical", 360, 91, "Optimal", new Date().toISOString(), new Date().toISOString(), 1, "Promenade Pier 3, Riverside Food Kiosks"],
    ["DB-009", "Science & Technology Park", "Tech Zone", 13.3585, 74.7445, 42, "Normal", 240, 98, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "Innovation Center Courtyard, Tech Park"],
    ["DB-010", "Railway Colony Community Hall", "Residential North", 13.3530, 74.7520, 72, "Nearly Full", 240, 83, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "Community Hall Grounds, 4th Cross"],
    ["DB-011", "Central Railway Station West", "Transit Sector", 13.3470, 74.7510, 87, "Critical", 480, 89, "Optimal", new Date().toISOString(), new Date().toISOString(), 1, "Railway Station West Wing Auto Stand"],
    ["DB-012", "Public Library & Cultural Center", "Education Hub", 13.3445, 74.7405, 28, "Normal", 240, 95, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "Library Garden, Town Hall Square"],
    ["DB-013", "Wholesale Fish & Vegetable Yard", "Commercial District", 13.3415, 74.7335, 91, "Critical", 480, 87, "Optimal", new Date().toISOString(), new Date().toISOString(), 1, "Auction Bay 2, Wholesale Market Yard"],
    ["DB-014", "Sunrise Lake Joggers Park", "Recreation Zone", 13.3320, 74.7430, 52, "Nearly Full", 240, 93, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "Lake View Trailhead South"],
    ["DB-015", "Industrial Estate Sector 7", "Industrial Zone", 13.3620, 74.7505, 68, "Nearly Full", 360, 86, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "Factory Main Gate Road, Sector 7"],
    ["DB-016", "Children's Memorial Hospital", "Healthcare Zone", 13.3350, 74.7485, 41, "Normal", 240, 97, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "Emergency Entrance Slip Road"],
    ["DB-017", "Sports Complex & Stadium", "Recreation Zone", 13.3510, 74.7360, 38, "Normal", 360, 94, "Optimal", new Date().toISOString(), new Date().toISOString(), 0, "Gate 4 VIP Parking, City Stadium"],
    ["DB-018", "Sunset Boulevard Residential Towers", "Residential South", 13.3335, 74.7390, 84, "Critical", 360, 81, "Optimal", new Date().toISOString(), new Date().toISOString(), 1, "Sunset Boulevard Block 3 Service Lane"]
  ];

  for (const b of initialBins) {
    insertBin.run(...b);
  }

  // Vehicles
  const insertVeh = db.prepare(`
    INSERT INTO vehicles (
      id, vehicle_number, driver_name, driver_phone,
      latitude, longitude, address, capacity_kg, current_load_kg, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVeh.run("VEH-01", "KA-20-EA-4412", "Ramesh Kumar", "+91 98450 11223", 13.3440, 74.7475, "Central Fleet Depot, Bay 1", 1500, 320, "Available");
  insertVeh.run("VEH-02", "KA-20-EA-8890", "Suresh Gowda", "+91 97410 44556", 13.3365, 74.7385, "Green Meadows Avenue", 1800, 950, "On Route");
  insertVeh.run("VEH-03", "KA-20-EA-3321", "Deepak Poojary", "+91 99001 77889", 13.3585, 74.7445, "Tech Park Maintenance Hub", 1200, 0, "Available");
}
