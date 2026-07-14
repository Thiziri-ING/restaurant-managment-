import { ipcMain, BrowserWindow, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';

export function setupIpcHandlers() {

  // ── Impression thermique (ticket de caisse 80mm) ──────────
  ipcMain.handle('print:ticket', async (_, pdfBuffer: ArrayBuffer) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) return { success: false, error: 'Pas de fenêtre active' };

      // Écrire le PDF dans un fichier temp puis l'imprimer
      const tmpPath = path.join(os.tmpdir(), `ticket-${Date.now()}.pdf`);
      fs.writeFileSync(tmpPath, Buffer.from(pdfBuffer));

      // Utiliser la fenêtre de print silencieux d'Electron
      const printWin = new BrowserWindow({ show: false });
      await printWin.loadFile(tmpPath);

      printWin.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: '', // imprimante par défaut
          margins: { marginType: 'none' },
        },
        (success, failureReason) => {
          printWin.close();
          fs.unlinkSync(tmpPath);
          if (!success) console.error('Print failed:', failureReason);
        },
      );

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ── Sauvegarde PDF (dialogue fichier) ─────────────────────
  ipcMain.handle('pdf:save', async (_, pdfBuffer: ArrayBuffer, filename: string) => {
    try {
      const { filePath } = await dialog.showSaveDialog({
        title: 'Enregistrer le PDF',
        defaultPath: filename,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (!filePath) return { success: false, cancelled: true };

      fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
      shell.showItemInFolder(filePath);
      return { success: true, filePath };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ── Ouvrir PDF avec lecteur par défaut ───────────────────
  ipcMain.handle('pdf:open', async (_, pdfBuffer: ArrayBuffer) => {
    try {
      const tmpPath = path.join(os.tmpdir(), `facture-${Date.now()}.pdf`);
      fs.writeFileSync(tmpPath, Buffer.from(pdfBuffer));
      await shell.openPath(tmpPath);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ── Info système ──────────────────────────────────────────
  ipcMain.handle('app:info', () => ({
    platform: process.platform,
    arch: process.arch,
    version: process.env.npm_package_version ?? '1.0.0',
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
  }));

  // ── Plein écran toggle ────────────────────────────────────
  ipcMain.handle('window:toggle-fullscreen', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.setFullScreen(!win.isFullScreen());
  });
}
