import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // '@duwoh/source': los paquetes del monorepo se consumen desde su código TS, sin build previo.
  resolve: { conditions: ['@duwoh/source', ...defaultClientConditions] },
  // Un único .env en la raíz del monorepo. Solo las variables VITE_* llegan al navegador.
  envDir: '../..',
  server: { port: 5173, strictPort: true },
});
