import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // SECURITY: GEMINI_API_KEY must NOT be bundled into the client.
      // It is used only by the server-side proxy (api/gemini/parse.ts).
      // define: {} intentionally omitted.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
