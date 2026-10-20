// start-all.js - Launches Node.js Express backend and Vite frontend simultaneously
import { spawn } from 'child_process';
import os from 'os';

// Helper: Get local Wi-Fi network IP address
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
const isWin = os.platform() === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('================================================================');
console.log('🚀 ECO-ROUTE AI: SMART WASTE MANAGEMENT SYSTEM IS STARTING...');
console.log('================================================================');
console.log(`💻 PC Local Web App:     http://localhost:5173`);
console.log(`📡 Backend API & IoT:    http://${localIp}:5000`);
console.log(`📱 SAMSUNG GALAXY M21:   http://${localIp}:5173`);
console.log('================================================================');
console.log('📲 HOW TO RUN AS APP ON YOUR SAMSUNG GALAXY M21:');
console.log(`   1. Connect your Samsung M21 to the SAME WI-FI as this PC.`);
console.log(`   2. Open Chrome on your phone and go to: http://${localIp}:5173`);
console.log(`   3. Tap the "Install App" button (or 3-dots in Chrome -> "Install App").`);
console.log(`   4. The EcoRoute AI App icon is added to your Samsung home screen!`);
console.log('================================================================\n');

// 1. Start Node.js Express Backend
const backend = spawn(npmCmd, ['run', 'server'], {
  stdio: 'inherit',
  shell: true
});

// 2. Start Vite Frontend with network host listening enabled
const frontend = spawn(npmCmd, ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// 3. Automatically open PC browser
setTimeout(() => {
  console.log(`\n🌐 Opening EcoRoute AI in PC browser at http://localhost:5173 ...\n`);
  const openCmd = isWin ? 'start http://localhost:5173' : (os.platform() === 'darwin' ? 'open http://localhost:5173' : 'xdg-open http://localhost:5173');
  spawn(openCmd, { shell: true, stdio: 'ignore' });
}, 2500);

function handleExit(code) {
  backend.kill();
  frontend.kill();
  process.exit(code || 0);
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('exit', handleExit);
