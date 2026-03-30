import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { grantDeepgramToken } from './lib/deepgramToken';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        {
          name: 'local-deepgram-token-route',
          configureServer(server) {
            server.middlewares.use('/api/deepgram/token', async (req, res, next) => {
              if (req.method !== 'POST') {
                next();
                return;
              }

              const apiKey = env.DEEPGRAM_API_KEY;
              if (!apiKey) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing DEEPGRAM_API_KEY' }));
                return;
              }

              try {
                const token = await grantDeepgramToken(apiKey);
                res.statusCode = 200;
                res.setHeader('Cache-Control', 'no-store');
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(token));
              } catch (error) {
                const details = error instanceof Error ? error.message : 'Unknown Deepgram error';
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Failed to grant Deepgram token', details }));
              }
            });
          },
        },
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@supabase/supabase-js')) {
                return 'supabase-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              if (id.includes('/views/')) {
                return 'views';
              }
              return undefined;
            },
          },
        },
      }
    };
});
