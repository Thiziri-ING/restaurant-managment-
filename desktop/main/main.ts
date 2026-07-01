import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  nativeImage,
  shell,
  dialog,
} from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc-handlers';

// ── Globals ───────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = !app.isPackaged;
const FRONTEND_URL = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../../dist/index.html')}`;

// ── Single instance lock ──────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ── Create main window ────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Restaurant Manager',
    icon: path.join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#1e293b',
      height: 40,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Prevent opening external links in the app window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL(FRONTEND_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadURL(FRONTEND_URL);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Minimize to tray on close
  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });
}

// ── System tray ───────────────────────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, '../../build/icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ouvrir Restaurant Manager',
      click: () => { mainWindow?.show(); mainWindow?.focus(); },
    },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: () => { tray = null; app.quit(); },
    },
  ]);

  tray.setToolTip('Restaurant Manager');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
}

// ── App menu ──────────────────────────────────────────────────
function createAppMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Application',
      submenu: [
        { label: 'Recharger', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.webContents.reload() },
        { type: 'separator' },
        { label: 'Quitter', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Plein écran', accelerator: 'F11', click: () => mainWindow?.setFullScreen(!mainWindow.isFullScreen()) },
        { label: 'Zoom +', accelerator: 'CmdOrCtrl+=', click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom -', accelerator: 'CmdOrCtrl+-', click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: 'Zoom normal', accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.setZoomLevel(0) },
      ],
    },
  ];

  if (isDev) {
    template.push({
      label: 'Dev',
      submenu: [
        { label: 'DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Lifecycle ─────────────────────────────────────────────────
app.whenReady().then(() => {
  createMainWindow();
  createTray();
  createAppMenu();
  setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  tray?.destroy();
});
