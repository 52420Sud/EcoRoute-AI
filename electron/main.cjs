const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;

// Optional: check if local backend server is running, if not spawn it
function ensureBackendServer() {
  const req = http.get('http://localhost:5000/api/sensors/dustbins', (res) => {
    console.log('[Electron] Backend server is already running on port 5000.');
  });
  req.on('error', () => {
    console.log('[Electron] Spawning internal backend server on port 5000...');
    try {
      require(path.join(__dirname, '../server/index.js'));
    } catch (e) {
      console.error('[Electron] Error starting background server:', e.message);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    icon: path.join(__dirname, '../public/icons/icon.ico'),
    title: 'EcoRoute AI - Smart Waste Management System',
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  ensureBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
