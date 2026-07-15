/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Electron contextBridge API — injecté via preload.ts
interface ElectronAPI {
  printTicket: (pdfBuffer: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
  savePdf: (pdfBuffer: ArrayBuffer, filename: string) => Promise<{
    success: boolean;
    filePath?: string;
    cancelled?: boolean;
    error?: string;
  }>;
  openPdf: (pdfBuffer: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
  getAppInfo: () => Promise<{
    platform: string;
    arch: string;
    version: string;
    electronVersion: string;
    nodeVersion: string;
  }>;
  toggleFullscreen: () => Promise<void>;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
