import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { grantDeepgramToken } from './lib/deepgramToken';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        ...(command === 'build'
          ? [
              legacy({
                targets: ['ios >= 12', 'safari >= 12'],
                modernPolyfills: true,
                renderLegacyChunks: true,
              }),
            ]
          : []),
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
                res.statusCode = 503;
                writeTokenRouteHeaders(res);
                res.end(JSON.stringify({ error: 'Voice token service is not configured' }));
                return;
              }

              try {
                const token = await grantDeepgramToken(apiKey, env.DEEPGRAM_PROJECT_ID);
                res.statusCode = 200;
                writeTokenRouteHeaders(res);
                res.end(JSON.stringify(token));
              } catch (error) {
                res.statusCode = 502;
                writeTokenRouteHeaders(res);
                console.error('[local-deepgram-token-route] grant failed', {
                  message: error instanceof Error ? error.message : 'Unknown Deepgram error',
                });
                res.end(JSON.stringify({ error: 'Failed to grant voice token' }));
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

function writeTokenRouteHeaders(res: { setHeader(name: string, value: string): void }): void {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}
