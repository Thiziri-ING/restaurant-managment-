import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { setupIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

const BACKEND_DIR = 'C:/Users/USER/Desktop/DEmain/restau-management-/apps/backend';

function startBackend() {
  backendProcess = spawn('node', ['dist/src/main.js'], {
    cwd: BACKEND_DIR,
    shell: true,
    windowsHide: true,
  });

  backendProcess.stdout?.on('data', (data) => console.log(`[backend] ${data}`));
  backendProcess.stderr?.on('data', (data) => console.error(`[backend] ${data}`));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3001');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  setupIpcHandlers();

  // Laisser le temps au backend de démarrer avant d'afficher la fenêtre
  setTimeout(() => {
    createWindow();
  }, 4000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
