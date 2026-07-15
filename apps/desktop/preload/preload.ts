import { contextBridge, ipcRenderer } from 'electron';

/**
 * API exposée au renderer via window.electronAPI
 * contextBridge garantit la séparation entre le process main et le renderer
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ── Impression ───────────────────────────────────────────
  printTicket: (pdfBuffer: ArrayBuffer) =>
    ipcRenderer.invoke('print:ticket', pdfBuffer),

  // ── PDF ──────────────────────────────────────────────────
  savePdf: (pdfBuffer: ArrayBuffer, filename: string) =>
    ipcRenderer.invoke('pdf:save', pdfBuffer, filename),

  openPdf: (pdfBuffer: ArrayBuffer) =>
    ipcRenderer.invoke('pdf:open', pdfBuffer),

  // ── System ───────────────────────────────────────────────
  getAppInfo: () => ipcRenderer.invoke('app:info'),

  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),

  // ── Détection de l'environnement Electron ────────────────
  isElectron: true,
});

// ── TypeScript types pour le renderer ────────────────────────
export {};

declare global {
  interface Window {
    electronAPI: {
      printTicket: (pdfBuffer: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
      savePdf: (pdfBuffer: ArrayBuffer, filename: string) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>;
      openPdf: (pdfBuffer: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
      getAppInfo: () => Promise<{ platform: string; arch: string; version: string; electronVersion: string; nodeVersion: string }>;
      toggleFullscreen: () => Promise<void>;
      isElectron: boolean;
    };
  }
}
