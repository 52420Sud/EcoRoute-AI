// randomize_bins.cjs - Standalone script to randomize dustbin fill levels for Objective 3
const http = require('http');
const path = require('path');
const fs = require('fs');

async function randomizeViaApi() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/dustbins/randomize',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 3000
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Server request timed out'));
    });

    req.end();
  });
}

function randomizeDirectlyInDb() {
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = path.join(__dirname, '..', 'server', 'waste_management.db');
  
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found at ${dbPath}`);
  }

  const db = new DatabaseSync(dbPath);
  let rows = db.prepare('SELECT * FROM dustbins').all();
  if (rows.length < 10) {
    db.prepare('DELETE FROM dustbins').run();
    const insertBin = db.prepare(`
      INSERT INTO dustbins (
        id, name, zone, latitude, longitude, fill_level, status,
        capacity_liters, battery_level, sensor_health, last_updated,
        last_collected, active_complaint_count, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    rows = db.prepare('SELECT * FROM dustbins').all();
  }

  const nowIso = new Date().toISOString();
  const updateStmt = db.prepare(`
    UPDATE dustbins 
    SET fill_level = ?, status = ?, active_complaint_count = ?, last_updated = ?
    WHERE id = ?
  `);

  // Clear old alerts
  db.prepare("DELETE FROM system_alerts WHERE title LIKE '%Critical%' OR title LIKE '%Overflow%'").run();

  const insertAlertStmt = db.prepare(`
    INSERT INTO system_alerts (id, type, severity, title, message, location, dustbin_id, timestamp, read)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const shuffled = [...rows].sort(() => 0.5 - Math.random());
  const criticalCount = Math.floor(Math.random() * 3) + 5; // 5-7
  const mediumCount = Math.floor(Math.random() * 2) + 5;   // 5-6

  const updatedBins = [];

  shuffled.forEach((bin, index) => {
    let fill = 0;
    let status = 'Normal';
    let complaints = 0;

    if (index < criticalCount) {
      fill = Math.floor(Math.random() * 19) + 80; // 80-98%
      status = 'Critical';
      complaints = Math.floor(Math.random() * 3) + 1;

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
      fill = Math.floor(Math.random() * 31) + 45; // 45-75%
      status = 'Nearly Full';
      complaints = Math.random() > 0.65 ? 1 : 0;
    } else {
      fill = Math.floor(Math.random() * 26) + 10; // 10-35%
      status = 'Normal';
      complaints = 0;
    }

    updateStmt.run(fill, status, complaints, nowIso, bin.id);

    updatedBins.push({
      id: bin.id,
      name: bin.name,
      zone: bin.zone,
      fillLevel: fill,
      status,
      activeComplaintCount: complaints
    });
  });

  return {
    success: true,
    message: `Randomized ${updatedBins.length} bins directly in SQLite database`,
    critical_count: criticalCount,
    medium_count: mediumCount,
    normal_count: updatedBins.length - criticalCount - mediumCount,
    dustbins: updatedBins.sort((a, b) => b.fillLevel - a.fillLevel)
  };
}

async function main() {
  console.log('======================================================================');
  console.log('       ECO-ROUTE AI: OBJECTIVE 3 SMART BIN SCENARIO GENERATOR');
  console.log('======================================================================\n');
  console.log('[*] Generating random fill levels and citizen complaints for Objective 3...');

  let result;
  try {
    result = await randomizeViaApi();
    console.log('[+] Connected to running server! Updated via Live API.');
  } catch (err) {
    console.log('[i] Server not currently responding, updating SQLite database directly...');
    result = randomizeDirectlyInDb();
    console.log('[+] Updated directly in server/waste_management.db.');
  }

  console.log('\n======================================================================');
  console.log(`📊 SUMMARY OF RANDOMIZED BINS FOR OBJECTIVE 3:`);
  console.log(`   - 🔴 Critical Bins (≥80% Fill):  ${result.critical_count} bins (High Priority Pickup)`);
  console.log(`   - 🟡 Nearly Full (45%-75% Fill):  ${result.medium_count} bins (Medium Priority)`);
  console.log(`   - 🟢 Normal Bins (<40% Fill):     ${result.normal_count} bins (Skipped to save fuel)`);
  console.log('======================================================================\n');

  console.log('BIN ID   | FILL % | STATUS      | COMPLAINTS | LOCATION');
  console.log('----------------------------------------------------------------------');
  result.dustbins.slice(0, 12).forEach(b => {
    const icon = b.status === 'Critical' ? '🔴' : b.status === 'Nearly Full' ? '🟡' : '🟢';
    console.log(`${b.id.padEnd(8)} | ${icon} ${(b.fillLevel + '%').padEnd(5)} | ${b.status.padEnd(11)} | ${String(b.activeComplaintCount).padEnd(10)} | ${b.name}`);
  });

  if (result.dustbins.length > 12) {
    console.log(`... and ${result.dustbins.length - 12} more bins.`);
  }

  console.log('\n======================================================================');
  console.log('✅ OBJECTIVE 3 IS READY TO TEST!');
  console.log('   1. Open EcoRoute AI at http://localhost:5173');
  console.log('   2. Go to "Driver Console" or "Route Optimizer"');
  console.log('   3. Click "Run Route Optimizer" or "Generate & Dispatch Route"');
  console.log('   4. The 2-Opt TSP algorithm will optimize collection of all critical bins!');
  console.log('======================================================================\n');
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
