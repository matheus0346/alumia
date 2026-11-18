import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode, command }) => {
  const demo = mode === 'demo';
  return {
    plugins: [react(), { name: 'application-mode', generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'build-mode.json', source: JSON.stringify({ mode: demo ? 'demo' : 'pilot' }) });
    } }],
    resolve: { alias: { '#application': fileURLToPath(new URL(demo ? './src/DemoApp.jsx' : './src/pilot/PilotApp.jsx', import.meta.url)) } },
    base: command === 'build' ? (demo ? './' : '/app/') : '/',
    // Preserve the Vite 5 syntax target during this toolchain upgrade.
    build: { target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'] },
    server: { proxy: { '/api': { target: 'http://127.0.0.1:8000' } } },
  };
});
