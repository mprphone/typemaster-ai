import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';
    const model = env.GEMINI_MODEL || env.VITE_GEMINI_MODEL || '';
    const perMinuteLimit = env.GEMINI_PER_MINUTE_LIMIT || env.VITE_GEMINI_PER_MINUTE_LIMIT || '';

    return {
      envPrefix: ['VITE_', 'GEMINI_'],
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_MODEL': JSON.stringify(model),
        'process.env.GEMINI_PER_MINUTE_LIMIT': JSON.stringify(perMinuteLimit),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
