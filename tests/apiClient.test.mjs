import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/pilot/apiClient.js';
const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
test('CSRF refresh after login and cookies on every request', async () => {
  const seen = [];
  const client = createApiClient(async (path, options) => {
    seen.push([path, options]);
    return path.endsWith('/csrf') ? json(200, { csrf_token: `token${seen.length}` }) : json(200, { identity: {} });
  });
  await client.request('/api/v1/auth/institution/login', { method: 'POST', body: { username: 'synthetic' } });
  await client.request('/api/v1/admin/schools', { method: 'POST', body: {} });
  assert.equal(seen.filter(([path]) => path.endsWith('/csrf')).length, 2);
  assert.ok(seen.every(([, options]) => options.credentials === 'same-origin'));
  assert.equal(seen[1][1].headers['X-CSRF-TOKEN'], 'token1');
  assert.equal(seen[3][1].headers['X-CSRF-TOKEN'], 'token3');
});
test('only explicit CSRF rejection is retried once', async () => {
  let mutations = 0;
  const client = createApiClient(async (path) => path.endsWith('/csrf') ? json(200, { csrf_token: 'new' }) : (++mutations, json(419, {})));
  await assert.rejects(client.request('/api/v1/admin/schools', { method: 'POST' }), (e) => e.status === 419);
  assert.equal(mutations, 2);
});
test('uncertain network writes and server failures are never repeated', async () => {
  for (const failure of ['network', 'server']) {
    let mutations = 0;
    const client = createApiClient(async (path) => {
      if (path.endsWith('/csrf')) return json(200, { csrf_token: 'safe' });
      mutations++;
      if (failure === 'network') throw new TypeError('offline');
      return json(503, {});
    });
    await assert.rejects(client.request('/api/v1/admin/schools', { method: 'POST' }));
    assert.equal(mutations, 1);
  }
});
test('foreign URLs and HTML backend responses are rejected', async () => {
  const client = createApiClient(async () => new Response('<html>unavailable</html>'));
  await assert.rejects(client.request('https://example.invalid/api/v1/auth/session'));
  await assert.rejects(client.request('/api/v1/auth/session'), (e) => e.code === 'unavailable');
});
