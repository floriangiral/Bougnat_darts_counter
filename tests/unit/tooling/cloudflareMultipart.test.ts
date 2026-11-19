import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Cloudflare multipart dependency compatibility', () => {
  it('keeps deprecated packages out of the locked dependency tree', () => {
    const lock: { packages: Record<string, { deprecated?: string }> } = JSON.parse(
      readFileSync(new URL('../../../package-lock.json', import.meta.url), 'utf8'),
    );
    expect(Object.entries(lock.packages).filter(([, entry]) => entry.deprecated)).toEqual([]);
    expect(lock.packages).not.toHaveProperty('node_modules/node-domexception');
  });

  it.each(['commonjs', 'module'])('preserves uploads through the %s entry point without warnings', (mode) => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import { createRequire } from 'node:module';
      import { createServer } from 'node:http';
      import { once } from 'node:events';
      const require = createRequire(import.meta.url);
      const sdk = ${mode === 'commonjs' ? "require('cloudflare')" : "await import('cloudflare')"};
      const uploads = ${mode === 'commonjs' ? "require('cloudflare/uploads')" : "await import('cloudflare/uploads')"};
      const warnings = [];
      process.on('warning', (warning) => warnings.push(warning));
      const received = [];
      const server = createServer((request, response) => {
        const chunks = [];
        request.on('data', (chunk) => chunks.push(chunk));
        request.on('end', () => {
          received.push({ headers: request.headers, body: Buffer.concat(chunks) });
          response.writeHead(200, { 'Content-Type': 'application/json' });
          response.end('{"success":true,"result":{"id":"local-upload"}}');
        });
      });
      server.listen(0, '127.0.0.1');
      await once(server, 'listening');
      try {
        const address = server.address();
        assert.ok(address && typeof address !== 'string');
        const client = new sdk.Cloudflare({
          apiToken: 'local-test-only',
          baseURL: 'http://127.0.0.1:' + address.port,
          maxRetries: 0,
          timeout: 5000,
        });
        const bytes = new Uint8Array([0, 1, 127, 128, 255]);
        const file = await uploads.toFile(bytes, 'asset.bin', { type: 'application/octet-stream' });
        const options = await uploads.multipartFormRequestOptions({
          body: { file, label: 'deployment', enabled: true },
        });
        await client.post('/upload', options);
        assert.equal(received.length, 1);
        const { headers, body } = received[0];
        assert.match(headers['content-type'], /^multipart\\/form-data; boundary=/);
        assert.equal(Number(headers['content-length']), body.byteLength);
        const form = await new Response(body, {
          headers: { 'Content-Type': headers['content-type'] },
        }).formData();
        assert.equal(form.get('label'), 'deployment');
        assert.equal(form.get('enabled'), 'true');
        const uploaded = form.get('file');
        assert.ok(uploaded instanceof File);
        assert.equal(uploaded.name, 'asset.bin');
        assert.deepEqual(new Uint8Array(await uploaded.arrayBuffer()), bytes);
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(warnings.length, 0);
      } finally {
        await new Promise((resolve, reject) => {
          server.close((error) => error ? reject(error) : resolve());
          server.closeAllConnections();
        });
      }
      console.log('Multipart upload verified');
    `], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 });

    if (result.error) throw result.error;
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout.trim()).toBe('Multipart upload verified');
  });
});
