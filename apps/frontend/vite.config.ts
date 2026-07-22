import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const preferredPort = Number(env.VITE_PORT ?? '3001');

  return {
    plugins: [react()],
    base: './', // important pour Electron (chemins relatifs)
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: env.VITE_HOST ?? '0.0.0.0',
      port: preferredPort,
      strictPort: false,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL ?? 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});
