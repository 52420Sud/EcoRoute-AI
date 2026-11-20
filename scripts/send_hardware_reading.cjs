const https = require('https');
const http = require('http');

// Default target: Live Cloud Render backend
const RENDER_URL = 'https://ecoroute-ai-v4jd.onrender.com/api/sensors/telemetry';
const LOCAL_URL  = 'http://localhost:5000/api/sensors/telemetry';

// Read arguments: node send_hardware_reading.js [fillLevel] [binId] [distanceCm]
const fillLevel = process.argv[2] ? parseInt(process.argv[2], 10) : 85;
const binId     = process.argv[3] || 'DB-003';
const distance  = process.argv[4] ? parseFloat(process.argv[4]) : Math.max(2, Math.round((1 - fillLevel / 100) * 30 * 10) / 10);

const payload = JSON.stringify({
  dustbin_id: binId,
  fill_level: fillLevel,
  distance_cm: distance,
  bin_height_cm: 30.0,
  battery_pct: 95
});

console.log('======================================================================');
console.log('📡 EcoRoute AI: Dispatching IoT Hardware Telemetry Reading');
console.log('======================================================================');
console.log(`Node ID:         ${binId}`);
console.log(`Simulated Fill:  ${fillLevel}% (${fillLevel >= 80 ? 'CRITICAL OVERFLOW' : fillLevel >= 50 ? 'Nearly Full' : 'Normal'})`);
console.log(`Sensor Distance: ${distance} cm (Ultrasonic HC-SR04)`);
console.log(`Target Cloud:    ${RENDER_URL}`);
console.log('----------------------------------------------------------------------');

function sendPost(targetUrl) {
  return new Promise((resolve) => {
    try {
      const isHttps = targetUrl.startsWith('https:');
      const client = isHttps ? https : http;
      const urlObj = new URL(targetUrl);

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'ESP32-IoT-Node'
        },
        timeout: 8000
      };

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[OK] Server Response (${res.statusCode}): ${body}`);
            resolve(true);
          } else {
            console.log(`[WARN] Server returned ${res.statusCode}: ${body}`);
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        console.log(`[OFFLINE] Could not reach ${targetUrl} (${err.message})`);
        resolve(false);
      });

      req.write(payload);
      req.end();
    } catch (e) {
      console.log(`[ERROR] ${e.message}`);
      resolve(false);
    }
  });
}

(async () => {
  console.log('Transmitting to Cloud Backend on Render...');
  const cloudOk = await sendPost(RENDER_URL);

  console.log('\nTransmitting to Local Backend (if running)...');
  await sendPost(LOCAL_URL);

  console.log('\n======================================================================');
  if (cloudOk) {
    console.log('✅ SUCCESS! Telemetry stored in cloud database.');
    console.log('👉 Refresh your live dashboard now:');
    console.log('   https://eco-route-ai-beryl.vercel.app/');
    console.log(`   Look at Node ${binId}: Fill Level is now ${fillLevel}%!`);
  } else {
    console.log('⚠️ Cloud post failed. Please check your internet connection.');
  }
  console.log('======================================================================');
})();
