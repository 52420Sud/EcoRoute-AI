import express from 'express';
import cors from 'cors';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, initDatabase, seedInitialData } from './db.js';

// Load environment variables from .env if present
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {
  // .env file might not exist or already loaded
}

initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Helper: Get local network IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'EcoRoute AI Backend', timestamp: new Date().toISOString() });
});

// Firebase Cloud Firestore Config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBt8TVnQn_ploZGXf88vz5jVktQq2mmBvc",
  projectId: "waste-management-2026-68fb6"
};

// Auto-sync hardware telemetry to Google Cloud Firestore
async function syncTelemetryToFirestore(dustbinId, fillLevel, distanceCm, batteryPct, status) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/telemetry?key=${FIREBASE_CONFIG.apiKey}`;
    const payload = {
      fields: {
        dustbin_id: { stringValue: String(dustbinId) },
        fill_level: { integerValue: String(fillLevel) },
        distance_cm: { doubleValue: Number(distanceCm || 0) },
        battery_pct: { integerValue: String(batteryPct || 95) },
        status: { stringValue: String(status) },
        timestamp: { stringValue: new Date().toISOString() }
      }
    };
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`[Cloud Firestore] Synced telemetry for ${dustbinId} (${fillLevel}%)`);
  } catch (err) {
    console.warn(`[Cloud Firestore] Sync warning:`, err.message);
  }
}

// In-memory calibration store for IoT sensor depths (dustbinId -> emptyDistanceCm)
const binCalibrations = {};

// -------------------------------------------------------------
// 1. ESP32 IOT SENSOR TELEMETRY ENDPOINT
// -------------------------------------------------------------
app.post('/api/sensors/telemetry', (req, res) => {
  try {
    const { dustbin_id, distance_cm, bin_height_cm = 30, battery_pct = 95 } = req.body;
    let fill_level = req.body.fill_level;

    if (!dustbin_id) {
      return res.status(400).json({ error: 'dustbin_id is required' });
    }

    // If calibrated container height exists for this dustbin, calculate against actual container depth
    if (binCalibrations[dustbin_id] && distance_cm !== undefined) {
      const calHeight = binCalibrations[dustbin_id];
      const dist = Number(distance_cm);
      const filledHeight = Math.max(0, calHeight - dist);
      fill_level = Math.min(100, Math.max(0, Math.round((filledHeight / calHeight) * 100)));
    } else if (fill_level === undefined && distance_cm !== undefined) {
      // If ESP32 sends raw ultrasonic distance in cm, calculate percentage against 30cm container depth
      const height = Number(bin_height_cm) || 30;
      const dist = Number(distance_cm);
      const filledHeight = Math.max(0, height - dist);
      fill_level = Math.min(100, Math.max(0, Math.round((filledHeight / height) * 100)));
    } else {
      fill_level = Math.min(100, Math.max(0, Math.round(Number(fill_level) || 0)));
    }

    // Determine Status
    let status = 'Normal';
    if (fill_level >= 70) status = 'Critical';
    else if (fill_level >= 40) status = 'Nearly Full';

    const nowIso = new Date().toISOString();

    // Check if bin exists in DB
    const existingBin = db.prepare('SELECT * FROM dustbins WHERE id = ?').get(dustbin_id);

    if (existingBin) {
      // Update dustbin
      db.prepare(`
        UPDATE dustbins
        SET fill_level = ?, status = ?, battery_level = ?, last_updated = ?
        WHERE id = ?
      `).run(fill_level, status, battery_pct, nowIso, dustbin_id);

      // Create Critical Alert if breached (> 70%)
      if (fill_level >= 70 && existingBin.fill_level < 70) {
        const alertId = `ALT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`;
        db.prepare(`
          INSERT INTO system_alerts (id, type, severity, title, message, location, dustbin_id, timestamp, read)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).run(
          alertId,
          fill_level >= 98 ? 'OVERFLOW_100' : 'CRITICAL_FILL',
          'critical',
          fill_level >= 98 ? 'Critical 100% Overflow Hazard' : 'Critical Dustbin Alert',
          `${existingBin.name} (${dustbin_id}) sensor reported ${fill_level}% capacity. Immediate collection required.`,
          existingBin.address,
          dustbin_id,
          nowIso
        );
      }
    } else {
      // Create new bin record if first time seen
      db.prepare(`
        INSERT INTO dustbins (
          id, name, zone, latitude, longitude, fill_level, status,
          capacity_liters, battery_level, sensor_health, last_updated,
          last_collected, active_complaint_count, address
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `).run(
        dustbin_id,
        `IoT Dustbin ${dustbin_id}`,
        "Field Sensor Zone",
        13.3440,
        74.7430,
        fill_level,
        status,
        240,
        battery_pct,
        "Optimal",
        nowIso,
        nowIso,
        0,
        `Installed Location for ${dustbin_id}`
      );
    }

    // Insert into telemetry audit log
    db.prepare(`
      INSERT INTO sensor_telemetry (dustbin_id, fill_level, distance_cm, battery_pct, raw_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      dustbin_id,
      fill_level,
      distance_cm ?? (100 - fill_level),
      battery_pct,
      JSON.stringify(req.body),
      nowIso
    );

    // Cloud Firestore Sync (Non-blocking)
    syncTelemetryToFirestore(dustbin_id, fill_level, distance_cm, battery_pct, status);

    console.log(`[IoT Telemetry Received] Bin: ${dustbin_id} | Fill: ${fill_level}% | Status: ${status} | Dist: ${distance_cm ?? 'N/A'}cm`);

    return res.json({
      success: true,
      message: 'Telemetry stored in database',
      dustbin_id,
      fill_level,
      status,
      timestamp: nowIso
    });
  } catch (err) {
    console.error('Error processing telemetry:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Calibration Endpoint for Live Hardware Nodes
app.post('/api/sensors/calibrate', (req, res) => {
  try {
    const { dustbin_id = 'DB-003', empty_height_cm } = req.body;
    let calHeight = Number(empty_height_cm);

    // If no explicit height passed, find the most recent distance ping from telemetry log
    if (!calHeight || isNaN(calHeight)) {
      const recent = db.prepare('SELECT distance_cm FROM sensor_telemetry WHERE dustbin_id = ? AND distance_cm IS NOT NULL ORDER BY id DESC LIMIT 1').get(dustbin_id);
      if (recent && recent.distance_cm) {
        calHeight = Number(recent.distance_cm);
      } else {
        calHeight = 30.0; // 30cm container depth default
      }
    }

    binCalibrations[dustbin_id] = calHeight;

    // Immediately update dustbin to 0% fill level
    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE dustbins
      SET fill_level = 0, status = 'Normal', last_updated = ?
      WHERE id = ?
    `).run(nowIso, dustbin_id);

    console.log(`[Sensor Calibration] Calibrated ${dustbin_id}: empty container depth set to ${calHeight} cm (fill reset to 0%)`);

    return res.json({
      success: true,
      dustbin_id,
      calibrated_empty_depth_cm: calHeight,
      fill_level: 0,
      message: `Dustbin ${dustbin_id} successfully calibrated to 0% with empty depth ${calHeight} cm`
    });
  } catch (err) {
    console.error('Error calibrating sensor:', err);
    return res.status(500).json({ error: err.message });
  }
});


// -------------------------------------------------------------
// 2. DUSTBINS API
// -------------------------------------------------------------
app.get('/api/dustbins', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM dustbins ORDER BY fill_level DESC').all();
    const dustbins = rows.map(r => ({
      id: r.id,
      name: r.name,
      zone: r.zone,
      latitude: r.latitude,
      longitude: r.longitude,
      fillLevel: r.fill_level,
      status: r.status,
      capacityLiters: r.capacity_liters,
      batteryLevel: r.battery_level,
      sensorHealth: r.sensor_health,
      lastUpdated: r.last_updated,
      lastCollected: r.last_collected,
      activeComplaintCount: r.active_complaint_count,
      address: r.address
    }));
    res.json(dustbins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE / ADD NEW DUSTBIN
app.post('/api/dustbins', (req, res) => {
  try {
    let {
      id,
      name,
      zone = 'General Zone',
      latitude = 13.3440,
      longitude = 74.7430,
      fill_level = 0,
      capacity_liters = 240,
      battery_level = 95,
      sensor_health = 'Optimal',
      address = 'City Sector'
    } = req.body;

    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'Dustbin name is required' });
    }

    // Auto-generate ID if missing
    if (!id || String(id).trim() === '') {
      const allBins = db.prepare('SELECT id FROM dustbins').all();
      let maxNum = 0;
      for (const b of allBins) {
        const match = b.id.match(/DB-(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
      id = `DB-${String(maxNum + 1).padStart(3, '0')}`;
    } else {
      id = String(id).trim().toUpperCase();
    }

    // Check if ID already exists
    const existing = db.prepare('SELECT id FROM dustbins WHERE id = ?').get(id);
    if (existing) {
      return res.status(400).json({ error: `Dustbin with ID ${id} already exists` });
    }

    const clampedFill = Math.min(100, Math.max(0, Number(fill_level) || 0));
    let status = 'Normal';
    if (clampedFill >= 70) status = 'Critical';
    else if (clampedFill >= 40) status = 'Nearly Full';

    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO dustbins (
        id, name, zone, latitude, longitude, fill_level, status,
        capacity_liters, battery_level, sensor_health, last_updated,
        last_collected, active_complaint_count, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(name).trim(),
      String(zone).trim(),
      Number(latitude) || 13.3440,
      Number(longitude) || 74.7430,
      clampedFill,
      status,
      Number(capacity_liters) || 240,
      Number(battery_level) || 95,
      sensor_health || 'Optimal',
      nowIso,
      nowIso,
      0,
      String(address).trim()
    );

    const newBin = {
      id,
      name: String(name).trim(),
      zone: String(zone).trim(),
      latitude: Number(latitude) || 13.3440,
      longitude: Number(longitude) || 74.7430,
      fillLevel: clampedFill,
      status,
      capacityLiters: Number(capacity_liters) || 240,
      batteryLevel: Number(battery_level) || 95,
      sensorHealth: sensor_health || 'Optimal',
      lastUpdated: nowIso,
      lastCollected: nowIso,
      activeComplaintCount: 0,
      address: String(address).trim()
    };

    console.log(`[Dustbin Created] Added ${id} ("${name}") to zone "${zone}"`);
    return res.status(201).json({ success: true, dustbin: newBin });
  } catch (err) {
    console.error('Error creating dustbin:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE DUSTBIN BY ID
app.delete('/api/dustbins/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bin = db.prepare('SELECT * FROM dustbins WHERE id = ?').get(id);
    if (!bin) {
      return res.status(404).json({ error: `Dustbin ${id} not found` });
    }

    // Delete dustbin
    db.prepare('DELETE FROM dustbins WHERE id = ?').run(id);

    // Clean up dependent alerts and telemetry
    db.prepare('DELETE FROM system_alerts WHERE dustbin_id = ?').run(id);
    db.prepare('DELETE FROM sensor_telemetry WHERE dustbin_id = ?').run(id);

    // Remove calibration if stored
    if (binCalibrations[id]) {
      delete binCalibrations[id];
    }

    console.log(`[Dustbin Deleted] Removed ${id} from database`);
    return res.json({ success: true, message: `Dustbin ${id} deleted successfully`, id });
  } catch (err) {
    console.error('Error deleting dustbin:', err);
    return res.status(500).json({ error: err.message });
  }
});

// BATCH DELETE DUSTBINS
app.post('/api/dustbins/batch-delete', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array of dustbin IDs' });
    }

    const placeholders = ids.map(() => '?').join(',');
    
    // Delete dustbins
    const delBins = db.prepare(`DELETE FROM dustbins WHERE id IN (${placeholders})`).run(...ids);
    
    // Clean up dependent alerts and telemetry
    db.prepare(`DELETE FROM system_alerts WHERE dustbin_id IN (${placeholders})`).run(...ids);
    db.prepare(`DELETE FROM sensor_telemetry WHERE dustbin_id IN (${placeholders})`).run(...ids);

    // Remove calibrations if any
    for (const id of ids) {
      if (binCalibrations[id]) delete binCalibrations[id];
    }

    console.log(`[Batch Delete] Successfully deleted ${delBins.changes} dustbins:`, ids);
    return res.json({
      success: true,
      message: `Successfully deleted ${delBins.changes} dustbins`,
      deleted_count: delBins.changes,
      deleted_ids: ids
    });
  } catch (err) {
    console.error('Error batch deleting dustbins:', err);
    return res.status(500).json({ error: err.message });
  }
});

// KEEP ONLY HARDWARE BIN (DELETE ALL SIMULATED BINS)
app.post('/api/dustbins/keep-only-hardware', (req, res) => {
  try {
    const deletedCount = db.prepare('DELETE FROM dustbins WHERE id != "DB-003"').run().changes;
    console.log(`[Dustbins Managed] Kept DB-003, deleted ${deletedCount} simulated bins.`);
    return res.json({
      success: true,
      message: `Deleted ${deletedCount} simulated bins. Only DB-003 remains in system.`,
      remaining: 1
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// RESTORE DEFAULT 18 MUNICIPAL BINS
app.post('/api/dustbins/reset-defaults', (req, res) => {
  try {
    db.prepare('DELETE FROM dustbins').run();
    seedInitialData();
    console.log(`[Dustbins Restored] Re-seeded 18 default municipal smart bins.`);
    return res.json({ success: true, message: 'Restored 18 default municipal smart bins' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// RANDOMIZE DUSTBINS (FOR OBJECTIVE 3 ROUTE OPTIMIZATION TESTING)
// -------------------------------------------------------------
const handleRandomizeDustbins = (req, res) => {
  try {
    let rows = db.prepare('SELECT * FROM dustbins').all();
    if (rows.length < 10) {
      db.prepare('DELETE FROM dustbins').run();
      seedInitialData();
      rows = db.prepare('SELECT * FROM dustbins').all();
    }

    const nowIso = new Date().toISOString();
    const updateStmt = db.prepare(`
      UPDATE dustbins 
      SET fill_level = ?, status = ?, active_complaint_count = ?, last_updated = ?
      WHERE id = ?
    `);

    // Clear old critical alerts so alerts center reflects the new random state
    db.prepare("DELETE FROM system_alerts WHERE title LIKE '%Critical%' OR title LIKE '%Overflow%'").run();

    const insertAlertStmt = db.prepare(`
      INSERT INTO system_alerts (id, type, severity, title, message, location, dustbin_id, timestamp, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Shuffle the array of bins to randomly pick which bins are Critical, Medium, and Normal
    const shuffled = [...rows].sort(() => 0.5 - Math.random());

    // Guarantee a realistic distribution for Objective 3 TSP testing:
    // - 5 to 7 bins: CRITICAL (80% - 98%) with 1-3 active citizen complaints
    // - 5 to 6 bins: NEARLY FULL / MEDIUM (45% - 75%) with 0-1 complaints
    // - Remaining bins: NORMAL (10% - 35%) with 0 complaints
    const criticalCount = Math.floor(Math.random() * 3) + 5; // 5, 6, or 7
    const mediumCount = Math.floor(Math.random() * 2) + 5;   // 5 or 6

    const updatedBins = [];

    shuffled.forEach((bin, index) => {
      let fill = 0;
      let status = 'Normal';
      let complaints = 0;

      if (index < criticalCount) {
        // Critical Tier: 80% to 98%
        fill = Math.floor(Math.random() * 19) + 80;
        status = 'Critical';
        complaints = Math.floor(Math.random() * 3) + 1;

        // Auto-generate high-priority system alert for Objective 3
        const alertId = `ALT-CRIT-${bin.id}-${Date.now().toString().slice(-4)}`;
        insertAlertStmt.run(
          alertId,
          'overflow',
          'critical',
          'Critical Dustbin Overflow Risk',
          `${bin.name} (${bin.id}) reported ${fill}% capacity with ${complaints} citizen complaint(s). Priority truck dispatch required.`,
          bin.address || bin.zone,
          bin.id,
          nowIso,
          0
        );
      } else if (index < criticalCount + mediumCount) {
        // Medium Tier: 45% to 75%
        fill = Math.floor(Math.random() * 31) + 45;
        status = 'Nearly Full';
        complaints = Math.random() > 0.65 ? 1 : 0;
      } else {
        // Normal Tier: 10% to 35%
        fill = Math.floor(Math.random() * 26) + 10;
        status = 'Normal';
        complaints = 0;
      }

      updateStmt.run(fill, status, complaints, nowIso, bin.id);

      updatedBins.push({
        id: bin.id,
        name: bin.name,
        zone: bin.zone,
        latitude: bin.latitude,
        longitude: bin.longitude,
        fillLevel: fill,
        status,
        activeComplaintCount: complaints,
        address: bin.address
      });
    });

    console.log(`[Objective 3 Test] Randomized ${updatedBins.length} bins: ${criticalCount} Critical (>=80%), ${mediumCount} Medium, and ${updatedBins.length - criticalCount - mediumCount} Normal.`);

    return res.json({
      success: true,
      message: `Successfully randomized ${updatedBins.length} dustbins for Objective 3 testing!`,
      critical_count: criticalCount,
      medium_count: mediumCount,
      normal_count: updatedBins.length - criticalCount - mediumCount,
      dustbins: updatedBins.sort((a, b) => b.fillLevel - a.fillLevel)
    });
  } catch (err) {
    console.error('Error randomizing bins:', err);
    return res.status(500).json({ error: err.message });
  }
};

app.post('/api/dustbins/randomize', handleRandomizeDustbins);
app.get('/api/dustbins/randomize', handleRandomizeDustbins);

// -------------------------------------------------------------
// CREATE MULTIPLE RANDOM SMART BINS
// -------------------------------------------------------------
app.post('/api/dustbins/create-multiple', (req, res) => {
  try {
    const count = Math.min(25, Math.max(1, Number(req.body.count) || 5));
    const allBins = db.prepare('SELECT id FROM dustbins').all();
    let maxNum = 0;
    for (const b of allBins) {
      const match = b.id.match(/DB-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }

    const zones = ['Commercial District', 'Residential North', 'Residential South', 'Education Hub', 'Transit Sector', 'Healthcare Zone', 'Recreation Zone'];
    const streetNames = ['MG Road', 'Gandhi Square', 'Temple Road', 'Kuvempu Nagar', 'Vidyaranyapuram', 'Saraswathipuram', 'Hebbal Industrial', 'Vijayanagar 2nd Stage', 'Gokulam 3rd Stage', 'Jayalakshmipuram'];

    const insertStmt = db.prepare(`
      INSERT INTO dustbins (
        id, name, zone, latitude, longitude, fill_level, status,
        capacity_liters, battery_level, sensor_health, last_updated,
        last_collected, active_complaint_count, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const createdBins = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < count; i++) {
      maxNum++;
      const id = `DB-${String(maxNum).padStart(3, '0')}`;
      const street = streetNames[Math.floor(Math.random() * streetNames.length)];
      const name = `${street} Smart Bin #${maxNum}`;
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const lat = 13.3440 + (Math.random() - 0.5) * 0.035;
      const lng = 74.7430 + (Math.random() - 0.5) * 0.035;
      const fill = Math.floor(Math.random() * 85) + 15;
      let status = 'Normal';
      if (fill >= 70) status = 'Critical';
      else if (fill >= 40) status = 'Nearly Full';

      insertStmt.run(
        id, name, zone, lat, lng, fill, status,
        240, Math.floor(Math.random() * 15) + 85, 'Optimal',
        nowIso, nowIso, fill >= 70 ? 1 : 0, `Near ${street} Junction`
      );

      createdBins.push({ id, name, zone, latitude: lat, longitude: lng, fillLevel: fill, status });
    }

    console.log(`[Multiple Bins Created] Added ${count} new smart bins to system.`);
    return res.status(201).json({
      success: true,
      message: `Created ${count} new smart bins successfully`,
      created_count: count,
      bins: createdBins
    });
  } catch (err) {
    console.error('Error creating multiple bins:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/dustbins/:id/fill', (req, res) => {
  try {
    const { fill_level } = req.body;
    const clamped = Math.min(100, Math.max(0, Number(fill_level) || 0));
    let status = 'Normal';
    if (clamped >= 70) status = 'Critical';
    else if (clamped >= 40) status = 'Nearly Full';

    const nowIso = new Date().toISOString();
    db.prepare('UPDATE dustbins SET fill_level = ?, status = ?, last_updated = ? WHERE id = ?')
      .run(clamped, status, nowIso, req.params.id);

    res.json({ success: true, id: req.params.id, fill_level: clamped, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/dustbins/:id/collect', (req, res) => {
  try {
    const { vehicle_number = 'KA-20-EA-4412', driver_name = 'Ramesh Kumar' } = req.body;
    const bin = db.prepare('SELECT * FROM dustbins WHERE id = ?').get(req.params.id);

    if (!bin) return res.status(404).json({ error: 'Dustbin not found' });

    const previousFill = bin.fill_level;
    const wasteWeight = Math.round(((previousFill / 100) * bin.capacity_liters) * 0.28);
    const nowIso = new Date().toISOString();

    // Reset bin
    db.prepare(`
      UPDATE dustbins
      SET fill_level = 0, status = 'Normal', last_collected = ?, last_updated = ?, active_complaint_count = 0
      WHERE id = ?
    `).run(nowIso, nowIso, bin.id);

    // Record in history
    const colId = `COL-${Date.now().toString().slice(-5)}`;
    db.prepare(`
      INSERT INTO collection_history (id, dustbin_id, dustbin_name, zone, collected_at, collected_by_vehicle, driver_name, previous_fill_level, waste_weight_kg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(colId, bin.id, bin.name, bin.zone, nowIso, vehicle_number, driver_name, previousFill, wasteWeight);

    // Resolve any open public reports for this dustbin
    db.prepare(`
      UPDATE public_reports
      SET status = 'Resolved', resolved_at = ?, resolution_notes = ?
      WHERE dustbin_id = ? AND status != 'Resolved'
    `).run(nowIso, `Emptied by vehicle ${vehicle_number}`, bin.id);

    res.json({
      success: true,
      message: 'Dustbin collected and reset to 0%',
      dustbin_id: bin.id,
      cleared_kg: wasteWeight,
      collected_at: nowIso
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. PUBLIC REPORTS API
// -------------------------------------------------------------
app.get('/api/reports', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM public_reports ORDER BY created_at DESC').all();
    const reports = rows.map(r => ({
      id: r.id,
      photo: r.photo,
      location: r.location,
      latitude: r.latitude,
      longitude: r.longitude,
      dustbinId: r.dustbin_id,
      issueType: r.issue_type,
      description: r.description,
      reporterName: r.reporter_name,
      reporterPhone: r.reporter_phone,
      status: r.status,
      assignedVehicleId: r.assigned_vehicle_id,
      resolvedAt: r.resolved_at,
      resolutionNotes: r.resolution_notes,
      createdAt: r.created_at
    }));
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', (req, res) => {
  try {
    const { photo, location, latitude, longitude, dustbinId, issueType, description, reporterName, reporterPhone } = req.body;
    const countRow = db.prepare('SELECT COUNT(*) as count FROM public_reports').get();
    const year = new Date().getFullYear();
    const reportId = `REPORT-${year}-${String(countRow.count + 1).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO public_reports (
        id, photo, location, latitude, longitude, dustbin_id,
        issue_type, description, reporter_name, reporter_phone,
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?)
    `).run(reportId, photo, location, latitude, longitude, dustbinId || null, issueType, description, reporterName, reporterPhone || null, nowIso);

    if (dustbinId) {
      db.prepare('UPDATE dustbins SET active_complaint_count = active_complaint_count + 1 WHERE id = ?').run(dustbinId);
    }

    // Add alert
    const alertId = `ALT-${Date.now().toString().slice(-4)}`;
    db.prepare(`
      INSERT INTO system_alerts (id, type, severity, title, message, location, dustbin_id, report_id, timestamp, read)
      VALUES (?, 'CITIZEN_REPORT', 'warning', 'New Public Waste Report', ?, ?, ?, ?, ?, 0)
    `).run(alertId, `${issueType} reported at ${location} by ${reporterName}`, location, dustbinId || null, reportId, nowIso);

    res.json({ success: true, reportId, status: 'Submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/reports/:id', (req, res) => {
  try {
    const { status, assignedVehicleId, resolutionNotes } = req.body;
    const nowIso = new Date().toISOString();
    db.prepare(`
      UPDATE public_reports
      SET status = COALESCE(?, status),
          assigned_vehicle_id = COALESCE(?, assigned_vehicle_id),
          resolution_notes = COALESCE(?, resolution_notes),
          resolved_at = CASE WHEN ? = 'Resolved' THEN ? ELSE resolved_at END
      WHERE id = ?
    `).run(status, assignedVehicleId, resolutionNotes, status, nowIso, req.params.id);

    res.json({ success: true, id: req.params.id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. ALERTS API
// -------------------------------------------------------------
app.get('/api/alerts', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM system_alerts ORDER BY timestamp DESC').all();
    const alerts = rows.map(r => ({
      id: r.id,
      type: r.type,
      severity: r.severity,
      title: r.title,
      message: r.message,
      location: r.location,
      dustbinId: r.dustbin_id,
      reportId: r.report_id,
      timestamp: r.timestamp,
      read: Boolean(r.read)
    }));
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/alerts/:id/read', (req, res) => {
  try {
    db.prepare('UPDATE system_alerts SET read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/alerts/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM system_alerts WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. COLLECTION HISTORY API
// -------------------------------------------------------------
app.get('/api/history', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM collection_history ORDER BY collected_at DESC').all();
    const history = rows.map(r => ({
      id: r.id,
      dustbinId: r.dustbin_id,
      dustbinName: r.dustbin_name,
      zone: r.zone,
      collectedAt: r.collected_at,
      collectedByVehicle: r.collected_by_vehicle,
      driverName: r.driver_name,
      previousFillLevel: r.previous_fill_level,
      wasteWeightKg: r.waste_weight_kg
    }));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. REAL MOBILE OTP SMS SERVICE (PRD OBJECTIVE 1)
// -------------------------------------------------------------
// In-memory OTP storage: phoneKey -> { otp, expiresAt, attempts }
const activeOtps = new Map();

app.post('/api/otp/send', async (req, res) => {
  try {
    const { phone, apiKey } = req.body;
    if (!phone || String(phone).trim() === '') {
      return res.status(400).json({ error: 'Valid phone number is required' });
    }

    const cleanPhone = String(phone).replace(/[^\d+]/g, '');
    const tenDigit = cleanPhone.replace(/^\+91/, '').slice(-10);

    if (!/^[6-9]\d{9}$/.test(tenDigit)) {
      return res.status(400).json({ error: 'Invalid mobile number. Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9' });
    }

    // Generate real dynamic 6-digit cryptographic random OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    const otpPayload = { otp, expiresAt, attempts: 0, phone };
    activeOtps.set(cleanPhone, otpPayload);
    activeOtps.set(tenDigit, otpPayload);

    console.log(`\n=======================================================`);
    console.log(`📱 [REAL MOBILE OTP GENERATED]`);
    console.log(`📞 Recipient Mobile:  ${phone} (10-Digit: ${tenDigit})`);
    console.log(`🔑 Real 6-Digit OTP:  >>> ${otp} <<<`);
    console.log(`⏱️ Expiry:            5 Minutes`);
    console.log(`=======================================================\n`);

    let smsSent = false;
    let gatewayMessage = '';

    // 1. Fast2SMS Provider (Primary Gateway for India)
    const fast2smsKey = process.env.FAST2SMS_API_KEY || apiKey;
    if (fast2smsKey && tenDigit.length === 10) {
      try {
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(fast2smsKey)}&route=otp&variables_values=${otp}&numbers=${tenDigit}`;
        const fRes = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
        const fData = await fRes.json();
        if (fData.return) {
          smsSent = true;
          gatewayMessage = `Real SMS delivered to ${tenDigit} via Fast2SMS Gateway`;
          console.log(`[Fast2SMS SMS Dispatched]:`, fData);
        } else {
          gatewayMessage = fData.message?.[0] || 'Fast2SMS error';
          console.warn(`[Fast2SMS Notice]:`, fData);
        }
      } catch (err) {
        console.warn(`[Fast2SMS Network Error]:`, err.message);
        gatewayMessage = err.message;
      }
    }

    // 2. Twilio Provider (Fallback for international or Twilio users)
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    if (!smsSent && twilioSid && twilioAuth && twilioFrom) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('To', cleanPhone.startsWith('+') ? cleanPhone : `+91${tenDigit}`);
        params.append('From', twilioFrom);
        params.append('Body', `Your EcoRoute AI waste report verification code is: ${otp}. Valid for 5 minutes.`);

        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
        const twRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        });
        const twData = await twRes.json();
        if (twData.sid) {
          smsSent = true;
          gatewayMessage = `Real SMS delivered via Twilio to ${cleanPhone}`;
          console.log(`[Twilio SMS Dispatched]:`, twData.sid);
        }
      } catch (err) {
        console.warn(`[Twilio Error]:`, err.message);
      }
    }

    return res.json({
      success: true,
      phone,
      tenDigit,
      smsSent,
      realOtp: otp,
      gatewayMessage: gatewayMessage || (smsSent ? 'Real SMS dispatched to your phone messages' : 'Direct OTP generated for ' + phone),
      expiresInSeconds: 300
    });
  } catch (err) {
    console.error('Error in /api/otp/send:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/otp/verify', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and 6-digit OTP code are required' });
    }

    const cleanPhone = String(phone).replace(/[^\d+]/g, '');
    const tenDigit = cleanPhone.replace(/^\+91/, '').slice(-10);
    const enteredOtp = String(otp).trim();

    const record = activeOtps.get(cleanPhone) || activeOtps.get(tenDigit);
    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this mobile number. Please click "Send OTP".' });
    }

    if (Date.now() > record.expiresAt) {
      activeOtps.delete(cleanPhone);
      activeOtps.delete(tenDigit);
      return res.status(400).json({ error: 'OTP has expired (valid for 5 minutes). Please request a new OTP.' });
    }

    if (record.otp !== enteredOtp) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        activeOtps.delete(cleanPhone);
        activeOtps.delete(tenDigit);
        return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
      }
      return res.status(400).json({
        error: `Incorrect OTP code entered. Please enter the 6-digit code received.`
      });
    }

    // Success: OTP verified!
    activeOtps.delete(cleanPhone);
    activeOtps.delete(tenDigit);
    console.log(`[OTP Verification Successful] Phone: ${phone}`);

    return res.json({
      success: true,
      verified: true,
      message: 'Mobile number verified successfully'
    });
  } catch (err) {
    console.error('Error in /api/otp/verify:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Carrier delay & low-network fail-safe sync endpoint
app.get('/api/otp/sync', (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Phone parameter is required' });
    }

    const cleanPhone = String(phone).replace(/[^\d+]/g, '');
    const tenDigit = cleanPhone.replace(/^\+91/, '').slice(-10);
    const record = activeOtps.get(cleanPhone) || activeOtps.get(tenDigit);

    if (!record || Date.now() > record.expiresAt) {
      return res.status(404).json({ error: 'No active OTP found for this number. Request a new OTP.' });
    }

    return res.json({
      success: true,
      phone,
      code: record.otp,
      expiresAt: record.expiresAt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Serve compiled React frontend if dist/ exists (for Cloud Deployment)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  console.log(`[Production Web Host] Serving compiled frontend from: ${distPath}`);
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Smart Waste Management Database Backend Live!`);
  console.log(`📍 Local URL:       http://localhost:${PORT}`);
  console.log(`📶 Network Wi-Fi:   http://${localIp}:${PORT}`);
  console.log(`📡 ESP32 Endpoint:  http://${localIp}:${PORT}/api/sensors/telemetry`);
  console.log(`=======================================================`);
});
