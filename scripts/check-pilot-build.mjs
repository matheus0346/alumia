import { readFile, readdir } from 'node:fs/promises';
const marker = JSON.parse(await readFile(new URL('../dist/build-mode.json', import.meta.url)));
if (marker.mode !== 'pilot') throw new Error('Build must be pilot.');
const dir = new URL('../dist/assets/', import.meta.url);
for (const file of await readdir(dir)) {
  if (!file.endsWith('.js')) continue;
  const code = await readFile(new URL(file, dir), 'utf8');
  for (const forbidden of ['admin123', 'localStorage', 'window.storage', 'api.anthropic.com', 'seedDatabase']) {
    if (code.includes(forbidden)) throw new Error(`Legacy demo leaked into pilot: ${forbidden}`);
  }
}
console.log('Pilot bundle isolated from legacy storage and credentials.');
