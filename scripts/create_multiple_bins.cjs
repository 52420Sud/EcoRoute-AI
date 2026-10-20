// create_multiple_bins.cjs - Creates 5 new smart dustbins in the system
const http = require('http');
const path = require('path');
const fs = require('fs');

async function createViaApi(count = 5) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ count });
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/dustbins/create-multiple',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
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

    req.write(postData);
    req.end();
  });
}

function createDirectlyInDb(count = 5) {
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = path.join(__dirname, '..', 'server', 'waste_management.db');
  
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Database file not found at ${dbPath}`);
  }

  const db = new DatabaseSync(dbPath);
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

    createdBins.push({ id, name, zone, fillLevel: fill, status });
  }

  return {
    success: true,
    message: `Created ${count} new smart bins directly in SQLite database`,
    created_count: count,
    bins: createdBins
  };
}

async function main() {
  const count = parseInt(process.argv[2] || '5', 10);
  console.log('======================================================================');
  console.log(`        ECO-ROUTE AI: CREATING ${count} NEW SMART DUSTBINS`);
  console.log('======================================================================\n');

  let result;
  try {
    result = await createViaApi(count);
    console.log('[+] Connected to running server! Created via Live API.');
  } catch (err) {
    console.log('[i] Server not responding, creating directly in SQLite database...');
    result = createDirectlyInDb(count);
    console.log('[+] Created directly in server/waste_management.db.');
  }

  console.log(`\n✅ Successfully added ${result.created_count || count} new smart bins:\n`);
  const list = result.bins || result.created || [];
  list.forEach(b => {
    const icon = b.status === 'Critical' ? '🔴' : b.status === 'Nearly Full' ? '🟡' : '🟢';
    console.log(`   - ${b.id.padEnd(8)}: ${icon} ${(b.fillLevel + '%').padEnd(5)} | ${b.status.padEnd(11)} | ${b.name}`);
  });
  console.log('\n======================================================================\n');
}

main().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
